/**
 * End-to-End Benchmarks
 * Tests full request cycle including HTTP server
 */

import { Bench } from 'tinybench';
import { SecureStackServer } from '@lemur-bookstores/server';
import { router } from '@lemur-bookstores/core';
import { z } from 'zod';

const bench = new Bench({ time: 1000 });

// ============================================================================
// Setup test router and server
// ============================================================================

const testRouter = router()
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
            name: z.string().min(3).max(50),
            email: z.string().email()
        }),
        output: z.object({ id: z.string(), success: z.boolean() }),
        handler: async ({ input }: any) => ({
            id: `user_${Date.now()}`,
            success: true
        })
    })
    .query('large-response', {
        handler: async () => ({
            users: Array(100).fill(null).map((_, i) => ({
                id: `user-${i}`,
                name: `User ${i}`,
                email: `user${i}@example.com`,
                posts: Array(10).fill(null).map((_, j) => ({
                    id: `post-${j}`,
                    title: `Post ${j}`,
                    content: 'Lorem ipsum dolor sit amet'
                }))
            }))
        })
    });

// Create server instance
const server = new SecureStackServer({
    name: 'e2e-benchmark',
    port: 3334 // Fixed port for benchmarking
});

server.router('api', testRouter);

// Start server before benchmarks
let serverStarted = false;

/**
 * Wait for server to be ready by checking health endpoint
 */
async function waitForServer(maxAttempts = 20, delayMs = 1000): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            // Health endpoint is at root level, not under /api prefix
            const response = await fetch('http://localhost:3334/health');
            if (response.ok) {
                return true;
            }
        } catch (error) {
            // Server not ready yet, wait and retry
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    return false;
}

async function startServer() {
    if (!serverStarted) {
        try {
            // Start the server
            await server.start();

            // Wait for server to be actually ready
            const isReady = await waitForServer();

            if (!isReady) {
                throw new Error('Server started but health check failed after 5 seconds');
            }

            serverStarted = true;
            console.log('✓ Test server started and ready on port 3334\n');
        } catch (error) {
            console.error('Failed to start server:', error);
            throw error;
        }
    }
}

// Helper function for HTTP requests
async function makeRequest(path: string, options: RequestInit = {}) {
    try {
        const response = await fetch(`http://localhost:3334${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
            throw new Error('Server not responding. Make sure the server is started before running benchmarks.');
        }
        throw error;
    }
}

// ============================================================================
// Benchmarks
// ============================================================================

// Note: We'll add benchmarks after server starts
async function setupBenchmarks() {
    await startServer();

    bench
        .add('[E2E] Simple query (HTTP)', async () => {
            await makeRequest('/api/simple', {
                method: 'POST',
                body: JSON.stringify({})
            });
        })
        .add('[E2E] Validated query (HTTP)', async () => {
            await makeRequest('/api/validated', {
                method: 'POST',
                body: JSON.stringify({ id: '123' })
            });
        })
        .add('[E2E] Mutation (HTTP)', async () => {
            await makeRequest('/api/create', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'John Doe',
                    email: 'john@example.com'
                })
            });
        })
        .add('[E2E] Large response (HTTP)', async () => {
            await makeRequest('/api/large-response', {
                method: 'POST',
                body: JSON.stringify({})
            });
        })
        .add('[Direct] Simple query (no HTTP)', async () => {
            await testRouter.executeProcedure('simple', {}, {});
        })
        .add('[Direct] Validated query (no HTTP)', async () => {
            await testRouter.executeProcedure('validated', { id: '123' }, {});
        })
        .add('[Direct] Mutation (no HTTP)', async () => {
            await testRouter.executeProcedure('create', {
                name: 'John Doe',
                email: 'john@example.com'
            }, {});
        })
        .add('[Direct] Large response (no HTTP)', async () => {
            await testRouter.executeProcedure('large-response', {}, {});
        });
}

// ============================================================================
// Run benchmarks
// ============================================================================

await setupBenchmarks();

console.log('🔥 Running End-to-End Benchmarks...\n');

await bench.run();

console.table(bench.table());

// Summary
console.log('\n📊 Detailed Results:');
const results = bench.tasks.map(task => ({
    name: task.name,
    'ops/sec': Math.round(task.result?.hz || 0).toLocaleString(),
    'avg (ms)': (task.result?.mean ? task.result.mean * 1000 : 0).toFixed(4),
    'p99.5 (ms)': (task.result?.p995 ? task.result.p995 * 1000 : 0).toFixed(4),
    'min (ms)': (task.result?.min ? task.result.min * 1000 : 0).toFixed(4),
    'max (ms)': (task.result?.max ? task.result.max * 1000 : 0).toFixed(4),
}));

console.table(results);

// Calculate HTTP overhead
console.log('\n📡 HTTP Overhead Analysis:');

const getAvgMs = (name: string) => {
    const task = bench.tasks.find(t => t.name === name);
    return task?.result?.mean ? task.result.mean * 1000 : 0;
};

const overheads = [
    { test: 'Simple query', e2e: '[E2E] Simple query (HTTP)', direct: '[Direct] Simple query (no HTTP)' },
    { test: 'Validated query', e2e: '[E2E] Validated query (HTTP)', direct: '[Direct] Validated query (no HTTP)' },
    { test: 'Mutation', e2e: '[E2E] Mutation (HTTP)', direct: '[Direct] Mutation (no HTTP)' },
    { test: 'Large response', e2e: '[E2E] Large response (HTTP)', direct: '[Direct] Large response (no HTTP)' }
];

overheads.forEach(({ test, e2e, direct }) => {
    const e2eTime = getAvgMs(e2e);
    const directTime = getAvgMs(direct);
    const overhead = e2eTime - directTime;
    const overheadPct = ((overhead / directTime) * 100).toFixed(1);

    console.log(`  ${test}:`);
    console.log(`    E2E (HTTP):     ${e2eTime.toFixed(4)}ms`);
    console.log(`    Direct:         ${directTime.toFixed(4)}ms`);
    console.log(`    HTTP Overhead:  ${overhead.toFixed(4)}ms (${overheadPct}% slower)`);
    console.log('');
});

// Performance targets
console.log('🎯 Performance Targets:');
console.log('  E2E simple query:     < 5ms avg');
console.log('  E2E validated query:  < 10ms avg');
console.log('  E2E mutation:         < 15ms avg');
console.log('  HTTP overhead:        < 3ms avg');

// Cleanup - ensure server is stopped even if there were errors
try {
    if (serverStarted) {
        await server.stop();
        console.log('\n✓ Test server stopped');
    }
} catch (error) {
    console.warn('\n⚠️ Error stopping server:', error);
}
