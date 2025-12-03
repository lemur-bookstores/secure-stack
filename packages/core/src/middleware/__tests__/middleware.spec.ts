import { describe, it, expect, vi } from 'vitest';
import { compose, createMiddleware } from '../middleware';

describe('Middleware System', () => {
    it('should execute middleware in order', async () => {
        const callOrder: number[] = [];

        const m1 = createMiddleware(async (ctx: any, next: () => Promise<void>) => {
            callOrder.push(1);
            await next();
            callOrder.push(6);
        });

        const m2 = createMiddleware(async (ctx: any, next: () => Promise<void>) => {
            callOrder.push(2);
            await next();
            callOrder.push(5);
        });

        const m3 = createMiddleware(async (ctx: any, next: () => Promise<void>) => {
            callOrder.push(3);
            await next();
            callOrder.push(4);
        });

        const composed = compose([m1, m2, m3]);
        await composed({}, async () => { });

        expect(callOrder).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle errors correctly', async () => {
        const m1 = createMiddleware(async (ctx: any, next: () => Promise<void>) => {
            try {
                await next();
            } catch (err: any) {
                ctx.error = err.message;
            }
        });

        const m2 = createMiddleware(async () => {
            throw new Error('Test Error');
        });

        const composed = compose([m1, m2]);
        const ctx: any = {};
        await composed(ctx, async () => { });

        expect(ctx.error).toBe('Test Error');
    });

    it('should throw if next() is called multiple times', async () => {
        const m1 = createMiddleware(async (ctx: any, next: () => Promise<void>) => {
            await next();
            await next();
        });

        const composed = compose([m1]);
        await expect(composed({}, async () => { })).rejects.toThrow('next() called multiple times');
    });
});
