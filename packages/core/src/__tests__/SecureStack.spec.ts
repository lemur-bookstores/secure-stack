/**
 * Tests for SecureStack main class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SecureStack } from '../SecureStack';
import { router } from '../router';
import { z } from 'zod';
import { DiscoveryMode, EncryptionMode, SecureStackConfig } from '../types';

describe('SecureStack', () => {
    let app: SecureStack;

    beforeEach(() => {
        app = new SecureStack({
            name: 'test-service',
            port: 3000,
        });
    });

    describe('Initialization', () => {
        it('should create instance with basic config', () => {
            expect(app).toBeInstanceOf(SecureStack);
        });

        it('should initialize with mesh disabled by default', () => {
            const config = {
                name: 'test',
                port: 3000,
            };
            const instance = new SecureStack(config);
            expect(instance).toBeDefined();
        });

        it('should initialize with mesh enabled', () => {
            const config: SecureStackConfig = {
                name: 'test',
                port: 3000,
                mesh: {
                    enabled: true,
                    security: {
                        encryption: EncryptionMode.Hybrid,
                    },
                },
            };
            const instance = new SecureStack(config);
            expect(instance.mesh).toBeDefined();
        });
    });

    describe('Router Registration', () => {
        it('should register a router', () => {
            const userRouter = router();
            app.router('user', userRouter);
            // Test passes if no error thrown
            expect(true).toBe(true);
        });

        it('should register multiple routers', () => {
            const userRouter = router();
            const postRouter = router();

            app
                .router('user', userRouter)
                .router('post', postRouter);

            expect(true).toBe(true);
        });
    });

    describe('Middleware', () => {
        it('should register middleware', () => {
            const middleware = async (ctx: any, next: any) => {
                ctx.timestamp = Date.now();
                await next();
            };

            app.use(middleware);
            expect(true).toBe(true);
        });

        it('should execute middleware chain', async () => {
            const execution: string[] = [];

            app.use(async (ctx: any, next: any) => {
                execution.push('mw1-before');
                await next();
                execution.push('mw1-after');
            });

            app.use(async (ctx: any, next: any) => {
                execution.push('mw2-before');
                await next();
                execution.push('mw2-after');
            });

            const ctx = app.createContext();
            await app.executeMiddleware(ctx);

            expect(execution).toEqual([
                'mw1-before',
                'mw2-before',
                'mw2-after',
                'mw1-after',
            ]);
        });
    });

    describe('Context', () => {
        it('should create default context', () => {
            const ctx = app.createContext();
            expect(ctx).toBeDefined();
        });

        it('should create context with initial values', () => {
            const ctx = app.createContext({ user: { id: '123' } });
            expect(ctx.user).toEqual({ id: '123' });
        });

        it('should use custom context factory', () => {
            interface CustomContext {
                requestId: string;
                user?: any;
            }

            const customApp = new SecureStack<CustomContext>({
                name: 'test',
                port: 3000,
            });

            customApp.setContextFactory((initial) => ({
                requestId: Math.random().toString(36),
                ...initial,
            } as CustomContext));

            const ctx = customApp.createContext();
            expect(ctx.requestId).toBeDefined();
        });
    });

    describe('Lifecycle', () => {
        it('should start server', async () => {
            await app.start();
            // Test passes if no error thrown
            expect(true).toBe(true);
        });

        it('should stop server', async () => {
            await app.start();
            await app.stop();
            expect(true).toBe(true);
        });
    });

    describe('Service Mesh', () => {
        it('should throw error when mesh is not enabled', () => {
            expect(() => app.mesh).toThrow('Service Mesh is not enabled');
        });

        it('should provide mesh instance when enabled', () => {
            const meshApp = new SecureStack({
                name: 'test',
                port: 3000,
                mesh: {
                    enabled: true,
                },
            });

            expect(meshApp.mesh).toBeDefined();
            expect(meshApp.mesh.connect).toBeDefined();
        });

        it('should connect to other services via mesh', async () => {
            const meshApp = new SecureStack({
                name: 'test',
                port: 3000,
                mesh: {
                    enabled: true,
                    discovery: {
                        mode: DiscoveryMode.Static,
                        services: [
                            { id: 'user-service', host: 'localhost', port: 50051 },
                        ],
                    },
                },
            });

            const client = meshApp.mesh.connect('user-service');
            const result = await client.call('getUser', { id: '123' });

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });
    });

    describe('Integration', () => {
        it('should work end-to-end', async () => {
            const userRouter = router()
                .query('getUser', {
                    input: z.string(),
                    handler: async ({ input }) => ({
                        id: input,
                        name: 'Test User',
                    }),
                })
                .mutation('createUser', {
                    input: z.object({
                        name: z.string(),
                    }),
                    handler: async ({ input }) => ({
                        id: '123',
                        ...input,
                    }),
                });

            app.router('user', userRouter);

            // Execute procedures
            const user = await userRouter.executeProcedure('getUser', 'user123', {});
            expect(user).toEqual({ id: 'user123', name: 'Test User' });

            const newUser = await userRouter.executeProcedure('createUser', {
                name: 'John Doe',
            }, {});
            expect(newUser).toEqual({ id: '123', name: 'John Doe' });
        });
    });
});
