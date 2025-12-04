import { AuditAdapter, AuditEvent } from '../types';

export class ConsoleAdapter implements AuditAdapter {
  async log(event: AuditEvent): Promise<void> {
    const formatted = {
      ...event,
      timestamp: event.timestamp.toISOString(),
    };
    
    console.log('[AUDIT]', JSON.stringify(formatted, null, 2));
  }
}
