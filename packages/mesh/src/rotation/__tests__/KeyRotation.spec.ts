import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyRotation } from '../KeyRotation';
import { CryptoManager } from '../../crypto/CryptoManager';
import type { AuditLogger } from '../../monitoring/AuditLogger';

describe('KeyRotation', () => {
    let mockAuditLogger: AuditLogger;
    let cryptoManager: CryptoManager;
    let keyRotation: KeyRotation;

    beforeEach(async () => {
        mockAuditLogger = {
            logKeyRotation: vi.fn(),
        } as any;

        cryptoManager = new CryptoManager();
        await cryptoManager.initialize('test-service');

        keyRotation = new KeyRotation(
            'test-service',
            cryptoManager,
            {
                rotationInterval: 1000,
                autoRotate: false,
            },
            mockAuditLogger
        );
    });

    it('should rotate key manually', async () => {
        await keyRotation.rotate();

        expect(mockAuditLogger.logKeyRotation).toHaveBeenCalledWith('test-service', true);
    });

    it('should log rotation events to audit logger', async () => {
        await keyRotation.rotate();

        expect(mockAuditLogger.logKeyRotation).toHaveBeenCalledWith('test-service', true);
    });

    it('should stop auto-rotation', async () => {
        const autoRotator = new KeyRotation(
            'test-service',
            cryptoManager,
            {
                rotationInterval: 100,
                autoRotate: true,
            },
            mockAuditLogger
        );

        autoRotator.stop();

        const callsBefore = (mockAuditLogger.logKeyRotation as any).mock.calls.length;
        await new Promise(resolve => setTimeout(resolve, 250));
        const callsAfter = (mockAuditLogger.logKeyRotation as any).mock.calls.length;

        expect(callsAfter).toBe(callsBefore);
    });

    it('should handle rotation errors', async () => {
        const badCryptoManager = {
            generateSessionKey: vi.fn().mockRejectedValue(new Error('Crypto error')),
        } as any;

        const errorRotation = new KeyRotation(
            'test-service',
            badCryptoManager,
            {
                rotationInterval: 1000,
                autoRotate: false,
            },
            mockAuditLogger
        );

        await expect(errorRotation.rotate()).rejects.toThrow('Crypto error');
        expect(mockAuditLogger.logKeyRotation).toHaveBeenCalledWith(
            'test-service',
            false,
            'Crypto error'
        );
    });
});