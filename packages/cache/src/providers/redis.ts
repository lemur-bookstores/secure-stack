import Redis, { RedisOptions } from 'ioredis';
import { CacheProvider } from '../interfaces/cache-provider.js';

export interface RedisConfig extends RedisOptions {
    ttl?: number;
}

export class RedisProvider implements CacheProvider {
    private client: Redis;
    private defaultTtl: number;

    constructor(config: RedisConfig = {}) {
        this.defaultTtl = config.ttl || 60;
        // Remove ttl from config before passing to Redis constructor to avoid warnings
        const { ttl, ...redisOptions } = config;
        this.client = new Redis(redisOptions);
    }

    async get<T>(key: string): Promise<T | null> {
        const value = await this.client.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return value as unknown as T;
        }
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        const finalTtl = ttl || this.defaultTtl;

        if (finalTtl) {
            await this.client.set(key, stringValue, 'EX', finalTtl);
        } else {
            await this.client.set(key, stringValue);
        }
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async clear(): Promise<void> {
        await this.client.flushdb();
    }

    async has(key: string): Promise<boolean> {
        const exists = await this.client.exists(key);
        return exists === 1;
    }

    /**
     * Get the underlying Redis client
     */
    getClient(): Redis {
        return this.client;
    }

    /**
     * Close the connection
     */
    async disconnect(): Promise<void> {
        await this.client.quit();
    }
}
