/**
 * Cache Manager
 */

import { CacheStrategy, TimeBasedStrategy, CacheStatus } from './strategies';

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl?: number;
}

export interface CacheResult<T> {
    data: T | undefined;
    status: CacheStatus;
}

export class CacheManager {
    private storage: Map<string, CacheEntry<unknown>> = new Map();
    private strategy: CacheStrategy;

    constructor(strategy: CacheStrategy = TimeBasedStrategy) {
        this.strategy = strategy;
    }

    /**
     * Set a value in the cache
     */
    set<T>(key: string, data: T, ttl?: number): void {
        this.storage.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Get a value from the cache with its status
     */
    get<T>(key: string): CacheResult<T> {
        const entry = this.storage.get(key) as CacheEntry<T> | undefined;

        if (!entry) {
            return { data: undefined, status: CacheStatus.Expired };
        }

        const status = this.strategy.getStatus(entry.timestamp, entry.ttl);

        if (status === CacheStatus.Expired) {
            this.storage.delete(key);
            return { data: undefined, status };
        }

        return { data: entry.data, status };
    }

    /**
     * Clear the cache
     */
    clear(): void {
        this.storage.clear();
    }

    /**
     * Remove a specific key
     */
    remove(key: string): void {
        this.storage.delete(key);
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.storage.size;
    }
}
