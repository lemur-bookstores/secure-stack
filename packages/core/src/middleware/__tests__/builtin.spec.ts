/**
 * Tests for built-in middlewares
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, errorHandler, cors } from '../builtin';
import type { BuiltinContext } from '../builtin';

describe('Built-in Middlewares', () => {
    describe('logger', () => {
        beforeEach(() => {
            vi.spyOn(console, 'log').mockImplementation(() => { });
        });

        it('should log request and response', async () => {
            const middleware = logger<BuiltinContext>();
            const ctx: BuiltinContext = {
                method: 'GET',
                path: '/users',
            };

            let nextCalled = false;
            const next = async () => {
                nextCalled = true;
            };

            await middleware(ctx, next);

            expect(nextCalled).toBe(true);
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('GET /users'));
        });

        it('should log procedure calls', async () => {
            const middleware = logger<BuiltinContext>();
            const ctx: BuiltinContext = {
                procedure: 'getUser',
            };

            await middleware(ctx, async () => { });

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('getUser'));
        });

        it('should measure execution time', async () => {
            const middleware = logger<BuiltinContext>();
            const ctx: BuiltinContext = {
                method: 'POST',
                path: '/users',
            };

            await middleware(ctx, async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
            });

            expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/\d+ms/));
        });
    });

    describe('errorHandler', () => {
        beforeEach(() => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
        });

        it('should catch errors and set context', async () => {
            const middleware = errorHandler<BuiltinContext>();
            const ctx: BuiltinContext = {};

            const error = new Error('Test error');
            const next = async () => {
                throw error;
            };

            await middleware(ctx, next);

            expect(ctx.error).toBe(error);
            expect(ctx.status).toBe(500);
            expect(ctx.body).toEqual({
                error: {
                    message: 'Test error',
                    code: 'INTERNAL_ERROR',
                },
            });
        });

        it('should preserve error status code', async () => {
            const middleware = errorHandler<BuiltinContext>();
            const ctx: BuiltinContext = {};

            const error: any = new Error('Not found');
            error.status = 404;
            error.code = 'NOT_FOUND';

            await middleware(ctx, async () => {
                throw error;
            });

            expect(ctx.status).toBe(404);
            expect(ctx.body?.error.code).toBe('NOT_FOUND');
        });

        it('should not catch if no error', async () => {
            const middleware = errorHandler<BuiltinContext>();
            const ctx: BuiltinContext = {};

            let nextCalled = false;
            await middleware(ctx, async () => {
                nextCalled = true;
            });

            expect(nextCalled).toBe(true);
            expect(ctx.error).toBeUndefined();
        });
    });

    describe('cors', () => {
        it('should set default CORS headers', async () => {
            const middleware = cors<BuiltinContext>();
            const ctx: BuiltinContext = {};

            await middleware(ctx, async () => { });

            expect(ctx.headers).toBeDefined();
            expect(ctx.headers?.['Access-Control-Allow-Origin']).toBe('*');
            expect(ctx.headers?.['Access-Control-Allow-Credentials']).toBe('false');
        });

        it('should set custom origin', async () => {
            const middleware = cors<BuiltinContext>({
                origin: 'https://example.com',
            });
            const ctx: BuiltinContext = {};

            await middleware(ctx, async () => { });

            expect(ctx.headers?.['Access-Control-Allow-Origin']).toBe('https://example.com');
        });

        it('should handle multiple origins', async () => {
            const middleware = cors<BuiltinContext>({
                origin: ['https://example.com', 'https://app.example.com'],
            });
            const ctx: BuiltinContext = {};

            await middleware(ctx, async () => { });

            expect(ctx.headers?.['Access-Control-Allow-Origin']).toBe(
                'https://example.com,https://app.example.com'
            );
        });

        it('should enable credentials', async () => {
            const middleware = cors<BuiltinContext>({
                credentials: true,
            });
            const ctx: BuiltinContext = {};

            await middleware(ctx, async () => { });

            expect(ctx.headers?.['Access-Control-Allow-Credentials']).toBe('true');
        });

        it('should call next', async () => {
            const middleware = cors<BuiltinContext>();
            const ctx: BuiltinContext = {};

            let nextCalled = false;
            await middleware(ctx, async () => {
                nextCalled = true;
            });

            expect(nextCalled).toBe(true);
        });
    });
});
