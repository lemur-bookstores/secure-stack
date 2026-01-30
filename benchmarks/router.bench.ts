/**
 * Router Benchmarks
 * Tests router creation, procedure registration, and execution performance
 */

import { Bench } from 'tinybench';
import { router } from '@lemur-bookstores/secure-stack-core';
import { z } from 'zod';

const bench = new Bench({ time: 1000 });

// Setup test data
const simpleInput = { id: '123' };
const complexInput = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    metadata: { role: 'admin', permissions: ['read', 'write'] }
};

// Simple router without validation
const simpleRouter = router()
    .query('getUser', {
        handler: async ({ input }: any) => {
            return { id: input.id, name: 'John Doe' };
        }
    });

// Router with Zod validation
const validatedRouter = router()
    .query('getUser', {
        input: z.object({ id: z.string() }),
        output: z.object({ id: z.string(), name: z.string() }),
        handler: async ({ input }) => {
            return { id: input.id, name: 'John Doe' };
        }
    });

// Router with complex validation
const complexRouter = router()
    .mutation('createUser', {
        input: z.object({
            id: z.string(),
            name: z.string().min(3).max(50),
            email: z.string().email(),
            metadata: z.object({
                role: z.enum(['user', 'admin', 'moderator']),
                permissions: z.array(z.string())
            })
        }),
        output: z.object({
            id: z.string(),
            success: z.boolean()
        }),
        handler: async ({ input }) => {
            return { id: input.id, success: true };
        }
    });

// Benchmarks
bench
    .add('Router creation (empty)', () => {
        router();
    })
    .add('Router with 1 query', () => {
        router().query('test', { handler: async () => ({ ok: true }) });
    })
    .add('Router with 10 queries', () => {
        const r = router();
        for (let i = 0; i < 10; i++) {
            r.query(`query${i}`, { handler: async () => ({ ok: true }) });
        }
    })
    .add('Execute simple query (no validation)', async () => {
        await simpleRouter.executeProcedure('getUser', simpleInput, {});
    })
    .add('Execute validated query', async () => {
        await validatedRouter.executeProcedure('getUser', simpleInput, {});
    })
    .add('Execute complex mutation (with validation)', async () => {
        await complexRouter.executeProcedure('createUser', complexInput, {});
    });

// Run benchmarks
console.log('🔥 Running Router Benchmarks...\n');

await bench.run();

console.table(bench.table());

// Summary
console.log('\n📊 Summary:');
const results = bench.tasks.map(task => ({
    name: task.name,
    'ops/sec': Math.round(task.result?.hz || 0).toLocaleString(),
    'avg (ms)': (task.result?.mean ? task.result.mean * 1000 : 0).toFixed(4),
    'p99.5 (ms)': (task.result?.p995 ? task.result.p995 * 1000 : 0).toFixed(4),
}));

console.table(results);
