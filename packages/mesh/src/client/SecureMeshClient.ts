import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { JWTManager } from '../auth/JWTManager';
import { CryptoManager } from '../crypto/CryptoManager';
import { KeyManager } from '../crypto/KeyManager';
import { PathResolver } from '../utils/PathResolver';
import * as crypto from 'crypto';



export class SecureMeshClient {
    private client: any;
    private jwtManager: JWTManager;
    private cryptoManager: CryptoManager;
    private keyManager: KeyManager;
    private serviceId: string;
    private targetServiceId: string;
    private protoPath: string;
    private sessionId?: string;
    private sessionKey?: Buffer;

    constructor(serviceId: string, targetServiceId: string, address: string, keysDir?: string, protoPath?: string) {
        this.serviceId = serviceId;
        this.targetServiceId = targetServiceId;
        this.keyManager = new KeyManager(keysDir);
        this.jwtManager = new JWTManager(serviceId, this.keyManager);
        this.cryptoManager = new CryptoManager({ keyManager: this.keyManager });

        this.cryptoManager.initialize(serviceId);

        // Resolve proto file path
        this.protoPath = PathResolver.resolveFile(protoPath, './proto/secure-messaging.proto');

        const packageDefinition = protoLoader.loadSync(this.protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
        const SecureMeshService = protoDescriptor.secure_mesh.SecureMeshService;

        this.client = new SecureMeshService(address, grpc.credentials.createInsecure());
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const publicKey = this.cryptoManager.getPublicKey();
            const authToken = this.jwtManager.generateToken(this.targetServiceId);

            this.client.Handshake({
                service_id: this.serviceId,
                public_key: publicKey,
                auth_token: authToken,
            }, (err: any, response: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    this.sessionId = response.session_id;
                    const encryptedSessionKey = response.encrypted_session_key;

                    // Decrypt session key using our private key
                    this.sessionKey = this.cryptoManager.decryptWithPrivateKey(encryptedSessionKey);

                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    public async sendMessage(data: string): Promise<string> {
        if (!this.sessionId || !this.sessionKey) {
            throw new Error('Client not connected');
        }

        return new Promise((resolve, reject) => {
            try {
                // Encrypt message using Session Key
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-gcm', this.sessionKey!, iv);

                let encryptedData = cipher.update(data, 'utf8');
                encryptedData = Buffer.concat([encryptedData, cipher.final()]);
                const authTag = cipher.getAuthTag();

                this.client.SendMessage({
                    session_id: this.sessionId,
                    encrypted_data: encryptedData.toString('base64'),
                    iv: iv.toString('base64'),
                    auth_tag: authTag.toString('base64'),
                }, (err: any, response: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    try {
                        // Decrypt response
                        const decipher = crypto.createDecipheriv('aes-256-gcm', this.sessionKey!, Buffer.from(response.iv, 'base64'));
                        decipher.setAuthTag(Buffer.from(response.auth_tag, 'base64'));

                        let decrypted = decipher.update(Buffer.from(response.encrypted_data, 'base64'));
                        decrypted = Buffer.concat([decrypted, decipher.final()]);

                        resolve(decrypted.toString());
                    } catch (error) {
                        reject(error);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    public disconnect(): void {
        if (this.client) {
            this.client.close();
        }
    }
}
