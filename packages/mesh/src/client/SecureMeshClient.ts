/**
 * Secure Mesh Client
 * Client for secure service-to-service communication
 */

import { CryptoManager } from '../crypto/CryptoManager';
import { JWTManager } from '../auth/JWTManager';
import { SessionManager } from '../auth/SessionManager';
import type { ServiceInfo } from '../discovery/types';

export interface SecureMeshClientConfig {
    serviceId: string;
    cryptoManager: CryptoManager;
    jwtManager: JWTManager;
    sessionManager: SessionManager;
}

export interface SecureMessage {
    type: 'handshake' | 'request' | 'response';
    sessionId?: string;
    token?: string;
    payload: any;
}

export class SecureMeshClient {
    private config: SecureMeshClientConfig;
    private connectedServices: Map<string, ServiceInfo> = new Map();

    constructor(config: SecureMeshClientConfig) {
        this.config = config;
    }

    /**
     * Connect to a service (handshake)
     */
    async connect(service: ServiceInfo): Promise<string> {
        console.log(`[MeshClient] Connecting to ${service.id} at ${service.host}:${service.port}`);

        // Create session
        const sessionKey = this.config.cryptoManager.generateSessionKey();
        const session = this.config.sessionManager.createSession(
            service.id,
            service.publicKey || '',
            sessionKey
        );

        // Generate JWT token for handshake (will be used in real gRPC implementation)
        // const token = this.config.jwtManager.generateToken(this.config.serviceId, session.id);

        // Store connected service
        this.connectedServices.set(service.id, service);

        console.log(`[MeshClient] ✓ Connected to ${service.id} (session: ${session.id})`);

        return session.id;
    }

    /**
     * Send secure message to a service
     */
    async call<TData = any, TResult = any>(
        serviceId: string,
        method: string,
        data: TData
    ): Promise<TResult> {
        const service = this.connectedServices.get(serviceId);
        if (!service) {
            throw new Error(`Not connected to service: ${serviceId}`);
        }

        // Get session
        const session = this.config.sessionManager.getSessionByServiceId(serviceId);
        if (!session) {
            throw new Error(`No active session for service: ${serviceId}`);
        }

        // Create message payload
        const message = {
            method,
            data,
            timestamp: Date.now(),
        };

        // Encrypt message with hybrid encryption
        const encrypted = this.config.cryptoManager.encrypt(
            JSON.stringify(message),
            service.publicKey || ''
        );

        // Generate JWT for authentication
        const token = this.config.jwtManager.generateToken(
            this.config.serviceId,
            session.id
        );

        // Increment message count
        this.config.sessionManager.incrementMessageCount(session.id);

        console.log(`[MeshClient] → Calling ${serviceId}.${method}`);
        console.log(`[MeshClient]   - Session: ${session.id}`);
        console.log(`[MeshClient]   - Encrypted: ${encrypted.encryptedData.substring(0, 32)}...`);
        console.log(`[MeshClient]   - JWT: ${token.substring(0, 32)}...`);

        // TODO: In full implementation, this would:
        // 1. Send encrypted payload via gRPC
        // 2. Include JWT token in metadata
        // 3. Handle response decryption
        // 4. Verify response signature

        // Mock response for MVP (simulates successful encrypted communication)
        const mockResponse = {
            success: true,
            data: `Mock response from ${serviceId}.${method}`,
            sessionId: session.id,
            encrypted: true,
            authenticated: true,
        };

        return mockResponse as TResult;
    }

    /**
     * Disconnect from a service
     */
    async disconnect(serviceId: string): Promise<void> {
        const session = this.config.sessionManager.getSessionByServiceId(serviceId);
        if (session) {
            this.config.sessionManager.deleteSession(session.id);
        }

        this.connectedServices.delete(serviceId);
        console.log(`[MeshClient] Disconnected from ${serviceId}`);
    }

    /**
     * Get connected services
     */
    getConnectedServices(): string[] {
        return Array.from(this.connectedServices.keys());
    }

    /**
     * Check if connected to a service
     */
    isConnected(serviceId: string): boolean {
        return this.connectedServices.has(serviceId);
    }
}
