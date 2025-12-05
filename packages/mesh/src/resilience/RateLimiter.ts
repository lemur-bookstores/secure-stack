import { RateLimiterConfig, RateLimitResult } from './types';

interface ClientRecord {
    count: number;
    resetTime: number;
    blockedUntil?: number;
}

export class RateLimiter {
    private config: RateLimiterConfig;
    private clients: Map<string, ClientRecord> = new Map();
    private cleanupInterval: NodeJS.Timeout;

    constructor(config: RateLimiterConfig) {
        this.config = {
            maxRequests: config.maxRequests || 100,
            windowMs: config.windowMs || 60000, // 1 minute default
            blockDuration: config.blockDuration || config.windowMs,
        };

        // Cleanup expired entries every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    async checkLimit(clientId: string): Promise<RateLimitResult> {
        const now = Date.now();
        let record = this.clients.get(clientId);

        // Check if client is blocked
        if (record?.blockedUntil && record.blockedUntil > now) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: new Date(record.resetTime),
                retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
            };
        }

        // Initialize or reset if window expired
        if (!record || record.resetTime <= now) {
            record = {
                count: 0,
                resetTime: now + this.config.windowMs,
            };
        }

        record.count++;

        // Check if limit exceeded
        if (record.count > this.config.maxRequests) {
            record.blockedUntil = now + (this.config.blockDuration || this.config.windowMs);
            this.clients.set(clientId, record);

            return {
                allowed: false,
                remaining: 0,
                resetTime: new Date(record.resetTime),
                retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
            };
        }

        this.clients.set(clientId, record);

        return {
            allowed: true,
            remaining: this.config.maxRequests - record.count,
            resetTime: new Date(record.resetTime),
        };
    }

    reset(clientId: string): void {
        this.clients.delete(clientId);
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [clientId, record] of this.clients.entries()) {
            if (record.resetTime <= now && (!record.blockedUntil || record.blockedUntil <= now)) {
                this.clients.delete(clientId);
            }
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.clients.clear();
    }
}
