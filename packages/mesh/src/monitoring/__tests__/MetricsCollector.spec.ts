import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../MetricsCollector';

describe('MetricsCollector', () => {
    let metricsCollector: MetricsCollector;

    beforeEach(() => {
        metricsCollector = new MetricsCollector();
    });

    it('should track active connections', () => {
        metricsCollector.recordConnection(true);
        metricsCollector.recordConnection(true);

        const metrics = metricsCollector.getMetrics();
        expect(metrics.connections.active).toBe(2);
    });

    it('should decrease active connections on disconnect', () => {
        metricsCollector.recordConnection(true);
        metricsCollector.recordConnection(true);
        metricsCollector.recordConnectionClosed();

        const metrics = metricsCollector.getMetrics();
        expect(metrics.connections.active).toBe(1);
    });

    it('should track message counts', () => {
        metricsCollector.recordMessageSent();
        metricsCollector.recordMessageSent();
        metricsCollector.recordMessageReceived();

        const metrics = metricsCollector.getMetrics();
        expect(metrics.messages.sent).toBe(2);
        expect(metrics.messages.received).toBe(1);
    });

    it('should track message latency', () => {
        metricsCollector.recordLatency(100);
        metricsCollector.recordLatency(200);
        metricsCollector.recordLatency(150);

        const metrics = metricsCollector.getMetrics();
        expect(metrics.performance.avgLatency).toBeCloseTo(150, 0);
    });

    it('should track rate limit actions', () => {
        metricsCollector.recordRateLimitAllowed();
        metricsCollector.recordRateLimitAllowed();
        metricsCollector.recordRateLimitBlocked();

        const metrics = metricsCollector.getMetrics();
        expect(metrics.rateLimiting.allowed).toBe(2);
        expect(metrics.rateLimiting.blocked).toBe(1);
    });

    it('should track circuit breaker state', () => {
        metricsCollector.recordCircuitBreakerState('open');
        metricsCollector.recordCircuitBreakerState('closed');

        const metrics = metricsCollector.getMetrics();
        expect(metrics.circuitBreaker.open).toBe(1);
        expect(metrics.circuitBreaker.closed).toBe(1);
    });

    it('should reset metrics', () => {
        metricsCollector.recordConnection(true);
        metricsCollector.recordMessageSent();
        metricsCollector.recordLatency(100);

        metricsCollector.reset();

        const metrics = metricsCollector.getMetrics();
        expect(metrics.connections.active).toBe(0);
        expect(metrics.messages.sent).toBe(0);
        expect(metrics.performance.avgLatency).toBe(0);
    });
});
