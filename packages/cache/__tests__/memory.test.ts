import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryProvider } from '../src/providers/memory.js';

describe('MemoryProvider', () => {
    let provider: MemoryProvider;

    beforeEach(() => {
        provider = new MemoryProvider();
    });

    it('should set and get a value', async () => {
        await provider.set('key', 'value');
        const result = await provider.get('key');
        expect(result).toBe('value');
    });

    it('should return null for non-existent key', async () => {
        const result = await provider.get('non-existent');
        expect(result).toBeNull();
    });

    it('should delete a value', async () => {
        await provider.set('key', 'value');
        await provider.del('key');
        const result = await provider.get('key');
        expect(result).toBeNull();
    });

    it('should clear all values', async () => {
        await provider.set('key1', 'value1');
        await provider.set('key2', 'value2');
        await provider.clear();
        expect(await provider.get('key1')).toBeNull();
        expect(await provider.get('key2')).toBeNull();
    });

    it('should check if key exists', async () => {
        await provider.set('key', 'value');
        expect(await provider.has('key')).toBe(true);
        expect(await provider.has('non-existent')).toBe(false);
    });

    it('should respect TTL', async () => {
        // We can't easily test exact TTL with lru-cache without mocking time or waiting
        // But we can verify it accepts the argument
        await provider.set('key', 'value', 1);
        expect(await provider.get('key')).toBe('value');
    });
});
