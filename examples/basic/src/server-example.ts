/**
 * Basic Server Example
 * Demonstrates HTTP endpoints with SecureStackServer
 */

import { SecureStackServer } from '@lemur-bookstores/server';
import { router } from '@lemur-bookstores/core';
import { z } from 'zod';

// Create server instance
const server = new SecureStackServer({
    name: 'example-server',
    port: 3000,
    host: 'localhost',
    apiPrefix: '/api',
    cors: {
        origin: '*',
        credentials: false,
    },
});

// Define a user router
const userRouter = router()
    .query('getUser', {
        input: z.string(),
        handler: async ({ input }) => {
            return {
                id: input,
                name: 'John Doe',
                email: 'john@example.com',
            };
        },
    })
    .query('listUsers', {
        handler: async () => {
            return [
                { id: '1', name: 'John Doe', email: 'john@example.com' },
                { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
            ];
        },
    })
    .mutation('createUser', {
        input: z.object({
            name: z.string(),
            email: z.string().email(),
        }),
        handler: async ({ input }: any) => {
            return {
                id: Math.random().toString(36).slice(2),
                ...input,
                createdAt: new Date().toISOString(),
            };
        },
    });

// Define a post router
const postRouter = router()
    .query('getPost', {
        input: z.string(),
        handler: async ({ input }) => {
            return {
                id: input,
                title: 'Example Post',
                content: 'This is an example post content',
                authorId: '1',
            };
        },
    })
    .mutation('createPost', {
        input: z.object({
            title: z.string().min(3),
            content: z.string().min(10),
        }),
        handler: async ({ input, ctx }: any) => {
            // Access context (user from auth, req, res, etc.)
            return {
                id: Math.random().toString(36).slice(2),
                ...input,
                authorId: ctx.user?.id || 'anonymous',
                createdAt: new Date().toISOString(),
            };
        },
    });

// Register routers
server
    .router('user', userRouter)
    .router('post', postRouter);

// Register lifecycle hooks
server
    .hook('onStart', () => {
        console.log('⏳ Server is starting...');
    })
    .hook('onReady', () => {
        console.log('✅ Server is ready!');
        console.log('\n📝 Available endpoints:');
        console.log('  GET  http://localhost:3000/health');
        console.log('  GET  http://localhost:3000/ready');
        console.log('  GET  http://localhost:3000/metrics');
        console.log('  GET  http://localhost:3000/api/user/getUser');
        console.log('  GET  http://localhost:3000/api/user/listUsers');
        console.log('  POST http://localhost:3000/api/user/createUser');
        console.log('  GET  http://localhost:3000/api/post/getPost');
        console.log('  POST http://localhost:3000/api/post/createPost');
        console.log('\n💡 Try: curl http://localhost:3000/api/user/listUsers');
    })
    .hook('onShutdown', () => {
        console.log('👋 Server is shutting down...');
    });

// Handle shutdown signals
process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
});

// Start the server
server.start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
