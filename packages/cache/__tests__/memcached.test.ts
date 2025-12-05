import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemcachedProvider } from '../src/providers/memcached.js';
import { Client } from 'memjs';

vi.mock('memjs', () => {
    return {
        Client: {
            create: vi.fn(),
        },
    };
});

describe('MemcachedProvider', () => {
    let provider: MemcachedProvider;
    let mockClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockClient = {
            get: vi.fn(),
            set: vi.fn(),
            delete: vi.fn(),
            flush: vi.fn(),
            close: vi.fn(),
        };
        (Client.create as any).mockReturnValue(mockClient);
        provider = new MemcachedProvider();
    });

    it('should get a value', async () => {
        mockClient.get.mockResolvedValue({ value: Buffer.from('"value"') });
        const result = await provider.get('key');
        expect(result).toBe('value');
        expect(mockClient.get).toHaveBeenCalledWith('key');
    });

    it('should return null if key does not exist', async () => {
        mockClient.get.mockResolvedValue({ value: null });
        const result = await provider.get('key');
        expect(result).toBeNull();
    });

    it('should set a value', async () => {
        await provider.set('key', 'value');
        expect(mockClient.set).toHaveBeenCalledWith('key', 'value', { expires: 60 });
    });

    it('should set a value with custom TTL', async () => {
        await provider.set('key', 'value', 100);
        expect(mockClient.set).toHaveBeenCalledWith('key', 'value', { expires: 100 });
    });

    it('should delete a value', async () => {
        await provider.del('key');
        expect(mockClient.delete).toHaveBeenCalledWith('key');
    });

    it('should clear all values', async () => {
        await provider.clear();
        expect(mockClient.flush).toHaveBeenCalled();
    });

    it('should check if key exists', async () => {
        mockClient.get.mockResolvedValue({ value: Buffer.from('value') });
        expect(await provider.has('key')).toBe(true);
        mockClient.get.mockResolvedValue({ value: null });
        expect(await provider.has('key')).toBe(false);
    });
});
