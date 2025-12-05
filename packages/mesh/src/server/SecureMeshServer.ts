import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { JWTManager } from '../auth/JWTManager';
import { SessionManager } from '../auth/SessionManager';
import { CryptoManager } from '../crypto/CryptoManager';
import { KeyManager } from '../crypto/KeyManager';
import { RateLimiter } from '../resilience/RateLimiter';
import { RateLimiterConfig } from '../resilience/types';
import * as crypto from 'crypto';

const PROTO_PATH = path.join(__dirname, '../../proto/secure-messaging.proto');

export class SecureMeshServer {
    private server: grpc.Server;
    private jwtManager: JWTManager;
    private sessionManager: SessionManager;
    private cryptoManager: CryptoManager;
    private keyManager: KeyManager;
    private rateLimiter: RateLimiter;
    private serviceId: string;

    constructor(serviceId: string, keysDir?: string, rateLimitConfig?: RateLimiterConfig) {
        this.serviceId = serviceId;
        this.keyManager = new KeyManager(keysDir);
        this.jwtManager = new JWTManager(serviceId, this.keyManager);
        this.sessionManager = new SessionManager();
        this.cryptoManager = new CryptoManager({ keyManager: this.keyManager });
        this.rateLimiter = new RateLimiter(rateLimitConfig || {
            maxRequests: 1000,
            windowMs: 60000
        });

        this.cryptoManager.initialize(serviceId);

        this.server = new grpc.Server();
        this.setupService();
    }

    private setupService() {
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
        const secureMeshService = protoDescriptor.secure_mesh.SecureMeshService;

        this.server.addService(secureMeshService.service, {
            Handshake: this.handleHandshake.bind(this),
            SendMessage: this.handleSendMessage.bind(this),
        });
    }

    private async handleHandshake(call: any, callback: any) {
        try {
            const { service_id, public_key, auth_token } = call.request;

            // 0. Rate Limit Check
            const limitResult = await this.rateLimiter.checkLimit(service_id || 'unknown');
            if (!limitResult.allowed) {
                callback({
                    code: grpc.status.RESOURCE_EXHAUSTED,
                    details: `Rate limit exceeded. Retry after ${limitResult.retryAfter}s`,
                });
                return;
            }

            // 1. Save provided public key temporarily/persistently to verify token
            this.keyManager.saveKeyPair(service_id, { publicKey: public_key });

            // 2. Verify JWT
            const decoded = this.jwtManager.verifyToken(auth_token, service_id);
            if (decoded.aud !== this.serviceId) {
                throw new Error('Invalid audience');
            }

            // 3. Create Session
            const sessionKey = crypto.randomBytes(32); // AES-256
            const session = this.sessionManager.createSession(service_id, sessionKey);

            // 4. Encrypt Session Key with Client's Public Key
            const encryptedSessionKey = this.cryptoManager.encryptWithPublicKey(sessionKey, public_key);

            callback(null, {
                session_id: session.id,
                encrypted_session_key: encryptedSessionKey,
            });
        } catch (error: any) {
            console.error('Handshake error:', error);
            callback({
                code: grpc.status.UNAUTHENTICATED,
                details: error.message,
            });
        }
    }

    private async handleSendMessage(call: any, callback: any) {
        try {
            const { session_id, encrypted_data, iv, auth_tag } = call.request;

            // 0. Rate Limit Check (using session_id as identifier for now, ideally map to service_id)
            const session = this.sessionManager.getSession(session_id);
            if (session) {
                const limitResult = await this.rateLimiter.checkLimit(session.serviceId);
                if (!limitResult.allowed) {
                    callback({
                        code: grpc.status.RESOURCE_EXHAUSTED,
                        details: `Rate limit exceeded. Retry after ${limitResult.retryAfter}s`,
                    });
                    return;
                }
            }

            // Re-fetch session because we need it for logic (and previous fetch was just for rate limit ID)
            // Optimization: We already fetched it.

            if (!session) {
                throw new Error('Session not found or expired');
            }

            // Decrypt message using Session Key
            const decipher = crypto.createDecipheriv('aes-256-gcm', session.sessionKey, Buffer.from(iv, 'base64'));
            decipher.setAuthTag(Buffer.from(auth_tag, 'base64'));

            let decrypted = decipher.update(Buffer.from(encrypted_data, 'base64'));
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            // Process message (Echo for now)
            const responseData = `Echo: ${decrypted.toString()}`;

            // Encrypt response using Session Key
            const responseIv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', session.sessionKey, responseIv);

            let encryptedResponse = cipher.update(responseData, 'utf8');
            encryptedResponse = Buffer.concat([encryptedResponse, cipher.final()]);
            const responseAuthTag = cipher.getAuthTag();

            callback(null, {
                session_id: session.id,
                encrypted_data: encryptedResponse.toString('base64'),
                iv: responseIv.toString('base64'),
                auth_tag: responseAuthTag.toString('base64'),
            });

        } catch (error: any) {
            console.error('SendMessage error:', error);
            callback({
                code: grpc.status.INTERNAL,
                details: error.message,
            });
        }
    }

    public start(port: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log(`SecureMeshServer running on port ${port}`);
                this.server.start();
                resolve();
            });
        });
    }

    public stop() {
        this.server.forceShutdown();
    }
}
