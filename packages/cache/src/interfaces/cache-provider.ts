export interface CacheProvider {
    /**
     * Get a value from the cache
     * @param key The key to retrieve
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Set a value in the cache
     * @param key The key to set
     * @param value The value to store
     * @param ttl Time to live in seconds (optional)
     */
    set<T>(key: string, value: T, ttl?: number): Promise<void>;

    /**
     * Delete a value from the cache
     * @param key The key to delete
     */
    del(key: string): Promise<void>;

    /**
     * Clear all values from the cache
     */
    clear(): Promise<void>;

    /**
     * Check if a key exists in the cache
     * @param key The key to check
     */
    has(key: string): Promise<boolean>;
}
