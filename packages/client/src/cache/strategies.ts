/**
 * Cache Strategies
 */

export enum CacheStatus {
    Fresh = 'fresh',
    Stale = 'stale',
    Expired = 'expired',
}

export interface CacheStrategy {
    /**
     * Determine the status of a cached value
     */
    getStatus(timestamp: number, ttl?: number): CacheStatus;
}

/**
 * Time-based cache strategy
 * Returns Expired if time > ttl, otherwise Fresh.
 */
export const TimeBasedStrategy: CacheStrategy = {
    getStatus(timestamp: number, ttl: number = 60 * 1000): CacheStatus {
        return Date.now() - timestamp < ttl ? CacheStatus.Fresh : CacheStatus.Expired;
    },
};

/**
 * Stale-while-revalidate strategy
 * Returns Fresh if time < ttl.
 * Returns Stale if time > ttl but < maxStale (default 24h).
 * Returns Expired otherwise.
 */
export const StaleWhileRevalidateStrategy: CacheStrategy = {
    getStatus(timestamp: number, ttl: number = 60 * 1000): CacheStatus {
        const age = Date.now() - timestamp;
        const maxStale = 24 * 60 * 60 * 1000; // 24 hours default for stale

        if (age < ttl) {
            return CacheStatus.Fresh;
        }
        if (age < maxStale) {
            return CacheStatus.Stale;
        }
        return CacheStatus.Expired;
    },
};
