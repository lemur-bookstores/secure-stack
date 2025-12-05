import { CacheProvider } from './interfaces/cache-provider.js';
import { MemoryProvider, MemoryConfig } from './providers/memory.js';
import { RedisProvider, RedisConfig } from './providers/redis.js';
import { MemcachedProvider, MemcachedConfig } from './providers/memcached.js';
import { SqliteProvider, SqliteConfig } from './providers/sqlite.js';
import { MongoProvider, MongoConfig } from './providers/mongo.js';

export type CacheStore = 'memory' | 'redis' | 'memcached' | 'sqlite' | 'mongo';

export interface CacheConfig {
    store?: CacheStore;
    ttl?: number;
    memory?: MemoryConfig;
    redis?: RedisConfig;
    memcached?: MemcachedConfig;
    sqlite?: SqliteConfig;
    mongo?: MongoConfig;
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
                this.provider = new RedisProvider(config.redis);
                break;
            case 'memcached':
                this.provider = new MemcachedProvider(config.memcached);
                break;
            case 'sqlite':
                this.provider = new SqliteProvider(config.sqlite);
                break;
            case 'mongo':
                if (!config.mongo) throw new Error('Mongo configuration is required');
                this.provider = new MongoProvider(config.mongo);
                break;
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
