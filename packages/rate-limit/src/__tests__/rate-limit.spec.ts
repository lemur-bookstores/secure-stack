import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimitMiddleware } from '../middleware';
import { MemoryStore } from '../store/MemoryStore';

describe('Rate Limit Middleware', () => {
    let ctx: any;
    let next: any;

    beforeEach(() => {
        ctx = {
            ip: '127.0.0.1',
            set: vi.fn(),
            body: null,
            status: 200,
        };
        next = vi.fn().mockResolvedValue(undefined);
    });

    it('should allow requests within limit', async () => {
        const middleware = rateLimitMiddleware({
            windowMs: 1000,
            max: 2,
            store: new MemoryStore(1000)
        });

        await middleware(ctx, next);
        expect(next).toHaveBeenCalled();
        expect(ctx.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '1');

        await middleware(ctx, next);
        expect(next).toHaveBeenCalledTimes(2);
        expect(ctx.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    });

    it('should block requests exceeding limit', async () => {
        const middleware = rateLimitMiddleware({
            windowMs: 1000,
            max: 1,
            store: new MemoryStore(1000)
        });

        await middleware(ctx, next);
        expect(next).toHaveBeenCalled();

        // Reset mocks for second call
        next.mockClear();
        ctx.set.mockClear();

        await middleware(ctx, next);
        expect(next).not.toHaveBeenCalled();
        expect(ctx.status).toBe(429);
        expect(ctx.body).toBe('Too many requests, please try again later.');
    });

    it('should use custom key generator', async () => {
        const middleware = rateLimitMiddleware({
            windowMs: 1000,
            max: 1,
            keyGenerator: (c) => c.user.id,
            store: new MemoryStore(1000)
        });

        ctx.user = { id: 'user-1' };
        await middleware(ctx, next);
        expect(next).toHaveBeenCalled();

        // Different user should pass
        const ctx2 = { ...ctx, user: { id: 'user-2' }, set: vi.fn() };
        await middleware(ctx2, next);
        expect(next).toHaveBeenCalledTimes(2);
    });
});
