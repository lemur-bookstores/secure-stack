import { describe, it, expect } from 'vitest';
import { CacheManager } from '../src/manager.js';
import { MemoryProvider } from '../src/providers/memory.js';
import { RedisProvider } from '../src/providers/redis.js';
import { MemcachedProvider } from '../src/providers/memcached.js';
import { SqliteProvider } from '../src/providers/sqlite.js';
import { MongoProvider } from '../src/providers/mongo.js';

describe('CacheManager', () => {
    it('should use memory provider by default', () => {
        const manager = new CacheManager();
        expect(manager.getProvider()).toBeInstanceOf(MemoryProvider);
    });

    it('should initialize redis provider', () => {
        const manager = new CacheManager({ store: 'redis' });
        expect(manager.getProvider()).toBeInstanceOf(RedisProvider);
    });

    it('should initialize memcached provider', () => {
        const manager = new CacheManager({ store: 'memcached' });
        expect(manager.getProvider()).toBeInstanceOf(MemcachedProvider);
    });

    it('should initialize sqlite provider', () => {
        const manager = new CacheManager({ store: 'sqlite' });
        expect(manager.getProvider()).toBeInstanceOf(SqliteProvider);
    });

    it('should initialize mongo provider', () => {
        const manager = new CacheManager({ store: 'mongo', mongo: { url: 'mongodb://localhost' } });
        expect(manager.getProvider()).toBeInstanceOf(MongoProvider);
    });

    it('should throw error if mongo config is missing', () => {
        expect(() => new CacheManager({ store: 'mongo' })).toThrow('Mongo configuration is required');
    });

    it('should throw error for unsupported provider', () => {
        expect(() => new CacheManager({ store: 'invalid' as any })).toThrow('Unsupported cache store: invalid');
    });

    it('should proxy methods to provider', async () => {
        const manager = new CacheManager();
        await manager.set('key', 'value');
        expect(await manager.get('key')).toBe('value');
        expect(await manager.has('key')).toBe(true);
        await manager.del('key');
        expect(await manager.get('key')).toBeNull();
    });
});
