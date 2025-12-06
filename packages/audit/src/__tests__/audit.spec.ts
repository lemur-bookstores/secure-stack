import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLogger } from '../AuditLogger';
import { ConsoleAdapter } from '../adapters/ConsoleAdapter';
import { AuditEvent } from '../types';

describe('AuditLogger', () => {
    let logger: AuditLogger;
    let events: AuditEvent[] = [];

    beforeEach(() => {
        events = [];
        const mockAdapter = {
            log: async (event: AuditEvent) => {
                events.push(event);
            },
        };

        logger = new AuditLogger({
            adapters: [mockAdapter],
        });
    });

    it('should log an audit event', async () => {
        const eventId = await logger.log(
            'user.login',
            { id: 'user-123', ip: '127.0.0.1' },
            'success'
        );

        expect(eventId).toBeTruthy();
        expect(events).toHaveLength(1);
        expect(events[0].action).toBe('user.login');
        expect(events[0].actor.id).toBe('user-123');
        expect(events[0].status).toBe('success');
    });

    it('should mask sensitive fields', async () => {
        await logger.log(
            'user.register',
            { id: 'user-123', password: 'secret123' },
            'success'
        );

        expect(events[0].actor.password).toBe('***MASKED***');
    });

    it('should mask nested sensitive fields', async () => {
        await logger.log(
            'payment.process',
            { id: 'user-123' },
            'success',
            undefined,
            { payment: { creditCard: '1234-5678-9012-3456' } }
        );

        expect(events[0].metadata?.payment.creditCard).toBe('***MASKED***');
    });

    it('should log failure events with error', async () => {
        await logger.log(
            'user.login',
            { id: 'user-123' },
            'failure',
            undefined,
            undefined,
            { code: 'INVALID_CREDENTIALS', message: 'Invalid password' }
        );

        expect(events[0].status).toBe('failure');
        expect(events[0].error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should not log when disabled', async () => {
        const disabledLogger = new AuditLogger({
            adapters: [{ log: async (e) => { events.push(e); } }],
            enabled: false,
        });

        await disabledLogger.log('test.action', { id: 'user-1' }, 'success');
        expect(events).toHaveLength(0);
    });
});
