/**
 * Advanced example with middleware and context
 */

import {
    SecureStack,
    router,
    ServiceType,
    logger,
    errorHandler,
    // createContext,
    SecureStackError
} from '@lemur-bookstores/secure-stack-core';
import { z } from 'zod';

// Create a custom context
// const contextBuilder = createContext<{
//     user?: { id: string; name: string };
//     requestId: string;
// }>();

// Create the application
const app = new SecureStack({
    name: 'advanced-example',
    port: 3000,
    type: ServiceType.Microservice,
});

// Use built-in middlewares
app.use(errorHandler());
app.use(logger());

// Custom middleware
app.use(async (ctx: any, next) => {
    ctx.requestId = Math.random().toString(36).substring(7);
    console.log(`[Middleware] Request ID: ${ctx.requestId}`);
    await next();
});

// Define a user router with validation
const userRouter = router()
    .query('getById', {
        input: z.string().uuid(),
        handler: async ({ input }: { input: any }) => {
            console.log(`Getting user with ID: ${input}`);

            // Simulate database lookup
            if (input === '00000000-0000-0000-0000-000000000000') {
                throw SecureStackError.notFound('User not found');
            }

            return {
                id: input,
                name: 'John Doe',
                email: 'john@example.com',
                createdAt: new Date().toISOString(),
            };
        },
    })
    .query('list', {
        handler: async () => {
            console.log('Listing all users');
            return [
                { id: '1', name: 'John Doe', email: 'john@example.com' },
                { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
                { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
            ];
        },
    })
    .mutation('create', {
        input: z.object({
            name: z.string().min(2).max(50),
            email: z.string().email(),
            password: z.string().min(8),
        }),
        handler: async ({ input }: { input: any }) => {
            console.log('Creating user:', input);

            // Validate email uniqueness (simulated)
            if (input.email === 'taken@example.com') {
                throw SecureStackError.conflict('Email already exists');
            }

            return {
                id: Math.random().toString(36).substring(7),
                name: input.name,
                email: input.email,
                createdAt: new Date().toISOString(),
            };
        },
    })
    .mutation('delete', {
        input: z.string().uuid(),
        handler: async ({ input }: { input: any }) => {
            console.log('Deleting user:', input);

            // Simulate authorization check
            if (input === 'admin-id') {
                throw SecureStackError.forbidden('Cannot delete admin user');
            }

            return {
                success: true,
                message: 'User deleted successfully',
            };
        },
    });

// Register the router
app.router('user', userRouter);

// Start the server
app.start().then(() => {
    console.log('\n✨ Advanced example server is running!');
    console.log('📝 Features demonstrated:');
    console.log('  - Error handling middleware');
    console.log('  - Logger middleware');
    console.log('  - Custom middleware');
    console.log('  - Input validation with Zod');
    console.log('  - Custom error handling');
    console.log('  - Type-safe procedures');
    console.log('\n🔥 Try calling the procedures to see errors in action!');
});
