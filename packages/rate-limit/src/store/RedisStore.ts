import { RateLimitStore, RateLimitInfo } from '../types';

// Minimal Redis client interface compatible with ioredis or node-redis
export interface RedisClient {
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    del(key: string): Promise<number>;
}

export class RedisStore implements RateLimitStore {
    private client: RedisClient;
    private windowMs: number;

    constructor(client: RedisClient, windowMs: number) {
        this.client = client;
        this.windowMs = windowMs;
    }

    async increment(key: string): Promise<RateLimitInfo> {
        const hits = await this.client.incr(key);

        // If this is the first hit, set the expiration
        if (hits === 1) {
            await this.client.expire(key, Math.ceil(this.windowMs / 1000));
        }

        const ttl = await this.client.ttl(key);
        const resetTime = new Date(Date.now() + (ttl * 1000));

        return {
            totalHits: hits,
            resetTime,
        };
    }

    async decrement(key: string): Promise<void> {
        await this.client.decr(key);
    }

    async resetKey(key: string): Promise<void> {
        await this.client.del(key);
    }
}
