import { generateKeyPairSync } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface KeyPair {
    publicKey: string;
    privateKey: string;
}

export class KeyManager {
    private readonly keyDir: string;

    constructor(keyDir: string = './keys') {
        this.keyDir = keyDir;
        if (!fs.existsSync(this.keyDir)) {
            fs.mkdirSync(this.keyDir, { recursive: true });
        }
    }

    /**
     * Generates a new RSA-4096 key pair
     */
    public generateKeyPair(): KeyPair {
        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });

        return {
            publicKey: publicKey as string,
            privateKey: privateKey as string,
        };
    }

    /**
     * Saves a key pair to disk
     */
    public saveKeyPair(name: string, keyPair: Partial<KeyPair>): void {
        const publicPath = path.join(this.keyDir, `${name}.pub.pem`);
        const privatePath = path.join(this.keyDir, `${name}.pem`);

        if (keyPair.publicKey) {
            fs.writeFileSync(publicPath, keyPair.publicKey);
        }

        if (keyPair.privateKey) {
            fs.writeFileSync(privatePath, keyPair.privateKey, { mode: 0o600 }); // Secure permissions
        }
    }

    /**
     * Loads a key pair from disk
     */
    public loadKeyPair(name: string): KeyPair | null {
        const publicPath = path.join(this.keyDir, `${name}.pub.pem`);
        const privatePath = path.join(this.keyDir, `${name}.pem`);

        if (!fs.existsSync(publicPath) || !fs.existsSync(privatePath)) {
            return null;
        }

        const publicKey = fs.readFileSync(publicPath, 'utf-8');
        const privateKey = fs.readFileSync(privatePath, 'utf-8');

        return {
            publicKey,
            privateKey,
        };
    }

    /**
     * Gets or creates a key pair
     */
    public getOrCreateKeyPair(name: string): KeyPair {
        const existing = this.loadKeyPair(name);
        if (existing) {
            return existing;
        }

        const newKeyPair = this.generateKeyPair();
        this.saveKeyPair(name, newKeyPair);
        return newKeyPair;
    }
}
