import { RateLimitStore, RateLimitInfo } from '../types';

interface HitRecord {
    hits: number;
    resetTime: number;
}

export class MemoryStore implements RateLimitStore {
    private hits: Map<string, HitRecord> = new Map();
    private windowMs: number;
    private cleanupInterval: NodeJS.Timeout;

    constructor(windowMs: number) {
        this.windowMs = windowMs;
        // Cleanup every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        // Ensure interval doesn't prevent process exit
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    async increment(key: string): Promise<RateLimitInfo> {
        const now = Date.now();
        let record = this.hits.get(key);

        if (!record || record.resetTime <= now) {
            record = {
                hits: 0,
                resetTime: now + this.windowMs,
            };
        }

        record.hits++;
        this.hits.set(key, record);

        return {
            totalHits: record.hits,
            resetTime: new Date(record.resetTime),
        };
    }

    async decrement(key: string): Promise<void> {
        const record = this.hits.get(key);
        if (record && record.hits > 0) {
            record.hits--;
            this.hits.set(key, record);
        }
    }

    async resetKey(key: string): Promise<void> {
        this.hits.delete(key);
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, record] of this.hits.entries()) {
            if (record.resetTime <= now) {
                this.hits.delete(key);
            }
        }
    }
}
