import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JWTManager } from '../JWTManager';
import { KeyManager } from '../../crypto/KeyManager';
import path from 'path';
import fs from 'fs';

const TEST_KEYS_DIR = path.join(__dirname, 'test-auth-keys');

describe('JWTManager', () => {
    let jwtManager: JWTManager;
    let keyManager: KeyManager;

    beforeEach(() => {
        keyManager = new KeyManager(TEST_KEYS_DIR);
        jwtManager = new JWTManager('service-a', keyManager);

        // Generate keys for service-a
        keyManager.getOrCreateKeyPair('service-a');
    });

    afterEach(() => {
        if (fs.existsSync(TEST_KEYS_DIR)) {
            fs.rmSync(TEST_KEYS_DIR, { recursive: true, force: true });
        }
    });

    it('should generate and verify a valid token', () => {
        // service-a generates token for service-b
        const token = jwtManager.generateToken('service-b');
        expect(token).toBeDefined();

        // service-b verifies token from service-a
        const serviceBManager = new JWTManager('service-b', keyManager);
        const decoded = serviceBManager.verifyToken(token, 'service-a');

        expect(decoded.sub).toBe('service-a');
        expect(decoded.aud).toBe('service-b');
        expect(decoded.iss).toBe('service-a');
    });

    it('should fail to verify token with wrong source service', () => {
        const token = jwtManager.generateToken('service-b');

        // Generate keys for another service
        keyManager.getOrCreateKeyPair('service-c');

        expect(() => jwtManager.verifyToken(token, 'service-c')).toThrow();
    });

    it('should decode token without verification', () => {
        const token = jwtManager.generateToken('service-b');
        const decoded = jwtManager.decodeToken(token);

        expect(decoded).toBeDefined();
        expect(decoded?.sub).toBe('service-a');
    });
});
