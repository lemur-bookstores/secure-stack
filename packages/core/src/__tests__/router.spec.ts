/**
 * Tests for Router
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { router } from '../router';
import { z } from 'zod';
import { SecureStackError } from '../error';

describe('Router', () => {
    let testRouter: ReturnType<typeof router>;

    beforeEach(() => {
        testRouter = router();
    });

    describe('Route Registration', () => {
        it('should register a query procedure', () => {
            testRouter.query('getUser', {
                input: z.string(),
                handler: async ({ input }) => ({ id: input, name: 'Test User' }),
            });

            const routes = testRouter.getRoutes();
            expect(routes.size).toBe(1);
            expect(routes.has('getUser')).toBe(true);
        });

        it('should register a mutation procedure', () => {
            testRouter.mutation('createUser', {
                input: z.object({ name: z.string() }),
                handler: async ({ input }) => ({ id: '123', ...input }),
            });

            const routes = testRouter.getRoutes();
            expect(routes.size).toBe(1);
            expect(routes.has('createUser')).toBe(true);
        });

        it('should register a subscription procedure', () => {
            testRouter.subscription('onUserUpdated', {
                input: z.string(),
                handler: async ({ input }) => ({ userId: input }),
            });

            const routes = testRouter.getRoutes();
            expect(routes.size).toBe(1);
            expect(routes.has('onUserUpdated')).toBe(true);
        });

        it('should chain multiple procedures', () => {
            testRouter
                .query('getUser', {
                    handler: async () => ({ id: '1', name: 'Test' }),
                })
                .mutation('updateUser', {
                    handler: async () => ({ id: '1', name: 'Updated' }),
                })
                .subscription('onUpdate', {
                    handler: async () => ({ event: 'update' }),
                });

            const routes = testRouter.getRoutes();
            expect(routes.size).toBe(3);
        });
    });

    describe('Procedure Execution', () => {
        it('should execute a simple query', async () => {
            testRouter.query('hello', {
                handler: async () => 'Hello, World!',
            });

            const result = await testRouter.executeProcedure('hello', undefined, {});
            expect(result).toBe('Hello, World!');
        });

        it('should execute with input validation', async () => {
            testRouter.query('getUser', {
                input: z.string(),
                handler: async ({ input }) => ({ id: input, name: 'Test User' }),
            });

            const result = await testRouter.executeProcedure('getUser', 'user123', {});
            expect(result).toEqual({ id: 'user123', name: 'Test User' });
        });

        it('should validate complex input schemas', async () => {
            testRouter.mutation('createUser', {
                input: z.object({
                    name: z.string().min(3),
                    email: z.string().email(),
                    age: z.number().min(18),
                }),
                handler: async ({ input }) => ({ id: '123', ...input }),
            });

            const result = await testRouter.executeProcedure('createUser', {
                name: 'John Doe',
                email: 'john@example.com',
                age: 25,
            }, {});

            expect(result).toEqual({
                id: '123',
                name: 'John Doe',
                email: 'john@example.com',
                age: 25,
            });
        });

        it('should throw validation error for invalid input', async () => {
            testRouter.query('getUser', {
                input: z.string().min(5),
                handler: async ({ input }) => ({ id: input }),
            });

            await expect(
                testRouter.executeProcedure('getUser', 'abc', {})
            ).rejects.toThrow(SecureStackError);
        });

        it('should validate output if schema provided', async () => {
            testRouter.query('getUser', {
                output: z.object({
                    id: z.string(),
                    name: z.string(),
                }),
                handler: async () => ({ id: '123', name: 'Test' }),
            });

            const result = await testRouter.executeProcedure('getUser', undefined, {});
            expect(result).toEqual({ id: '123', name: 'Test' });
        });

        it('should throw error for invalid output', async () => {
            testRouter.query('getUser', {
                output: z.object({
                    id: z.string(),
                    name: z.string(),
                }),
                handler: async () => ({ id: 123 } as any), // Invalid output
            });

            await expect(
                testRouter.executeProcedure('getUser', undefined, {})
            ).rejects.toThrow(SecureStackError);
        });

        it('should access context in handler', async () => {
            testRouter.query('getCurrentUser', {
                handler: async ({ ctx }) => {
                    return ctx.user;
                },
            });

            const result = await testRouter.executeProcedure(
                'getCurrentUser',
                undefined,
                { user: { id: '123', name: 'Test' } }
            );

            expect(result).toEqual({ id: '123', name: 'Test' });
        });

        it('should throw NOT_FOUND for non-existent procedure', async () => {
            await expect(
                testRouter.executeProcedure('nonExistent', undefined, {})
            ).rejects.toThrow('Procedure \'nonExistent\' not found');
        });

        it('should wrap handler errors in SecureStackError', async () => {
            testRouter.query('errorQuery', {
                handler: async () => {
                    throw new Error('Something went wrong');
                },
            });

            await expect(
                testRouter.executeProcedure('errorQuery', undefined, {})
            ).rejects.toThrow(SecureStackError);
        });

        it('should preserve SecureStackError thrown by handler', async () => {
            testRouter.query('customError', {
                handler: async () => {
                    throw SecureStackError.unauthorized('Custom auth error');
                },
            });

            try {
                await testRouter.executeProcedure('customError', undefined, {});
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error).toBeInstanceOf(SecureStackError);
                expect(error.code).toBe('UNAUTHORIZED');
                expect(error.message).toBe('Custom auth error');
            }
        });
    });

    describe('Middleware', () => {
        it('should register middleware', () => {
            const middleware = async (ctx: any, next: any) => {
                await next();
            };

            testRouter.middleware(middleware);

            const middlewares = testRouter.getMiddlewares();
            expect(middlewares.length).toBe(1);
        });

        it('should chain multiple middlewares', () => {
            const mw1 = async (ctx: any, next: any) => await next();
            const mw2 = async (ctx: any, next: any) => await next();

            testRouter.middleware(mw1).middleware(mw2);

            const middlewares = testRouter.getMiddlewares();
            expect(middlewares.length).toBe(2);
        });
    });

    describe('Type Inference', () => {
        it('should infer types correctly', () => {
            const userSchema = z.object({
                id: z.string(),
                name: z.string(),
                email: z.string().email(),
            });

            testRouter.query('getUser', {
                input: z.string(),
                output: userSchema,
                handler: async ({ input }) => {
                    // TypeScript should know input is string
                    const userId: string = input;
                    return {
                        id: userId,
                        name: 'Test',
                        email: 'test@example.com',
                    };
                },
            });

            expect(testRouter.getRoutes().size).toBe(1);
        });
    });
});
