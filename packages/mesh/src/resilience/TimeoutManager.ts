export interface TimeoutConfig {
    timeout: number; // ms
    errorMessage?: string;
}

export class TimeoutManager {
    private config: TimeoutConfig;

    constructor(config: TimeoutConfig) {
        this.config = {
            timeout: config.timeout,
            errorMessage: config.errorMessage || `Operation timed out after ${config.timeout}ms`,
        };
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        return Promise.race([
            fn(),
            this.createTimeoutPromise<T>(),
        ]);
    }

    private createTimeoutPromise<T>(): Promise<T> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(this.config.errorMessage));
            }, this.config.timeout);
        });
    }
}
