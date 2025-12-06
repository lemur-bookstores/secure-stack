import { LRUCache } from 'lru-cache';
import { CacheProvider } from '../interfaces/cache-provider.js';

export interface MemoryConfig {
    max?: number;
    ttl?: number;
}

export class MemoryProvider implements CacheProvider {
    private cache: LRUCache<string, any>;

    constructor(config: MemoryConfig = {}) {
        this.cache = new LRUCache({
            max: config.max || 500,
            ttl: (config.ttl || 60) * 1000, // Convert to ms
        });
    }

    async get<T>(key: string): Promise<T | null> {
        const value = this.cache.get(key);
        return (value as T) || null;
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        this.cache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    async has(key: string): Promise<boolean> {
        return this.cache.has(key);
    }
}
