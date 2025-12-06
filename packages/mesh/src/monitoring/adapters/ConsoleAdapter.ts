import { MonitoringAdapter, MeshAuditEvent } from '../types';

export class ConsoleAdapter implements MonitoringAdapter {
    async logEvent(event: MeshAuditEvent): Promise<void> {
        const formatted = {
            ...event,
            timestamp: event.timestamp.toISOString(),
        };

        console.log('[MESH_AUDIT]', JSON.stringify(formatted, null, 2));
    }

    async logMetrics(metrics: any): Promise<void> {
        console.log('[MESH_METRICS]', JSON.stringify(metrics, null, 2));
    }
}
