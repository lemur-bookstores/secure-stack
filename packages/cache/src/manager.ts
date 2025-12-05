import { CacheProvider } from './interfaces/cache-provider.js';
import { MemoryProvider, MemoryConfig } from './providers/memory.js';

export type CacheStore = 'memory' | 'redis' | 'memcached';

export interface CacheConfig {
    store?: CacheStore;
    ttl?: number;
    memory?: MemoryConfig;
    // redis?: RedisConfig; // To be implemented
    // memcached?: MemcachedConfig; // To be implemented
}

export class CacheManager {
    private provider: CacheProvider;

    constructor(config: CacheConfig = {}) {
        const store = config.store || 'memory';

        switch (store) {
            case 'memory':
                this.provider = new MemoryProvider(config.memory);
                break;
            case 'redis':
                throw new Error('Redis provider not implemented yet');
            case 'memcached':
                throw new Error('Memcached provider not implemented yet');
            default:
                throw new Error(`Unsupported cache store: ${store}`);
        }
    }

    /**
     * Get the underlying provider
     */
    getProvider(): CacheProvider {
        return this.provider;
    }

    async get<T>(key: string): Promise<T | null> {
        return this.provider.get<T>(key);
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        return this.provider.set(key, value, ttl);
    }

    async del(key: string): Promise<void> {
        return this.provider.del(key);
    }

    async clear(): Promise<void> {
        return this.provider.clear();
    }

    async has(key: string): Promise<boolean> {
        return this.provider.has(key);
    }
}
