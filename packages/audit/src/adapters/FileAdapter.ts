import { AuditAdapter, AuditEvent, AuditQueryParams } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FileAdapter implements AuditAdapter {
    private filePath: string;

    constructor(filePath: string = './audit.log') {
        this.filePath = path.resolve(filePath);
    }

    async log(event: AuditEvent): Promise<void> {
        const line = JSON.stringify({
            ...event,
            timestamp: event.timestamp.toISOString(),
        }) + '\n';

        await fs.appendFile(this.filePath, line, 'utf-8');
    }

    async query(params: AuditQueryParams): Promise<AuditEvent[]> {
        try {
            const content = await fs.readFile(this.filePath, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);

            let events: AuditEvent[] = lines.map(line => {
                const parsed = JSON.parse(line);
                return {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp),
                };
            });

            // Apply filters
            if (params.startDate) {
                events = events.filter(e => e.timestamp >= params.startDate!);
            }
            if (params.endDate) {
                events = events.filter(e => e.timestamp <= params.endDate!);
            }
            if (params.action) {
                events = events.filter(e => e.action === params.action);
            }
            if (params.actorId) {
                events = events.filter(e => e.actor.id === params.actorId);
            }
            if (params.resourceType) {
                events = events.filter(e => e.resource?.type === params.resourceType);
            }
            if (params.resourceId) {
                events = events.filter(e => e.resource?.id === params.resourceId);
            }
            if (params.status) {
                events = events.filter(e => e.status === params.status);
            }

            // Apply pagination
            const offset = params.offset || 0;
            const limit = params.limit || 100;

            return events.slice(offset, offset + limit);
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
}
