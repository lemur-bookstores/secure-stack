import { Client } from 'memjs';
import { CacheProvider } from '../interfaces/cache-provider.js';

export interface MemcachedConfig {
    servers?: string;
    options?: {
        retries?: number;
        retry_delay?: number;
        expires?: number;
        logger?: any;
        timeout?: number;
        conntimeout?: number;
        keepAlive?: boolean;
        keepAliveDelay?: number;
    };
}

export class MemcachedProvider implements CacheProvider {
    private client: Client;
    private defaultTtl: number;

    constructor(config: MemcachedConfig = {}) {
        this.defaultTtl = config.options?.expires || 60;
        this.client = Client.create(config.servers, config.options);
    }

    async get<T>(key: string): Promise<T | null> {
        const { value } = await this.client.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value.toString()) as T;
        } catch {
            return value.toString() as unknown as T;
        }
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        const finalTtl = ttl || this.defaultTtl;

        await this.client.set(key, stringValue, { expires: finalTtl });
    }

    async del(key: string): Promise<void> {
        await this.client.delete(key);
    }

    async clear(): Promise<void> {
        await this.client.flush();
    }

    async has(key: string): Promise<boolean> {
        // Memcached doesn't have a direct 'exists' command, so we try to get it
        const { value } = await this.client.get(key);
        return !!value;
    }

    /**
     * Get the underlying Memcached client
     */
    getClient(): Client {
        return this.client;
    }

    /**
     * Close the connection
     */
    async disconnect(): Promise<void> {
        this.client.close();
    }
}
