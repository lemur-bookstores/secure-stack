import { RateLimitConfig, RateLimitStore } from './types';
import { MemoryStore } from './store/MemoryStore';

export class RateLimitManager {
    private store: RateLimitStore;
    private config: RateLimitConfig;

    constructor(config: Partial<RateLimitConfig> & { windowMs: number; max: number }) {
        this.config = {
            message: 'Too many requests, please try again later.',
            statusCode: 429,
            headers: true,
            ...config,
        };

        this.store = config.store || new MemoryStore(this.config.windowMs);
    }

    async checkLimit(key: string): Promise<{
        isRateLimited: boolean;
        info: {
            limit: number;
            current: number;
            remaining: number;
            resetTime: Date;
        };
    }> {
        const info = await this.store.increment(key);
        const isRateLimited = info.totalHits > this.config.max;

        return {
            isRateLimited,
            info: {
                limit: this.config.max,
                current: info.totalHits,
                remaining: Math.max(0, this.config.max - info.totalHits),
                resetTime: info.resetTime,
            },
        };
    }
}
