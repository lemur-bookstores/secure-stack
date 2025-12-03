import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CryptoManager } from '../CryptoManager';
import { KeyManager } from '../KeyManager';
import path from 'path';
import fs from 'fs';

const TEST_KEYS_DIR = path.join(__dirname, 'test-crypto-keys');

describe('CryptoManager', () => {
    let sender: CryptoManager;
    let receiver: CryptoManager;

    beforeEach(() => {
        const keyManager = new KeyManager(TEST_KEYS_DIR);
        sender = new CryptoManager({ keyManager });
        receiver = new CryptoManager({ keyManager });

        sender.initialize('sender');
        receiver.initialize('receiver');
    });

    afterEach(() => {
        if (fs.existsSync(TEST_KEYS_DIR)) {
            fs.rmSync(TEST_KEYS_DIR, { recursive: true, force: true });
        }
    });

    it('should encrypt and decrypt data correctly', () => {
        const data = 'Hello, Secure World!';
        const receiverPublicKey = receiver.getPublicKey();

        const encrypted = sender.encrypt(data, receiverPublicKey);

        expect(encrypted.encryptedData).toBeDefined();
        expect(encrypted.encryptedKey).toBeDefined();
        expect(encrypted.iv).toBeDefined();
        expect(encrypted.authTag).toBeDefined();
        expect(encrypted.hmac).toBeDefined();

        const decrypted = receiver.decrypt(encrypted);
        expect(decrypted.toString()).toBe(data);
    });

    it('should fail if HMAC is invalid', () => {
        const data = 'Secret Data';
        const receiverPublicKey = receiver.getPublicKey();
        const encrypted = sender.encrypt(data, receiverPublicKey);

        // Tamper with data
        encrypted.encryptedData = Buffer.from('Tampered Data').toString('base64');

        expect(() => receiver.decrypt(encrypted)).toThrow('HMAC verification failed');
    });

    it('should sign and verify data', () => {
        const data = 'Important Document';
        const signature = sender.sign(data);
        const senderPublicKey = sender.getPublicKey();

        const isValid = receiver.verify(data, signature, senderPublicKey);
        expect(isValid).toBe(true);

        const isInvalid = receiver.verify('Tampered Document', signature, senderPublicKey);
        expect(isInvalid).toBe(false);
    });
});
