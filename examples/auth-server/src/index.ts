import { router } from '@lemur-bookstores/core';
import { SecureStackServer } from '@lemur-bookstores/server';
import { createAuthMiddleware, createRoleMiddleware } from '@lemur-bookstores/server';
import { z } from 'zod';

// Initialize the server with authentication and RBAC
const server = new SecureStackServer({
    name: 'auth-server-example',
    port: 3000,
    auth: {
        jwtSecret: 'your-secret-key-change-in-production',
        jwtExpiresIn: '1h',
        accessTokenSecret: 'access-secret-change-in-production',
        accessTokenExpiresIn: '15m',
        refreshTokenSecret: 'refresh-secret-change-in-production',
        refreshTokenExpiresIn: '7d',
        rbac: {
            roles: [
                {
                    name: 'user',
                    permissions: ['read:profile', 'update:profile'],
                },
                {
                    name: 'editor',
                    permissions: ['create:post', 'update:post', 'read:post'],
                    inherits: ['user'],
                },
                {
                    name: 'admin',
                    permissions: ['delete:post', 'manage:users'],
                    inherits: ['editor'],
                },
            ],
        },
    },
});

// Public router - no authentication required
const publicRouter = router();

publicRouter
    .query('health', {
        input: z.object({}),
        output: z.object({
            status: z.string(),
            timestamp: z.string(),
        }),
        handler: async () => {
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
            };
        },
    })
    .mutation('register', {
        input: z.object({
            email: z.string().email(),
            password: z.string().min(8),
            name: z.string(),
        }),
        output: z.object({
            message: z.string(),
            userId: z.string(),
        }),
        handler: async ({ input }: any) => {
            // In a real app, save to database
            if (!server.auth) {
                throw new Error('Auth not initialized');
            }

            // Simulate user creation
            const userId = `user_${Date.now()}`;

            return {
                message: 'User registered successfully',
                userId,
            };
        },
    })
    .mutation('login', {
        input: z.object({
            email: z.string().email(),
            password: z.string(),
        }),
        output: z.object({
            accessToken: z.string(),
            refreshToken: z.string(),
        }),
        handler: async ({ input }: any) => {
            if (!server.auth?.session) {
                throw new Error('Session manager not initialized');
            }

            // In a real app, verify password against database
            // For demo purposes, we'll just create tokens
            const tokens = server.auth.session.createSession({
                userId: 'user_123',
                email: input.email,
                role: 'user', // This would come from the database
            });

            return tokens;
        },
    });

// Protected router - requires authentication
const protectedRouter = router();

if (server.auth) {
    protectedRouter.use(createAuthMiddleware(server.auth));
}

protectedRouter
    .query('profile', {
        input: z.object({}),
        output: z.object({
            userId: z.string(),
            email: z.string().optional(),
            role: z.string().optional(),
        }),
        handler: async ({ ctx }) => {
            return {
                userId: ctx.user?.userId || 'unknown',
                email: ctx.user?.email,
                role: ctx.user?.role,
            };
        },
    })
    .mutation('updateProfile', {
        input: z.object({
            name: z.string().optional(),
            bio: z.string().optional(),
        }),
        output: z.object({
            message: z.string(),
        }),
        handler: async ({ input, ctx }: any) => {
            // In a real app, update database
            console.log(`User ${ctx.user?.userId} updating profile:`, input);

            return {
                message: 'Profile updated successfully',
            };
        },
    });

// Admin router - requires admin permissions
const adminRouter = router();

if (server.auth) {
    adminRouter.use(createAuthMiddleware(server.auth));
    adminRouter.use(createRoleMiddleware(server.auth, ['manage:users']));
}

adminRouter
    .query('listUsers', {
        input: z.object({
            page: z.number().optional().default(1),
            limit: z.number().optional().default(10),
        }),
        output: z.object({
            users: z.array(z.object({
                id: z.string(),
                email: z.string(),
                role: z.string(),
            })),
            total: z.number(),
        }),
        handler: async ({ input }) => {
            // In a real app, fetch from database
            return {
                users: [
                    { id: 'user_1', email: 'user1@example.com', role: 'user' },
                    { id: 'user_2', email: 'admin@example.com', role: 'admin' },
                ],
                total: 2,
            };
        },
    })
    .mutation('deleteUser', {
        input: z.object({
            userId: z.string(),
        }),
        output: z.object({
            message: z.string(),
        }),
        handler: async ({ input }: any) => {
            // In a real app, delete from database
            console.log(`Deleting user: ${input.userId}`);

            return {
                message: 'User deleted successfully',
            };
        },
    });

// Register routers
server.router('public', publicRouter);
server.router('protected', protectedRouter);
server.router('admin', adminRouter);

// Start the server
server.start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
});
