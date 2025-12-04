import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditLogger } from '../AuditLogger';
import type { MonitoringAdapter } from '../types';

describe('AuditLogger', () => {
    let mockAdapter: MonitoringAdapter;
    let auditLogger: AuditLogger;

    beforeEach(() => {
        mockAdapter = {
            logEvent: vi.fn().mockResolvedValue(undefined),
        };

        auditLogger = new AuditLogger({
            enabled: true,
            adapters: [mockAdapter],
        });
    });

    it('should log events when enabled', async () => {
        await auditLogger.log({
            eventType: 'connection',
            serviceId: 'service-1',
            details: { success: true },
        });

        expect(mockAdapter.logEvent).toHaveBeenCalledTimes(1);
        expect(mockAdapter.logEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                eventType: 'connection',
                serviceId: 'service-1',
                details: { success: true },
            })
        );
    });

    it('should not log events when disabled', async () => {
        const disabledLogger = new AuditLogger({
            enabled: false,
            adapters: [mockAdapter],
        });

        await disabledLogger.log({
            eventType: 'connection',
            serviceId: 'service-1',
            details: { success: true },
        });

        expect(mockAdapter.logEvent).not.toHaveBeenCalled();
    });

    it('should use multiple adapters', async () => {
        const adapter1: MonitoringAdapter = {
            logEvent: vi.fn().mockResolvedValue(undefined),
        };
        const adapter2: MonitoringAdapter = {
            logEvent: vi.fn().mockResolvedValue(undefined),
        };

        const multiLogger = new AuditLogger({
            enabled: true,
            adapters: [adapter1, adapter2],
        });

        await multiLogger.log({
            eventType: 'test',
            serviceId: 'service-1',
            details: {},
        });

        expect(adapter1.logEvent).toHaveBeenCalledTimes(1);
        expect(adapter2.logEvent).toHaveBeenCalledTimes(1);
    });

    it('should handle adapter errors gracefully', async () => {
        const failingAdapter: MonitoringAdapter = {
            logEvent: vi.fn().mockRejectedValue(new Error('Adapter failed')),
        };

        const errorLogger = new AuditLogger({
            enabled: true,
            adapters: [failingAdapter],
        });

        await expect(
            errorLogger.log({
                eventType: 'test',
                serviceId: 'service-1',
                details: {},
            })
        ).resolves.not.toThrow();
    });

    it('should add event ID to each log', async () => {
        await auditLogger.log({
            eventType: 'test',
            serviceId: 'service-1',
            details: {},
        });

        expect(mockAdapter.logEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                id: expect.any(String),
            })
        );
    });
});
