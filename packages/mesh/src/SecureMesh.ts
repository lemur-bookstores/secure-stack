/**
 * Secure Mesh - Main Service Mesh Implementation
 */

import { CryptoManager } from './crypto/CryptoManager';
import { JWTManager } from './auth/JWTManager';
import { SessionManager } from './auth/SessionManager';
import { StaticDiscovery } from './discovery/StaticDiscovery';
import { SecureMeshClient } from './client/SecureMeshClient';
import type { ServiceInfo } from './discovery/types';
import { RateLimiter } from './resilience/RateLimiter';
import { CircuitBreaker } from './resilience/CircuitBreaker';
import { RetryPolicy } from './resilience/RetryPolicy';
import { MetricsCollector } from './monitoring/MetricsCollector';
import { AuditLogger } from './monitoring/AuditLogger';
import { KeyRotation } from './rotation/KeyRotation';
import { HealthMonitor } from './health/HealthMonitor';
import { MonitoringAdapter } from './monitoring/types';

export interface SecureMeshConfig {
    serviceId: string;
    port: number;
    security?: {
        rsaKeySize?: number;
        aesKeySize?: number;
        jwtSecret?: string;
        sessionTimeout?: number;
    };
    discovery?: {
        services?: ServiceInfo[];
    };
    resilience?: {
        rateLimit?: {
            maxRequests: number;
            windowMs: number;
        };
        circuitBreaker?: {
            failureThreshold: number;
            successThreshold: number;
            timeout: number;
        };
        retry?: {
            maxAttempts: number;
            initialDelay: number;
        };
    };
    monitoring?: {
        enabled: boolean;
        adapters?: MonitoringAdapter[];
    };
    rotation?: {
        interval: number;
        autoRotate: boolean;
    };
}

export class SecureMesh {
    private config: SecureMeshConfig;
    private cryptoManager: CryptoManager;
    private jwtManager: JWTManager;
    private sessionManager: SessionManager;
    private discovery: StaticDiscovery;
    private client: SecureMeshClient;

    // Resilience & Monitoring
    private rateLimiter: RateLimiter;
    private retryPolicy: RetryPolicy;
    private metricsCollector: MetricsCollector;
    private auditLogger: AuditLogger;
    private keyRotation: KeyRotation;
    private healthMonitor: HealthMonitor;
    private circuitBreakers: Map<string, CircuitBreaker> = new Map();

    private initialized = false;

    constructor(config: SecureMeshConfig) {
        this.config = config;

        // Initialize managers
        this.cryptoManager = new CryptoManager({
            rsaKeySize: config.security?.rsaKeySize || 4096,
            aesKeySize: config.security?.aesKeySize || 256,
        });

        this.jwtManager = new JWTManager({
            secret: config.security?.jwtSecret,
            expiresIn: '1h',
        });

        this.sessionManager = new SessionManager({
            sessionTimeout: config.security?.sessionTimeout || 3600000,
        });

        this.discovery = new StaticDiscovery(config.discovery?.services || []);

        // Initialize Resilience & Monitoring
        this.rateLimiter = new RateLimiter({
            maxRequests: config.resilience?.rateLimit?.maxRequests || 1000,
            windowMs: config.resilience?.rateLimit?.windowMs || 60000,
        });

        this.retryPolicy = new RetryPolicy({
            maxAttempts: config.resilience?.retry?.maxAttempts || 3,
            initialDelay: config.resilience?.retry?.initialDelay || 1000,
        });

        this.metricsCollector = new MetricsCollector();

        this.auditLogger = new AuditLogger({
            enabled: config.monitoring?.enabled !== false,
            adapters: config.monitoring?.adapters,
        });

        this.keyRotation = new KeyRotation(
            config.serviceId,
            this.cryptoManager,
            {
                rotationInterval: config.rotation?.interval || 3600000,
                autoRotate: config.rotation?.autoRotate !== false,
            },
            this.auditLogger
        );

        this.healthMonitor = new HealthMonitor();

        this.client = new SecureMeshClient({
            serviceId: config.serviceId,
            cryptoManager: this.cryptoManager,
            jwtManager: this.jwtManager,
            sessionManager: this.sessionManager,
        });
    }

