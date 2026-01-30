/**
 * Comparison Benchmarks: SecureStack vs tRPC
 * Tests similar operations to compare performance
 */

import { Bench } from 'tinybench';
import { router as secureStackRouter } from '@lemur-bookstores/secure-stack-core';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const bench = new Bench({ time: 1000 });

// Test data
const simpleInput = { id: '123' };
const complexInput = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    metadata: { role: 'admin' as const, permissions: ['read', 'write'] }
};

// ============================================================================
// SecureStack Setup
// ============================================================================

const secureStack = secureStackRouter()
    .query('simple', {
        handler: async () => ({ message: 'ok' })
    })
    .query('validated', {
        input: z.object({ id: z.string() }),
        output: z.object({ id: z.string(), name: z.string() }),
        handler: async ({ input }: any) => ({
            id: input.id,
            name: 'John Doe'
        })
    })
    .mutation('create', {
        input: z.object({
            id: z.string(),
            name: z.string().min(3).max(50),
            email: z.string().email(),
            metadata: z.object({
                role: z.enum(['user', 'admin', 'moderator']),
                permissions: z.array(z.string())
            })
        }),
        output: z.object({ id: z.string(), success: z.boolean() }),
        handler: async ({ input }: any) => ({
            id: input.id,
            success: true
        })
    });

// ============================================================================
// tRPC Setup
// ============================================================================

const t = initTRPC.create();

const trpcRouter = t.router({
    simple: t.procedure
        .query(() => ({ message: 'ok' })),

    validated: t.procedure
        .input(z.object({ id: z.string() }))
        .output(z.object({ id: z.string(), name: z.string() }))
        .query(({ input }: any) => ({
            id: input.id,
            name: 'John Doe'
        })),

    create: t.procedure
        .input(z.object({
            id: z.string(),
            name: z.string().min(3).max(50),
            email: z.string().email(),
            metadata: z.object({
                role: z.enum(['user', 'admin', 'moderator']),
                permissions: z.array(z.string())
            })
        }))
        .output(z.object({ id: z.string(), success: z.boolean() }))
        .mutation(({ input }: any) => ({
            id: input.id,
            success: true
        }))
});

const trpcCaller = trpcRouter.createCaller({});

// ============================================================================
// Benchmarks
// ============================================================================

bench
    // Router creation
    .add('[SecureStack] Router creation', () => {
        secureStackRouter();
    })
    .add('[tRPC] Router creation', () => {
        initTRPC.create();
    })

    // Simple query (no validation)
    .add('[SecureStack] Simple query', async () => {
        await secureStack.executeProcedure('simple', {}, {});
    })
    .add('[tRPC] Simple query', async () => {
        await trpcCaller.simple();
    })

    // Validated query
    .add('[SecureStack] Validated query', async () => {
        await secureStack.executeProcedure('validated', simpleInput, {});
    })
    .add('[tRPC] Validated query', async () => {
        await trpcCaller.validated(simpleInput);
    })

    // Complex mutation
    .add('[SecureStack] Complex mutation', async () => {
        await secureStack.executeProcedure('create', complexInput, {});
    })
    .add('[tRPC] Complex mutation', async () => {
        await trpcCaller.create(complexInput);
    });

// Run benchmarks
console.log('🔥 Running Comparison Benchmarks: SecureStack vs tRPC\n');

await bench.run();

console.table(bench.table());

// Summary with comparison
console.log('\n📊 Detailed Results:');
const results = bench.tasks.map(task => ({
    name: task.name,
    'ops/sec': Math.round(task.result?.hz || 0).toLocaleString(),
    'avg (ms)': (task.result?.mean ? task.result.mean * 1000 : 0).toFixed(4),
    'p99.5 (ms)': (task.result?.p995 ? task.result.p995 * 1000 : 0).toFixed(4),
}));

console.table(results);

// Calculate speedup
console.log('\n⚡ Performance Comparison:');

const getOps = (name: string) => {
    const task = bench.tasks.find(t => t.name === name);
    return task?.result?.hz || 0;
};

const comparisons = [
    { test: 'Router creation', secureStack: '[SecureStack] Router creation', trpc: '[tRPC] Router creation' },
    { test: 'Simple query', secureStack: '[SecureStack] Simple query', trpc: '[tRPC] Simple query' },
    { test: 'Validated query', secureStack: '[SecureStack] Validated query', trpc: '[tRPC] Validated query' },
    { test: 'Complex mutation', secureStack: '[SecureStack] Complex mutation', trpc: '[tRPC] Complex mutation' }
];

comparisons.forEach(({ test, secureStack, trpc }) => {
    const ssOps = getOps(secureStack);
    const trpcOps = getOps(trpc);
    const ratio = ssOps / trpcOps;
    const faster = ratio > 1 ? 'SecureStack' : 'tRPC';
    const percentage = Math.abs((ratio - 1) * 100).toFixed(1);

    console.log(`  ${test}:`);
    console.log(`    SecureStack: ${Math.round(ssOps).toLocaleString()} ops/sec`);
    console.log(`    tRPC:        ${Math.round(trpcOps).toLocaleString()} ops/sec`);
    console.log(`    Winner:      ${faster} (${percentage}% ${ratio > 1 ? 'faster' : 'slower'})`);
    console.log('');
});
