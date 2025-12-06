import { MonitoringAdapter, MeshAuditEvent } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FileAdapter implements MonitoringAdapter {
    private filePath: string;
    private metricsFilePath?: string;

    constructor(filePath: string = './logs/mesh-audit.log', metricsFilePath?: string) {
        this.filePath = path.resolve(filePath);
        this.metricsFilePath = metricsFilePath ? path.resolve(metricsFilePath) : undefined;
    }

    async logEvent(event: MeshAuditEvent): Promise<void> {
        const line = JSON.stringify({
            ...event,
            timestamp: event.timestamp.toISOString(),
        }) + '\n';

        await fs.appendFile(this.filePath, line, 'utf-8');
    }

    async logMetrics(metrics: any): Promise<void> {
        if (!this.metricsFilePath) return;

        const line = JSON.stringify({
            timestamp: new Date().toISOString(),
            ...metrics,
        }) + '\n';

        await fs.appendFile(this.metricsFilePath, line, 'utf-8');
    }
}
