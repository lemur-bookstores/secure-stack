export enum CircuitState {
    CLOSED = 'closed',     // Normal operation
    OPEN = 'open',         // Blocking requests
    HALF_OPEN = 'half_open' // Testing if service recovered
}

export interface CircuitBreakerConfig {
    failureThreshold: number; // Number of failures before opening
    successThreshold: number; // Number of successes to close from half-open
    timeout: number; // Time to wait before trying again (ms)
    monitoringPeriod?: number; // Period to track failures (ms)
}

export class CircuitBreaker {
    private config: CircuitBreakerConfig;
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private successCount = 0;
    private nextAttempt = 0;
    private lastFailureTime = 0;

    constructor(config: CircuitBreakerConfig) {
        this.config = {
            failureThreshold: config.failureThreshold || 5,
            successThreshold: config.successThreshold || 2,
            timeout: config.timeout || 60000, // 1 minute default
            monitoringPeriod: config.monitoringPeriod || 120000, // 2 minutes default
        };
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (!this.canAttempt()) {
            throw new Error(`Circuit breaker is ${this.state}. Retry after ${Math.ceil((this.nextAttempt - Date.now()) / 1000)}s`);
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private canAttempt(): boolean {
        const now = Date.now();

        if (this.state === CircuitState.CLOSED) {
            return true;
        }

        if (this.state === CircuitState.OPEN) {
            if (now >= this.nextAttempt) {
                this.state = CircuitState.HALF_OPEN;
                this.successCount = 0;
                return true;
            }
            return false;
        }

        // HALF_OPEN state
        return true;
    }

    private onSuccess(): void {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.config.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.successCount = 0;
            }
        }
    }

    private onFailure(): void {
        const now = Date.now();
        this.lastFailureTime = now;
        this.failureCount++;

        // Reset old failures outside monitoring period
        if (this.config.monitoringPeriod &&
            now - this.lastFailureTime > this.config.monitoringPeriod) {
            this.failureCount = 1;
        }

        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = now + this.config.timeout;
            this.successCount = 0;
        } else if (this.failureCount >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = now + this.config.timeout;
        }
    }

    getState(): CircuitState {
        return this.state;
    }

    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = 0;
    }
}