    /**
     * Initialize the mesh
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        console.log(`[SecureMesh] Initializing mesh for ${this.config.serviceId}...`);

        // Initialize crypto (generate/load keys)
        await this.cryptoManager.initialize(this.config.serviceId);

        // Register this service in discovery
        await this.discovery.registerService({
            id: this.config.serviceId,
            host: 'localhost', // Will be configurable
            port: this.config.port,
            publicKey: this.cryptoManager.getPublicKey(),
            status: 'healthy',
        });

        // Start health monitoring
        this.healthMonitor.registerCheck({
            name: 'mesh-core',
            check: async () => ({ status: 'healthy', timestamp: new Date() }),
        });
        this.healthMonitor.start();

        this.initialized = true;

        await this.auditLogger.log({
            eventType: 'system',
            serviceId: this.config.serviceId,
            details: { action: 'mesh_initialized' },
        });

        console.log(`[SecureMesh] ✓ Mesh initialized`);
        console.log(`[SecureMesh]   - RSA Key Size: ${this.config.security?.rsaKeySize || 4096}`);
        console.log(`[SecureMesh]   - AES Key Size: ${this.config.security?.aesKeySize || 256}`);
        console.log(`[SecureMesh]   - Services: ${(this.config.discovery?.services || []).length}`);
    }

    /**
     * Connect to another service
     */
    connect(serviceId: string): {
        call: <TData = any, TResult = any>(method: string, data: TData) => Promise<TResult>;
    } {
        return {
            call: async <TData = any, TResult = any>(method: string, data: TData): Promise<TResult> => {
                // Get or create circuit breaker for this service
                let circuitBreaker = this.circuitBreakers.get(serviceId);
                if (!circuitBreaker) {
                    circuitBreaker = new CircuitBreaker({
                        failureThreshold: this.config.resilience?.circuitBreaker?.failureThreshold || 5,
                        successThreshold: this.config.resilience?.circuitBreaker?.successThreshold || 2,
                        timeout: this.config.resilience?.circuitBreaker?.timeout || 60000,
                    });
                    this.circuitBreakers.set(serviceId, circuitBreaker);
                }

                // Execute with resilience patterns
                return this.retryPolicy.execute(async () => {
                    return circuitBreaker!.execute(async () => {
                        const startTime = Date.now();
                        try {
                            // Get service info
                            const servicePromise = this.discovery.getService(serviceId);
                            const service = await servicePromise;

                            if (!service) {
                                throw new Error(`Service not found: ${serviceId}`);
                            }

                            // Connect if not already connected
                            if (!this.client.isConnected(serviceId)) {
                                await this.client.connect(service);
                                this.metricsCollector.recordConnection(true);
                            }

                            // Make the call
                            const result = await this.client.call<TData, TResult>(serviceId, method, data);

                            // Record metrics
                            this.metricsCollector.recordMessageSent();
                            this.metricsCollector.recordLatency(Date.now() - startTime);

                            return result;
                        } catch (error) {
                            this.metricsCollector.recordMessageFailed();
                            this.metricsCollector.recordCircuitBreakerState(circuitBreaker!.getState());
                            throw error;
                        }
                    });
                });
            },
        };
    }

    /**
     * Disconnect from a service
     */
    async disconnect(serviceId: string): Promise<void> {
        await this.client.disconnect(serviceId);
    }

    /**
     * Get mesh statistics
     */
    getStats() {
        return {
            service: this.config.serviceId,
            sessions: this.sessionManager.getStats(),
            connectedServices: this.client.getConnectedServices(),
            metrics: this.metricsCollector.getMetrics(),
        };
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: string; services: number; details: any }> {
        const services = await this.discovery.listServices();
        const health = this.healthMonitor.getOverallStatus();
        const metrics = this.metricsCollector.getMetrics();

        return {
            status: health,
            services: services.length,
            details: {
                checks: this.healthMonitor.getResults(),
                metrics,
            }
        };
    }

    /**
     * Cleanup (call on shutdown)
     */
    async cleanup(): Promise<void> {
        console.log('[SecureMesh] Cleaning up...');

        this.healthMonitor.stop();
        this.keyRotation.stop();

        // Disconnect from all services
        const connectedServices = this.client.getConnectedServices();
        for (const serviceId of connectedServices) {
            await this.disconnect(serviceId);
        }

        // Clean up sessions
        this.sessionManager.cleanupExpiredSessions();

        await this.auditLogger.log({
            eventType: 'system',
            serviceId: this.config.serviceId,
            details: { action: 'mesh_shutdown' },
        });

        console.log('[SecureMesh] ✓ Cleanup complete');
    }
}
