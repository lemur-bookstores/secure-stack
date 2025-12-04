import { SecureStack, SecureStackConfig, Router } from '@lemur-bookstores/core';
import { AuthModule, AuthModuleConfig } from '@lemur-bookstores/auth';
import Fastify, { FastifyInstance } from 'fastify';
import { registerHTTPRouter } from '../protocols/http';

export interface SecureStackServerConfig extends SecureStackConfig {
    host?: string;
    apiPrefix?: string;
    auth?: AuthModuleConfig;
    cors?: {
        origin?: string | string[] | boolean;
        credentials?: boolean;
        methods?: string | string[];
        allowedHeaders?: string | string[];
        exposedHeaders?: string | string[];
    };
}

export interface LifecycleHooks {
    onStart?: () => Promise<void> | void;
    onReady?: () => Promise<void> | void;
    onShutdown?: () => Promise<void> | void;
}

export class SecureStackServer extends SecureStack {
    private fastify: FastifyInstance;
    private serverConfig: SecureStackServerConfig;
    private hooks: LifecycleHooks = {};
    private isRunning = false;
    private httpRouters: Map<string, Router> = new Map();
    public readonly auth?: AuthModule;

    constructor(config: SecureStackServerConfig) {
        super(config);
        this.serverConfig = config;
        this.fastify = Fastify({
            logger: {
                level: process.env.LOG_LEVEL || 'info',
            },
        });

        if (config.auth) {
            this.auth = new AuthModule(config.auth);
        }
    }

    /**
     * Register lifecycle hooks
     */
    hook(hookName: keyof LifecycleHooks, handler: () => Promise<void> | void): this {
        this.hooks[hookName] = handler;
        return this;
    }

    /**
     * Register a router for HTTP endpoints
     */
    override router(name: string, router: Router): this {
        super.router(name, router);
        this.httpRouters.set(name, router);
        return this;
    }

    /**
     * Initialize the server
     */
    private async init() {
        // CORS
        if (this.serverConfig.cors) {
            try {
                await this.fastify.register(require('@fastify/cors'), {
                    origin: this.serverConfig.cors.origin || '*',
                    credentials: this.serverConfig.cors.credentials || false,
                    methods: this.serverConfig.cors.methods,
                    allowedHeaders: this.serverConfig.cors.allowedHeaders,
                    exposedHeaders: this.serverConfig.cors.exposedHeaders,
                });
            } catch (error) {
                console.warn('[SecureStackServer] CORS plugin not available, skipping...');
            }
        }

        // Health check endpoint
        this.fastify.get('/health', async () => {
            return {
                status: 'ok',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                service: this.serverConfig.name,
            };
        });

        // Ready check endpoint
        this.fastify.get('/ready', async () => {
            return {
                status: this.isRunning ? 'ready' : 'starting',
                service: this.serverConfig.name,
            };
        });

        // Metrics endpoint (basic)
        this.fastify.get('/metrics', async () => {
            return {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
            };
        });

        // Register HTTP routes
        this.registerHTTPRoutes();

        // Call onStart hook
        if (this.hooks.onStart) {
            await this.hooks.onStart();
        }
    }

    /**
     * Register HTTP endpoints from routers
     */
    private registerHTTPRoutes() {
        const prefix = this.serverConfig.apiPrefix || '/api';

        this.httpRouters.forEach((router, name) => {
            registerHTTPRouter(this.fastify, router, {
                prefix: `${prefix}/${name}`,
            });
        });
    }

    /**
     * Start the server
     */
    override async start(): Promise<void> {
        await this.init();
        await super.start();

        const host = this.serverConfig.host || '0.0.0.0';
        const port = this.serverConfig.port;

        try {
            await this.fastify.listen({ port, host });
            this.isRunning = true;

            console.log(`[SecureStackServer] 🚀 HTTP Server listening at http://${host}:${port}`);
            console.log(`[SecureStackServer] 📊 Health: http://${host}:${port}/health`);
            console.log(`[SecureStackServer] 🔍 Metrics: http://${host}:${port}/metrics`);
            if (this.httpRouters.size > 0) {
                console.log(`[SecureStackServer] 📡 API Prefix: ${this.serverConfig.apiPrefix || '/api'}`);
            }

            // Call onReady hook
            if (this.hooks.onReady) {
                await this.hooks.onReady();
            }
        } catch (err) {
            this.fastify.log.error(err);
            throw new Error(`Failed to start server: ${err}`);
        }
    }

    /**
     * Stop the server gracefully
     */
    override async stop(): Promise<void> {
        console.log('[SecureStackServer] Initiating graceful shutdown...');

        // Call onShutdown hook
        if (this.hooks.onShutdown) {
            await this.hooks.onShutdown();
        }

        this.isRunning = false;
        await this.fastify.close();
        await super.stop();

        console.log('[SecureStackServer] ✓ Server stopped gracefully');
    }

    /**
     * Get Fastify instance for advanced usage
     */
    get server(): FastifyInstance {
        return this.fastify;
    }
}

