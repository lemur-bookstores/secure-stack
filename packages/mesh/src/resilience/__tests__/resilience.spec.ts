import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../RateLimiter';

describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
        rateLimiter = new RateLimiter({
            maxRequests: 5,
            windowMs: 1000,
        });
    });

    it('should allow requests within limit', async () => {
        for (let i = 0; i < 5; i++) {
            const result = await rateLimiter.checkLimit('client-1');
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(5 - i - 1);
        }
    });

    it('should block requests exceeding limit', async () => {
        for (let i = 0; i < 5; i++) {
            await rateLimiter.checkLimit('client-1');
        }

        const result = await rateLimiter.checkLimit('client-1');
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different clients separately', async () => {
        await rateLimiter.checkLimit('client-1');
        await rateLimiter.checkLimit('client-1');

        const result1 = await rateLimiter.checkLimit('client-1');
        expect(result1.remaining).toBe(2);

        const result2 = await rateLimiter.checkLimit('client-2');
        expect(result2.remaining).toBe(4);
    });

    it('should reset after window expires', async () => {
        for (let i = 0; i < 5; i++) {
            await rateLimiter.checkLimit('client-1');
        }

        await new Promise(resolve => setTimeout(resolve, 1100));

        const result = await rateLimiter.checkLimit('client-1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });
});
