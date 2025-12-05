import { CryptoManager } from '../crypto/CryptoManager';
import { AuditLogger } from '../monitoring/AuditLogger';

export interface KeyRotationConfig {
    rotationInterval: number; // ms (default: 1 hour)
    autoRotate?: boolean;
    onRotation?: (newKeyFingerprint: string) => void;
}

export class KeyRotation {
    private config: KeyRotationConfig;
    private cryptoManager: CryptoManager;
    private auditLogger?: AuditLogger;
    private rotationTimer?: NodeJS.Timeout;
    private serviceId: string;

    constructor(
        serviceId: string,
        cryptoManager: CryptoManager,
        config: KeyRotationConfig,
        auditLogger?: AuditLogger
    ) {
        this.serviceId = serviceId;
        this.cryptoManager = cryptoManager;
        this.auditLogger = auditLogger;
        this.config = {
            rotationInterval: config.rotationInterval || 3600000, // 1 hour default
            autoRotate: config.autoRotate !== false,
            onRotation: config.onRotation,
        };

        if (this.config.autoRotate) {
            this.startAutoRotation();
        }
    }

    private startAutoRotation(): void {
        this.rotationTimer = setInterval(async () => {
            await this.rotate();
        }, this.config.rotationInterval);

        if (this.rotationTimer.unref) {
            this.rotationTimer.unref();
        }
    }

    async rotate(): Promise<void> {
        try {
            // Generate new session key
            const newSessionKey = await this.cryptoManager.generateSessionKey();
            const keyFingerprint = newSessionKey.slice(0, 16).toString('hex');

            await this.auditLogger?.logKeyRotation(this.serviceId, true);

            if (this.config.onRotation) {
                this.config.onRotation(keyFingerprint);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.auditLogger?.logKeyRotation(this.serviceId, false, errorMessage);
            throw error;
        }
    }

    stop(): void {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
            this.rotationTimer = undefined;
        }
    }

    destroy(): void {
        this.stop();
    }
}
