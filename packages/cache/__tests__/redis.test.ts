import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisProvider } from '../src/providers/redis.js';
import Redis from 'ioredis';

vi.mock('ioredis', () => {
    const Redis = vi.fn();
    return { default: Redis };
});

describe('RedisProvider', () => {
    let provider: RedisProvider;
    let mockRedis: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRedis = {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
            flushdb: vi.fn(),
            exists: vi.fn(),
            quit: vi.fn(),
        };
        (Redis as unknown as any).mockImplementation(() => mockRedis);
        provider = new RedisProvider();
    });

    it('should get a value', async () => {
        mockRedis.get.mockResolvedValue('"value"');
        const result = await provider.get('key');
        expect(result).toBe('value');
        expect(mockRedis.get).toHaveBeenCalledWith('key');
    });

    it('should return null if key does not exist', async () => {
        mockRedis.get.mockResolvedValue(null);
        const result = await provider.get('key');
        expect(result).toBeNull();
    });

    it('should set a value', async () => {
        await provider.set('key', 'value');
        expect(mockRedis.set).toHaveBeenCalledWith('key', 'value', 'EX', 60);
    });

    it('should set a value with custom TTL', async () => {
        await provider.set('key', 'value', 100);
        expect(mockRedis.set).toHaveBeenCalledWith('key', 'value', 'EX', 100);
    });

    it('should delete a value', async () => {
        await provider.del('key');
        expect(mockRedis.del).toHaveBeenCalledWith('key');
    });

    it('should clear all values', async () => {
        await provider.clear();
        expect(mockRedis.flushdb).toHaveBeenCalled();
    });

    it('should check if key exists', async () => {
        mockRedis.exists.mockResolvedValue(1);
        expect(await provider.has('key')).toBe(true);
        mockRedis.exists.mockResolvedValue(0);
        expect(await provider.has('key')).toBe(false);
    });
});
