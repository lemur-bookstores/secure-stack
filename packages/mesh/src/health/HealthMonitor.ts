export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
    status: HealthStatus;
    details?: Record<string, any>;
    timestamp: Date;
}

export interface HealthCheck {
    name: string;
    check(): Promise<HealthCheckResult>;
}

export class HealthMonitor {
    private checks: Map<string, HealthCheck> = new Map();
    private results: Map<string, HealthCheckResult> = new Map();
    private interval: NodeJS.Timeout | null = null;

    constructor(private checkIntervalMs: number = 30000) { }

    registerCheck(check: HealthCheck): void {
        this.checks.set(check.name, check);
    }

    async runChecks(): Promise<void> {
        const promises = Array.from(this.checks.values()).map(async (check) => {
            try {
                const result = await check.check();
                this.results.set(check.name, result);
            } catch (error) {
                this.results.set(check.name, {
                    status: 'unhealthy',
                    details: { error: error instanceof Error ? error.message : String(error) },
                    timestamp: new Date(),
                });
            }
        });

        await Promise.all(promises);
    }

    start(): void {
        if (this.interval) return;
        this.runChecks(); // Run immediately
        this.interval = setInterval(() => this.runChecks(), this.checkIntervalMs);
        if (this.interval.unref) this.interval.unref();
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    getOverallStatus(): HealthStatus {
        let status: HealthStatus = 'healthy';
        for (const result of this.results.values()) {
            if (result.status === 'unhealthy') return 'unhealthy';
            if (result.status === 'degraded') status = 'degraded';
        }
        return status;
    }

    getResults(): Record<string, HealthCheckResult> {
        return Object.fromEntries(this.results);
    }
}
