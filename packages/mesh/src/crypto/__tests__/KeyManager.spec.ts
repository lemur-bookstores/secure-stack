import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { KeyManager } from '../KeyManager';
import fs from 'fs';
import path from 'path';

const TEST_KEYS_DIR = path.join(__dirname, 'test-keys');

describe('KeyManager', () => {
    let keyManager: KeyManager;

    beforeEach(() => {
        // Use 2048 bit keys for testing speed
        keyManager = new KeyManager(TEST_KEYS_DIR, 2048);
    });

    afterEach(() => {
        if (fs.existsSync(TEST_KEYS_DIR)) {
            fs.rmSync(TEST_KEYS_DIR, { recursive: true, force: true });
        }
    });

    it('should generate a valid key pair', () => {
        const keyPair = keyManager.generateKeyPair();
        expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
        expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
    });

    it('should save and load keys', () => {
        const keyPair = keyManager.generateKeyPair();
        keyManager.saveKeyPair('test-service', keyPair);

        const loaded = keyManager.loadKeyPair('test-service');
        expect(loaded).toBeDefined();
        expect(loaded?.publicKey).toBe(keyPair.publicKey);
        expect(loaded?.privateKey).toBe(keyPair.privateKey);
    });

    it('should get or create keys', () => {
        // First call creates
        const keyPair1 = keyManager.getOrCreateKeyPair('service-1');
        expect(keyPair1).toBeDefined();

        // Second call gets existing
        const keyPair2 = keyManager.getOrCreateKeyPair('service-1');
        expect(keyPair2.publicKey).toBe(keyPair1.publicKey);
    });
});
