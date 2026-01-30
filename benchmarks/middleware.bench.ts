/**
 * Middleware Benchmarks
 * Tests middleware composition and execution performance
 */

import { Bench } from 'tinybench';
import { compose } from '@lemur-bookstores/secure-stack-core';
import type { MiddlewareFunction } from '@lemur-bookstores/secure-stack-core';

const bench = new Bench({ time: 1000 });

// Test context
interface TestContext {
    value: number;
    logs: string[];
}

// Simple middleware that modifies context
const simpleMiddleware: MiddlewareFunction<TestContext> = async (ctx, next) => {
    ctx.value += 1;
    await next();
};

// Middleware with logging
const loggingMiddleware: MiddlewareFunction<TestContext> = async (ctx, next) => {
    ctx.logs.push('before');
    await next();
    ctx.logs.push('after');
};

// Async middleware with delay
const asyncMiddleware: MiddlewareFunction<TestContext> = async (ctx, next) => {
    await Promise.resolve();
    ctx.value += 1;
    await next();
};

// Error handling middleware
const errorMiddleware: MiddlewareFunction<TestContext> = async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        ctx.logs.push('error caught');
    }
};

// Create composed middleware stacks
const single = compose([simpleMiddleware]);
const triple = compose([simpleMiddleware, loggingMiddleware, simpleMiddleware]);
const many = compose(Array(10).fill(simpleMiddleware));
const mixed = compose([simpleMiddleware, loggingMiddleware, asyncMiddleware, errorMiddleware]);

// Benchmarks
bench
    .add('Compose 1 middleware', () => {
        compose([simpleMiddleware]);
    })
    .add('Compose 3 middlewares', () => {
        compose([simpleMiddleware, loggingMiddleware, simpleMiddleware]);
    })
    .add('Compose 10 middlewares', () => {
        compose(Array(10).fill(simpleMiddleware));
    })
    .add('Execute 1 middleware', async () => {
        const ctx: TestContext = { value: 0, logs: [] };
        await single(ctx, async () => { });
    })
    .add('Execute 3 middlewares', async () => {
        const ctx: TestContext = { value: 0, logs: [] };
        await triple(ctx, async () => { });
    })
    .add('Execute 10 middlewares', async () => {
        const ctx: TestContext = { value: 0, logs: [] };
        await many(ctx, async () => { });
    })
    .add('Execute mixed middlewares (4)', async () => {
        const ctx: TestContext = { value: 0, logs: [] };
        await mixed(ctx, async () => { });
    });

// Run benchmarks
console.log('🔥 Running Middleware Benchmarks...\n');

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
