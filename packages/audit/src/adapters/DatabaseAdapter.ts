import { AuditAdapter, AuditEvent, AuditQueryParams } from '../types';

export interface DatabaseClient {
    insert(table: string, data: any): Promise<void>;
    query(table: string, filters: any, options?: { limit?: number; offset?: number }): Promise<any[]>;
}

export interface DatabaseAdapterConfig {
    client: DatabaseClient;
    tableName?: string;
    mapEventToRow?: (event: AuditEvent) => any;
    mapRowToEvent?: (row: any) => AuditEvent;
}

export class DatabaseAdapter implements AuditAdapter {
    private client: DatabaseClient;
    private tableName: string;
    private mapEventToRow: (event: AuditEvent) => any;
    private mapRowToEvent: (row: any) => AuditEvent;

    constructor(config: DatabaseAdapterConfig) {
        this.client = config.client;
        this.tableName = config.tableName || 'audit_logs';
        this.mapEventToRow = config.mapEventToRow || this.defaultMapEventToRow;
        this.mapRowToEvent = config.mapRowToEvent || this.defaultMapRowToEvent;
    }

    async log(event: AuditEvent): Promise<void> {
        const row = this.mapEventToRow(event);
        await this.client.insert(this.tableName, row);
    }

    async query(params: AuditQueryParams): Promise<AuditEvent[]> {
        const filters: any = {};

        if (params.startDate) filters.timestamp_gte = params.startDate;
        if (params.endDate) filters.timestamp_lte = params.endDate;
        if (params.action) filters.action = params.action;
        if (params.actorId) filters.actor_id = params.actorId;
        if (params.resourceType) filters.resource_type = params.resourceType;
        if (params.resourceId) filters.resource_id = params.resourceId;
        if (params.status) filters.status = params.status;

        const rows = await this.client.query(this.tableName, filters, {
            limit: params.limit || 100,
            offset: params.offset || 0,
        });

        return rows.map(this.mapRowToEvent);
    }

    private defaultMapEventToRow(event: AuditEvent): any {
        return {
            id: event.id,
            timestamp: event.timestamp.toISOString(),
            action: event.action,
            actor_id: event.actor.id,
            actor_type: event.actor.type,
            actor_ip: event.actor.ip,
            actor_user_agent: event.actor.userAgent,
            actor_data: JSON.stringify(event.actor),
            resource_type: event.resource?.type,
            resource_id: event.resource?.id,
            resource_data: event.resource ? JSON.stringify(event.resource) : null,
            metadata: event.metadata ? JSON.stringify(event.metadata) : null,
            status: event.status,
            error_code: event.error?.code,
            error_message: event.error?.message,
            error_stack: event.error?.stack,
        };
    }

    private defaultMapRowToEvent(row: any): AuditEvent {
        return {
            id: row.id,
            timestamp: new Date(row.timestamp),
            action: row.action,
            actor: {
                id: row.actor_id,
                type: row.actor_type,
                ip: row.actor_ip,
                userAgent: row.actor_user_agent,
                ...(row.actor_data ? JSON.parse(row.actor_data) : {}),
            },
            resource: row.resource_type ? {
                type: row.resource_type,
                id: row.resource_id,
                ...(row.resource_data ? JSON.parse(row.resource_data) : {}),
            } : undefined,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
            status: row.status,
            error: row.error_code ? {
                code: row.error_code,
                message: row.error_message,
                stack: row.error_stack,
            } : undefined,
        };
    }
}
