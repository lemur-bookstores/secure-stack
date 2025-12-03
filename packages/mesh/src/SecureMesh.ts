/**
 * Secure Mesh - Main Service Mesh Implementation
 */

import { CryptoManager } from './crypto/CryptoManager';
import { JWTManager } from './auth/JWTManager';
import { SessionManager } from './auth/SessionManager';
import { StaticDiscovery } from './discovery/StaticDiscovery';
import { SecureMeshClient } from './client/SecureMeshClient';
import type { ServiceInfo } from './discovery/types';

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
}

export class SecureMesh {
    private config: SecureMeshConfig;
    private cryptoManager: CryptoManager;
    private jwtManager: JWTManager;
    private sessionManager: SessionManager;
    private discovery: StaticDiscovery;
    private client: SecureMeshClient;
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

        this.initialized = true;

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
                // Get service info
                const servicePromise = this.discovery.getService(serviceId);
                const service = await servicePromise;

                if (!service) {
                    throw new Error(`Service not found: ${serviceId}`);
                }

                // Connect if not already connected
                if (!this.client.isConnected(serviceId)) {
                    await this.client.connect(service);
                }

                // Make the call
                return this.client.call<TData, TResult>(serviceId, method, data);
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
        };
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: string; services: number }> {
        const services = await this.discovery.listServices();
        return {
            status: 'healthy',
            services: services.length,
        };
    }

    /**
     * Cleanup (call on shutdown)
     */
    async cleanup(): Promise<void> {
        console.log('[SecureMesh] Cleaning up...');

        // Disconnect from all services
        const connectedServices = this.client.getConnectedServices();
        for (const serviceId of connectedServices) {
            await this.disconnect(serviceId);
        }

        // Clean up sessions
        this.sessionManager.cleanupExpiredSessions();

        console.log('[SecureMesh] ✓ Cleanup complete');
    }
}
