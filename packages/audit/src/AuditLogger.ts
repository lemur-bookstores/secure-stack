import { AuditConfig, AuditEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

export class AuditLogger {
    private config: AuditConfig;

    constructor(config: AuditConfig) {
        this.config = {
            enabled: true,
            maskFields: ['password', 'token', 'secret', 'creditCard'],
            ...config,
        };
    }

    async log(
        action: string,
        actor: AuditEvent['actor'],
        status: AuditEvent['status'] = 'success',
        resource?: AuditEvent['resource'],
        metadata?: Record<string, any>,
        error?: AuditEvent['error']
    ): Promise<string> {
        if (!this.config.enabled) return '';

        const event: AuditEvent = {
            id: uuidv4(),
            timestamp: new Date(),
            action,
            actor: this.maskData(actor),
            status,
            resource: resource ? this.maskData(resource) : undefined,
            metadata: metadata ? this.maskData(metadata) : undefined,
            error,
        };

        await Promise.all(
            this.config.adapters.map((adapter) => adapter.log(event).catch((err) => {
                console.error('Failed to log audit event to adapter:', err);
            }))
        );

        return event.id;
    }

    private maskData(data: any): any {
        if (!data || typeof data !== 'object') return data;

        if (Array.isArray(data)) {
            return data.map(item => this.maskData(item));
        }

        const masked = { ...data };
        const maskFields = this.config.maskFields || [];

        for (const key of Object.keys(masked)) {
            if (maskFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                masked[key] = '***MASKED***';
            } else if (typeof masked[key] === 'object') {
                masked[key] = this.maskData(masked[key]);
            }
        }

        return masked;
    }
}
