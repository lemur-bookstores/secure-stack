/**
 * Crypto Manager - Hybrid Encryption System
 * RSA-4096 for key exchange + AES-256-GCM for data encryption + HMAC-SHA256 for integrity
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface KeyPair {
    publicKey: string;
    privateKey: string;
}

export interface EncryptedData {
    encryptedData: string;
    encryptedKey: string;
    iv: string;
    authTag: string;
    hmac: string;
}

export class CryptoManager {
    private rsaKeySize: number;
    private aesKeySize: number;
    private keyPair?: KeyPair;
    private keysDir: string;

    constructor(options: {
        rsaKeySize?: number;
        aesKeySize?: number;
        keysDir?: string;
    } = {}) {
        this.rsaKeySize = options.rsaKeySize || 4096;
        this.aesKeySize = options.aesKeySize || 256;
        this.keysDir = options.keysDir || path.join(process.cwd(), '.secure-stack', 'keys');
    }

    /**
     * Initialize crypto manager - generate or load keys
     */
    async initialize(serviceId: string): Promise<void> {
        // Create keys directory if it doesn't exist
        if (!fs.existsSync(this.keysDir)) {
            fs.mkdirSync(this.keysDir, { recursive: true });
        }

        const publicKeyPath = path.join(this.keysDir, `${serviceId}.pub`);
        const privateKeyPath = path.join(this.keysDir, `${serviceId}.key`);

        // Try to load existing keys
        if (fs.existsSync(publicKeyPath) && fs.existsSync(privateKeyPath)) {
            console.log(`[CryptoManager] Loading existing RSA keys for ${serviceId}`);
            this.keyPair = {
                publicKey: fs.readFileSync(publicKeyPath, 'utf-8'),
                privateKey: fs.readFileSync(privateKeyPath, 'utf-8'),
            };
        } else {
            // Generate new keys
            console.log(`[CryptoManager] Generating new RSA-${this.rsaKeySize} keys for ${serviceId}...`);
            this.keyPair = await this.generateRSAKeyPair();

            // Save keys
            fs.writeFileSync(publicKeyPath, this.keyPair.publicKey);
            fs.writeFileSync(privateKeyPath, this.keyPair.privateKey);
            console.log(`[CryptoManager] ✓ Keys saved to ${this.keysDir}`);
        }
    }

    /**
     * Generate RSA key pair
     */
    private async generateRSAKeyPair(): Promise<KeyPair> {
        return new Promise((resolve, reject) => {
            crypto.generateKeyPair(
                'rsa',
                {
                    modulusLength: this.rsaKeySize,
                    publicKeyEncoding: {
                        type: 'spki',
                        format: 'pem',
                    },
                    privateKeyEncoding: {
                        type: 'pkcs8',
                        format: 'pem',
                    },
                },
                (err, publicKey, privateKey) => {
                    if (err) reject(err);
                    else resolve({ publicKey, privateKey });
                }
            );
        });
    }

    /**
     * Generate AES session key
     */
    generateSessionKey(): Buffer {
        return crypto.randomBytes(this.aesKeySize / 8);
    }

    /**
     * Encrypt data using hybrid encryption
     * 1. Generate random AES key
     * 2. Encrypt data with AES-256-GCM
     * 3. Encrypt AES key with RSA-4096
     * 4. Generate HMAC for integrity
     */
    encrypt(data: string | Buffer, recipientPublicKey: string): EncryptedData {
        // Generate random AES key and IV
        const aesKey = this.generateSessionKey();
        const iv = crypto.randomBytes(16);

        // Encrypt data with AES-256-GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
        const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');

        const encryptedData = Buffer.concat([
            cipher.update(dataBuffer),
            cipher.final(),
        ]);

        const authTag = cipher.getAuthTag();

        // Encrypt AES key with RSA
        const encryptedKey = crypto.publicEncrypt(
            {
                key: recipientPublicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            aesKey
        );

        // Generate HMAC for integrity
        const hmac = crypto
            .createHmac('sha256', aesKey)
            .update(encryptedData)
            .digest('hex');

        return {
            encryptedData: encryptedData.toString('base64'),
            encryptedKey: encryptedKey.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            hmac,
        };
    }

    /**
     * Decrypt data using hybrid encryption
     */
    decrypt(encryptedPayload: EncryptedData): Buffer {
        if (!this.keyPair) {
            throw new Error('CryptoManager not initialized');
        }

        // Decrypt AES key with RSA
        const aesKey = crypto.privateDecrypt(
            {
                key: this.keyPair.privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(encryptedPayload.encryptedKey, 'base64')
        );

        // Convert encrypted data from base64
        const encryptedData = Buffer.from(encryptedPayload.encryptedData, 'base64');

        // Verify HMAC
        const expectedHmac = crypto
            .createHmac('sha256', aesKey)
            .update(encryptedData)
            .digest('hex');

        if (expectedHmac !== encryptedPayload.hmac) {
            throw new Error('HMAC verification failed - data may be tampered');
        }

        // Decrypt data with AES-256-GCM
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            aesKey,
            Buffer.from(encryptedPayload.iv, 'base64')
        );

        decipher.setAuthTag(Buffer.from(encryptedPayload.authTag, 'base64'));

        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final(),
        ]);

        return decrypted;
    }

    /**
     * Get public key
     */
    getPublicKey(): string {
        if (!this.keyPair) {
            throw new Error('CryptoManager not initialized');
        }
        return this.keyPair.publicKey;
    }

    /**
     * Sign data
     */
    sign(data: string | Buffer): string {
        if (!this.keyPair) {
            throw new Error('CryptoManager not initialized');
        }

        const sign = crypto.createSign('SHA256');
        sign.update(Buffer.isBuffer(data) ? data : Buffer.from(data));
        sign.end();

        return sign.sign(this.keyPair.privateKey, 'base64');
    }

    /**
     * Verify signature
     */
    verify(data: string | Buffer, signature: string, publicKey: string): boolean {
        const verify = crypto.createVerify('SHA256');
        verify.update(Buffer.isBuffer(data) ? data : Buffer.from(data));
        verify.end();

        return verify.verify(publicKey, signature, 'base64');
    }
}
