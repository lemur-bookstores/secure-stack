import { MeshAuditEvent, AuditLoggerConfig, MonitoringAdapter } from './types';
import { v4 as uuidv4 } from 'uuid';

export class AuditLogger {
    private config: AuditLoggerConfig;
    private adapters: MonitoringAdapter[];

    constructor(config: AuditLoggerConfig) {
        this.config = {
            enabled: config.enabled !== false,
            adapters: config.adapters || [],
        };
        this.adapters = this.config.adapters;
    }

    async log(event: Omit<MeshAuditEvent, 'id' | 'timestamp'>): Promise<void> {
        if (!this.config.enabled) return;

        const fullEvent: MeshAuditEvent = {
            id: uuidv4(),
            timestamp: new Date(),
            ...event,
        };

        await Promise.all(
            this.adapters.map((adapter) =>
                adapter.logEvent(fullEvent).catch((err) => {
                    console.error('[AuditLogger] Adapter failed:', err);
                })
            )
        );
    }

    async logConnection(serviceId: string, targetServiceId: string, success: boolean, error?: string): Promise<void> {
        await this.log({
            eventType: 'connection',
            serviceId,
            targetServiceId,
            details: { success, error },
        });
    }

    async logMessage(serviceId: string, targetServiceId: string, messageCount: number, duration: number): Promise<void> {
        await this.log({
            eventType: 'message',
            serviceId,
            targetServiceId,
            details: { success: true, messageCount, duration },
        });
    }

    async logKeyRotation(serviceId: string, success: boolean, error?: string): Promise<void> {
        await this.log({
            eventType: 'key_rotation',
            serviceId,
            details: { success, error },
        });
    }

    async logRateLimit(serviceId: string, clientId: string, blocked: boolean): Promise<void> {
        await this.log({
            eventType: 'rate_limit',
            serviceId,
            details: {
                success: !blocked,
                action: blocked ? 'blocked' : 'allowed',
                metadata: { clientId },
            },
        });
    }

    async logCircuitBreaker(serviceId: string, targetServiceId: string, state: string, error?: string): Promise<void> {
        await this.log({
            eventType: 'circuit_breaker',
            serviceId,
            targetServiceId,
            details: {
                success: state === 'closed',
                action: state,
                error,
            },
        });
    }
}
