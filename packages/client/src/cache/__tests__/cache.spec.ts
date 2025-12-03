import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from '../cache';
import { TimeBasedStrategy } from '../strategies';

describe('CacheManager', () => {
    let cache: CacheManager;

    beforeEach(() => {
        cache = new CacheManager();
    });

    it('should set and get values', () => {
        cache.set('key1', 'value1');
        expect(cache.get('key1').data).toBe('value1');
        expect(cache.get('key1').status).toBe('fresh');
    });

    it('should return undefined for missing keys', () => {
        expect(cache.get('missing').data).toBeUndefined();
        expect(cache.get('missing').status).toBe('expired');
    });

    it('should respect TTL', () => {
        const now = Date.now();
        vi.useFakeTimers();
        vi.setSystemTime(now);

        cache.set('key1', 'value1', 1000);
        expect(cache.get('key1').data).toBe('value1');

        vi.advanceTimersByTime(1001);
        expect(cache.get('key1').data).toBeUndefined();
        expect(cache.get('key1').status).toBe('expired');

        vi.useRealTimers();
    });

    it('should clear cache', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.clear();
        expect(cache.size()).toBe(0);
    });

    it('should remove specific key', () => {
        cache.set('key1', 'value1');
        cache.remove('key1');
        expect(cache.get('key1').data).toBeUndefined();
    });
});
