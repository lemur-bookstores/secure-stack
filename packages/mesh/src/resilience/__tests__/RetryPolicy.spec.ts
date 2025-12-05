import { describe, it, expect, vi } from 'vitest';
import { RetryPolicy } from '../RetryPolicy';

describe('RetryPolicy', () => {
    it('should succeed on first attempt', async () => {
        const retryPolicy = new RetryPolicy({
            maxAttempts: 3,
            initialDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
        });

        const action = vi.fn(async () => 'success');
        const result = await retryPolicy.execute(action);

        expect(result).toBe('success');
        expect(action).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
        const retryPolicy = new RetryPolicy({
            maxAttempts: 3,
            initialDelay: 50,
            maxDelay: 500,
            backoffMultiplier: 2,
        });

        let attempts = 0;
        const action = vi.fn(async () => {
            attempts++;
            if (attempts < 3) {
                throw new Error('Temporary failure');
            }
            return 'success';
        });

        const result = await retryPolicy.execute(action);

        expect(result).toBe('success');
        expect(action).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts exhausted', async () => {
        const retryPolicy = new RetryPolicy({
            maxAttempts: 2,
            initialDelay: 50,
            maxDelay: 500,
            backoffMultiplier: 2,
        });

        const action = vi.fn(async () => {
            throw new Error('Permanent failure');
        });

        await expect(retryPolicy.execute(action)).rejects.toThrow('Permanent failure');
        expect(action).toHaveBeenCalledTimes(2);
    });

    it('should apply exponential backoff', async () => {
        const retryPolicy = new RetryPolicy({
            maxAttempts: 4,
            initialDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
        });

        const delays: number[] = [];
        let lastTime = Date.now();

        let attempts = 0;
        const action = vi.fn(async () => {
            const now = Date.now();
            if (attempts > 0) {
                delays.push(now - lastTime);
            }
            lastTime = now;
            attempts++;

            if (attempts < 4) {
                throw new Error('Retry');
            }
            return 'success';
        });

        await retryPolicy.execute(action);

        expect(delays.length).toBe(3);
        expect(delays[0]).toBeGreaterThanOrEqual(90); // ~100ms
        expect(delays[1]).toBeGreaterThanOrEqual(190); // ~200ms
        expect(delays[2]).toBeGreaterThanOrEqual(390); // ~400ms
    });

    it('should respect max delay', async () => {
        const retryPolicy = new RetryPolicy({
            maxAttempts: 6,
            initialDelay: 100,
            maxDelay: 300,
            backoffMultiplier: 2,
        });

        const delays: number[] = [];
        let lastTime = Date.now();

        let attempts = 0;
        const action = vi.fn(async () => {
            const now = Date.now();
            if (attempts > 0) {
                delays.push(now - lastTime);
            }
            lastTime = now;
            attempts++;

            if (attempts < 6) {
                throw new Error('Retry');
            }
            return 'success';
        });

        await retryPolicy.execute(action);

        expect(delays.length).toBe(5);
        expect(delays[0]).toBeGreaterThanOrEqual(90); // ~100ms
        expect(delays[1]).toBeGreaterThanOrEqual(190); // ~200ms
        expect(delays[2]).toBeLessThan(350); // Capped at ~300ms
        expect(delays[3]).toBeLessThan(350); // Capped at ~300ms
    });
});
