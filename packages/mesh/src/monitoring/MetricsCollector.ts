export interface MeshMetrics {
    connections: {
        total: number;
        active: number;
        failed: number;
    };
    messages: {
        sent: number;
        received: number;
        failed: number;
    };
    performance: {
        avgLatency: number;
        maxLatency: number;
        minLatency: number;
    };
    rateLimiting: {
        allowed: number;
        blocked: number;
    };
    circuitBreaker: {
        closed: number;
        open: number;
        halfOpen: number;
    };
}

export class MetricsCollector {
    private metrics: MeshMetrics = {
        connections: { total: 0, active: 0, failed: 0 },
        messages: { sent: 0, received: 0, failed: 0 },
        performance: { avgLatency: 0, maxLatency: 0, minLatency: Infinity },
        rateLimiting: { allowed: 0, blocked: 0 },
        circuitBreaker: { closed: 0, open: 0, halfOpen: 0 },
    };

    private latencies: number[] = [];

    recordConnection(success: boolean): void {
        this.metrics.connections.total++;
        if (success) {
            this.metrics.connections.active++;
        } else {
            this.metrics.connections.failed++;
        }
    }

    recordConnectionClosed(): void {
        if (this.metrics.connections.active > 0) {
            this.metrics.connections.active--;
        }
    }

    recordMessageSent(): void {
        this.metrics.messages.sent++;
    }

    recordMessageReceived(): void {
        this.metrics.messages.received++;
    }

    recordMessageFailed(): void {
        this.metrics.messages.failed++;
    }

    recordLatency(latencyMs: number): void {
        this.latencies.push(latencyMs);

        // Keep only last 1000 measurements
        if (this.latencies.length > 1000) {
            this.latencies.shift();
        }

        this.metrics.performance.maxLatency = Math.max(this.metrics.performance.maxLatency, latencyMs);
        this.metrics.performance.minLatency = Math.min(this.metrics.performance.minLatency, latencyMs);
        this.metrics.performance.avgLatency =
            this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    }

    recordRateLimitAllowed(): void {
        this.metrics.rateLimiting.allowed++;
    }

    recordRateLimitBlocked(): void {
        this.metrics.rateLimiting.blocked++;
    }

    recordCircuitBreakerState(state: 'closed' | 'open' | 'half_open'): void {
        if (state === 'closed') this.metrics.circuitBreaker.closed++;
        else if (state === 'open') this.metrics.circuitBreaker.open++;
        else if (state === 'half_open') this.metrics.circuitBreaker.halfOpen++;
    }

    getMetrics(): MeshMetrics {
        return { ...this.metrics };
    }

    reset(): void {
        this.metrics = {
            connections: { total: 0, active: 0, failed: 0 },
            messages: { sent: 0, received: 0, failed: 0 },
            performance: { avgLatency: 0, maxLatency: 0, minLatency: Infinity },
            rateLimiting: { allowed: 0, blocked: 0 },
            circuitBreaker: { closed: 0, open: 0, halfOpen: 0 },
        };
        this.latencies = [];
    }
}
