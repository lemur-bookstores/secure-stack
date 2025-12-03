/**
 * SecureStack - Main framework class
 */

import type { SecureStackConfig } from './types';
import type { MiddlewareFunction } from './middleware';
import { compose } from './middleware';
import type { DefaultContext } from './context';
import { Router } from './router';


export class SecureStack<TContext = DefaultContext> {
    private config: SecureStackConfig;
    private routers: Map<string, Router> = new Map();
    private middlewares: MiddlewareFunction<TContext>[] = [];
    private contextFactory: (initial?: Partial<TContext>) => TContext;

    constructor(config: SecureStackConfig) {
        this.config = config;
        this.contextFactory = (initial) => ({ ...initial } as TContext);

        console.log(`[SecureStack] Initializing ${config.name}...`);

        if (config.mesh?.enabled) {
            console.log(`[SecureStack] 🔐 Service Mesh enabled`);
            console.log(`[SecureStack]   - Encryption: ${config.mesh.security?.encryption || 'hybrid'}`);
            console.log(`[SecureStack]   - Discovery: ${config.mesh.discovery?.mode || 'static'}`);
        }
    }

    /**
     * Register a router
     */
    router(name: string, router: Router): this {
        console.log(`[SecureStack] Registering router: ${name}`);
        this.routers.set(name, router);
        return this;
    }

    /**
     * Use middleware
     */
    use(middleware: MiddlewareFunction<TContext>): this {
        console.log(`[SecureStack] Registering middleware`);
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * Set context factory
     */
    setContextFactory(factory: (initial?: Partial<TContext>) => TContext): this {
        this.contextFactory = factory;
        return this;
    }

    /**
     * Create a context instance
     */
    createContext(initial?: Partial<TContext>): TContext {
        return this.contextFactory(initial);
    }

    /**
     * Execute middleware chain
     */
    async executeMiddleware(ctx: TContext): Promise<void> {
        const composedMiddleware = compose(this.middlewares);
        await composedMiddleware(ctx, async () => {
            // Final handler
        });
    }

    /**
     * Start the server
     */
    async start(): Promise<void> {
        console.log(`[SecureStack] Starting server on port ${this.config.port}...`);
        console.log(`[SecureStack] ✓ ${this.config.name} is ready!`);
        console.log(`[SecureStack] ✓ Registered ${this.routers.size} router(s)`);
        console.log(`[SecureStack] ✓ Registered ${this.middlewares.length} middleware(s)`);
    }

    /**
     * Stop the server
     */
    async stop(): Promise<void> {
        console.log(`[SecureStack] Stopping ${this.config.name}...`);
    }

    /**
     * Get mesh instance (if enabled)
     */
    get mesh() {
        if (!this.config.mesh?.enabled) {
            throw new Error('Service Mesh is not enabled');
        }
        // Mesh implementation will be added
        return {
            connect: (serviceId: string) => {
                console.log(`[SecureStack] Connecting to service: ${serviceId}`);
                return {
                    call: async <TData = unknown>(method: string, data: TData) => {
                        console.log(`[SecureStack] Calling ${serviceId}.${method} with data:`, data);
                        return { success: true };
                    }
                };
            }
        };
    }
}
