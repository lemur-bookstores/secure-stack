export interface MeshAuditEvent {
    id: string;
    timestamp: Date;
    eventType: 'connection' | 'message' | 'key_rotation' | 'rate_limit' | 'circuit_breaker' | 'error';
    serviceId: string;
    targetServiceId?: string;
    details: {
        action?: string;
        success: boolean;
        duration?: number;
        messageCount?: number;
        error?: string;
        metadata?: Record<string, any>;
    };
}

export interface MonitoringAdapter {
    logEvent(event: MeshAuditEvent): Promise<void>;
    logMetrics?(metrics: any): Promise<void>;
}

export interface AuditLoggerConfig {
    adapters: MonitoringAdapter[];
    enabled?: boolean;
}
