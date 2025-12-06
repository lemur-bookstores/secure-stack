export interface AuditEvent {
    id: string;
    timestamp: Date;
    action: string;
    actor: {
        id: string;
        type?: string;
        ip?: string;
        userAgent?: string;
        [key: string]: any;
    };
    resource?: {
        type: string;
        id: string;
        [key: string]: any;
    };
    metadata?: Record<string, any>;
    status: 'success' | 'failure';
    error?: {
        code: string;
        message: string;
        stack?: string;
    };
}

export interface AuditAdapter {
    log(event: AuditEvent): Promise<void>;
    query?(params: AuditQueryParams): Promise<AuditEvent[]>;
}

export interface AuditQueryParams {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    actorId?: string;
    resourceType?: string;
    resourceId?: string;
    status?: 'success' | 'failure';
    limit?: number;
    offset?: number;
}

export interface AuditConfig {
    adapters: AuditAdapter[];
    enabled?: boolean;
    maskFields?: string[]; // Fields to mask in metadata/actor/resource
    retentionDays?: number;
}
