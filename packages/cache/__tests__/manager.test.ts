import { describe, it, expect } from 'vitest';
import { CacheManager } from '../src/manager.js';
import { MemoryProvider } from '../src/providers/memory.js';

describe('CacheManager', () => {
    it('should use memory provider by default', () => {
        const manager = new CacheManager();
        expect(manager.getProvider()).toBeInstanceOf(MemoryProvider);
    });

    it('should throw error for unsupported provider', () => {
        expect(() => new CacheManager({ store: 'redis' as any })).toThrow('Redis provider not implemented yet');
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
