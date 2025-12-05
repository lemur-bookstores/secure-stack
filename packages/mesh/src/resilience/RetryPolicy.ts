export interface RetryPolicyConfig {
    maxAttempts: number;
    initialDelay?: number; // ms
    maxDelay?: number; // ms
    backoffMultiplier?: number;
    retryableErrors?: string[]; // Error codes/messages to retry
}

export class RetryPolicy {
    private config: RetryPolicyConfig;

    constructor(config: RetryPolicyConfig) {
        this.config = {
            maxAttempts: config.maxAttempts || 3,
            initialDelay: config.initialDelay || 1000,
            maxDelay: config.maxDelay || 30000,
            backoffMultiplier: config.backoffMultiplier || 2,
            retryableErrors: config.retryableErrors || [],
        };
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: any;

        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error: any) {
                lastError = error;

                // Check if error is retryable
                if (this.config.retryableErrors!.length > 0) {
                    const isRetryable = this.config.retryableErrors!.some(
                        (pattern) => error.message?.includes(pattern) || error.code === pattern
                    );
                    if (!isRetryable) {
                        throw error;
                    }
                }

                // Don't retry on last attempt
                if (attempt === this.config.maxAttempts) {
                    break;
                }

                // Calculate backoff delay
                const delay = this.calculateDelay(attempt);
                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    private calculateDelay(attempt: number): number {
        const delay = this.config.initialDelay! * Math.pow(this.config.backoffMultiplier!, attempt - 1);
        return Math.min(delay, this.config.maxDelay!);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export interface TimeoutConfig {
    timeout: number; // ms
    errorMessage?: string;
}

export class TimeoutManager {
    private config: TimeoutConfig;

    constructor(config: TimeoutConfig) {
        this.config = {
            timeout: config.timeout || 30000,
            errorMessage: config.errorMessage || 'Operation timed out',
        };
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        return Promise.race([
            fn(),
            this.createTimeout(),
        ]);
    }

    private createTimeout(): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(this.config.errorMessage));
            }, this.config.timeout);
        });
    }
}
