import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HealthMonitor, HealthCheck } from '../HealthMonitor';

describe('HealthMonitor', () => {
    let monitor: HealthMonitor;

    beforeEach(() => {
        monitor = new HealthMonitor(100);
    });

    afterEach(() => {
        monitor.stop();
    });

    it('should register and run checks', async () => {
        const check: HealthCheck = {
            name: 'test-check',
            check: vi.fn().mockResolvedValue({
                status: 'healthy',
                timestamp: new Date(),
            }),
        };

        monitor.registerCheck(check);
        await monitor.runChecks();

        const results = monitor.getResults();
        expect(results['test-check'].status).toBe('healthy');
        expect(check.check).toHaveBeenCalled();
    });

    it('should handle failed checks', async () => {
        const check: HealthCheck = {
            name: 'failed-check',
            check: vi.fn().mockRejectedValue(new Error('Check failed')),
        };

        monitor.registerCheck(check);
        await monitor.runChecks();

        const results = monitor.getResults();
        expect(results['failed-check'].status).toBe('unhealthy');
        expect(results['failed-check'].details?.error).toBe('Check failed');
    });

    it('should aggregate overall status', async () => {
        monitor.registerCheck({
            name: 'healthy-check',
            check: async () => ({ status: 'healthy', timestamp: new Date() }),
        });
        monitor.registerCheck({
            name: 'degraded-check',
            check: async () => ({ status: 'degraded', timestamp: new Date() }),
        });

        await monitor.runChecks();
        expect(monitor.getOverallStatus()).toBe('degraded');

        monitor.registerCheck({
            name: 'unhealthy-check',
            check: async () => ({ status: 'unhealthy', timestamp: new Date() }),
        });

        await monitor.runChecks();
        expect(monitor.getOverallStatus()).toBe('unhealthy');
    });

    it('should run checks periodically', async () => {
        const check = vi.fn().mockResolvedValue({
            status: 'healthy',
            timestamp: new Date(),
        });

        monitor.registerCheck({ name: 'periodic', check });
        monitor.start();

        expect(check).toHaveBeenCalledTimes(1); // Immediate run

        await new Promise(resolve => setTimeout(resolve, 150));
        expect(check).toHaveBeenCalledTimes(2); // Second run
    });
});
