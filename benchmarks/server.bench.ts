/**
 * Server Benchmarks
 * Tests HTTP server request handling performance
 */

import { Bench } from 'tinybench';
import { SecureStackServer } from '@lemur-bookstores/server';
import { router } from '@lemur-bookstores/core';
import { z } from 'zod';

const bench = new Bench({ time: 1000 });

// Setup test server
const testRouter = router()
    .query('simple', {
        handler: async () => ({ message: 'ok' })
    })
    .query('validated', {
        input: z.object({ id: z.string() }),
        output: z.object({ id: z.string(), name: z.string() }),
        handler: async ({ input }: any) => ({
            id: input.id,
            name: 'Test User'
        })
    })
    .mutation('create', {
        input: z.object({
            name: z.string(),
            email: z.string().email()
        }),
        output: z.object({ id: z.string(), success: z.boolean() }),
        handler: async ({ input }: any) => ({
            id: `user_${Date.now()}`,
            success: true
        })
    });

const server = new SecureStackServer({
    name: 'benchmark-server',
    port: 0 // Random port
});

server.router('test', testRouter);

// Simple fetch helper
async function fetchEndpoint(path: string, options: RequestInit = {}) {
    const port = 3333; // We'll use a fixed port for benchmarking
    const response = await fetch(`http://localhost:${port}${path}`, options);
    return response.json();
}

// Benchmarks - using router execution directly (faster)
bench
    .add('Router execute (no validation)', async () => {
        await testRouter.executeProcedure('simple', {}, {});
    })
    .add('Router execute (with validation)', async () => {
        await testRouter.executeProcedure('validated', { id: '123' }, {});
    })
    .add('Router execute mutation', async () => {
        await testRouter.executeProcedure('create', {
            name: 'John',
            email: 'john@example.com'
        }, {});
    });

// Run benchmarks
console.log('🔥 Running Server Benchmarks...\n');

await bench.run();

console.table(bench.table());

// Summary
console.log('\n📊 Summary:');
const results = bench.tasks.map(task => ({
    name: task.name,
    'ops/sec': Math.round(task.result?.hz || 0).toLocaleString(),
    'avg (ms)': (task.result?.mean ? task.result.mean * 1000 : 0).toFixed(4),
    'p99.5 (ms)': (task.result?.p995 ? task.result.p995 * 1000 : 0).toFixed(4),
    'min (ms)': (task.result?.min ? task.result.min * 1000 : 0).toFixed(4),
    'max (ms)': (task.result?.max ? task.result.max * 1000 : 0).toFixed(4),
}));

console.table(results);

console.log('\n💡 Note: These benchmarks measure router execution directly.');
console.log('   HTTP overhead not included. For real-world performance,');
console.log('   expect ~2-5ms additional latency per request.');
