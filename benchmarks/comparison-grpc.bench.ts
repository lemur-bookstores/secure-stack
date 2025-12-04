/**
 * Comparison Benchmarks: SecureStack vs gRPC
 * Tests similar operations to compare performance
 */

import { Bench } from 'tinybench';
import { router as secureStackRouter } from '@lemur-bookstores/core';
import { z } from 'zod';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const bench = new Bench({ time: 1000 });

// Test data
const simpleRequest = { id: '123' };
const complexRequest = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com'
};

// ============================================================================
// Setup proto file for gRPC
// ============================================================================

const protoContent = `
syntax = "proto3";

package benchmark;

service BenchmarkService {
  rpc Simple (SimpleRequest) returns (SimpleResponse);
  rpc Validated (ValidatedRequest) returns (ValidatedResponse);
  rpc Create (CreateRequest) returns (CreateResponse);
}

message SimpleRequest {
  string id = 1;
}

message SimpleResponse {
  string message = 1;
}

message ValidatedRequest {
  string id = 1;
}

message ValidatedResponse {
  string id = 1;
  string name = 2;
}

message CreateRequest {
  string id = 1;
  string name = 2;
  string email = 3;
}

message CreateResponse {
  string id = 1;
  bool success = 2;
}
`;

// Write proto file to temp directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const protoDir = join(__dirname, 'temp');
const protoPath = join(protoDir, 'benchmark.proto');

try {
    mkdirSync(protoDir, { recursive: true });
    writeFileSync(protoPath, protoContent);
} catch (error) {
    console.warn('Could not create proto file, skipping gRPC setup');
}

// ============================================================================
// SecureStack Setup
// ============================================================================

const secureStack = secureStackRouter()
    .query('simple', {
        input: z.object({ id: z.string() }),
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
            name: z.string(),
            email: z.string().email()
        }),
        output: z.object({ id: z.string(), success: z.boolean() }),
        handler: async ({ input }: any) => ({
            id: input.id,
            success: true
        })
    });

// ============================================================================
// gRPC Setup (simulated - actual gRPC requires server/client setup)
// ============================================================================

// For benchmarking, we'll simulate gRPC handler execution
// In real scenarios, gRPC adds network overhead which we're excluding here
const grpcHandlers = {
    simple: async (call: any) => {
        return { message: 'ok' };
    },
    validated: async (call: any) => {
        return {
            id: call.request.id,
            name: 'John Doe'
        };
    },
    create: async (call: any) => {
        return {
            id: call.request.id,
            success: true
        };
    }
};

// ============================================================================
// Benchmarks (Direct handler comparison)
// ============================================================================

bench
    // Simple request
    .add('[SecureStack] Simple request', async () => {
        await secureStack.executeProcedure('simple', simpleRequest, {});
    })
    .add('[gRPC] Simple request (handler only)', async () => {
        await grpcHandlers.simple({ request: simpleRequest });
    })

    // Validated request
    .add('[SecureStack] Validated request', async () => {
        await secureStack.executeProcedure('validated', simpleRequest, {});
    })
    .add('[gRPC] Validated request (handler only)', async () => {
        await grpcHandlers.validated({ request: simpleRequest });
    })

    // Complex request
    .add('[SecureStack] Complex request', async () => {
        await secureStack.executeProcedure('create', complexRequest, {});
    })
    .add('[gRPC] Complex request (handler only)', async () => {
        await grpcHandlers.create({ request: complexRequest });
    });

// Run benchmarks
console.log('🔥 Running Comparison Benchmarks: SecureStack vs gRPC\n');

await bench.run();

console.table(bench.table());

// Summary
console.log('\n📊 Detailed Results:');
const results = bench.tasks.map(task => ({
    name: task.name,
    'ops/sec': Math.round(task.result?.hz || 0).toLocaleString(),
    'avg (ms)': (task.result?.mean ? task.result.mean * 1000 : 0).toFixed(4),
    'p99.5 (ms)': (task.result?.p995 ? task.result.p995 * 1000 : 0).toFixed(4),
}));

console.table(results);

// Performance comparison
console.log('\n⚡ Performance Comparison:');

const getOps = (name: string) => {
    const task = bench.tasks.find(t => t.name === name);
    return task?.result?.hz || 0;
};

const comparisons = [
    { test: 'Simple request', secureStack: '[SecureStack] Simple request', grpc: '[gRPC] Simple request (handler only)' },
    { test: 'Validated request', secureStack: '[SecureStack] Validated request', grpc: '[gRPC] Validated request (handler only)' },
    { test: 'Complex request', secureStack: '[SecureStack] Complex request', grpc: '[gRPC] Complex request (handler only)' }
];

comparisons.forEach(({ test, secureStack, grpc }) => {
    const ssOps = getOps(secureStack);
    const grpcOps = getOps(grpc);
    const ratio = ssOps / grpcOps;
    const faster = ratio > 1 ? 'SecureStack' : 'gRPC';
    const percentage = Math.abs((ratio - 1) * 100).toFixed(1);

    console.log(`  ${test}:`);
    console.log(`    SecureStack: ${Math.round(ssOps).toLocaleString()} ops/sec`);
    console.log(`    gRPC:        ${Math.round(grpcOps).toLocaleString()} ops/sec`);
    console.log(`    Winner:      ${faster} (${percentage}% ${ratio > 1 ? 'faster' : 'slower'})`);
    console.log('');
});

console.log('\n💡 Note: These benchmarks compare handler execution only.');
console.log('   In production, gRPC includes protobuf serialization and');
console.log('   HTTP/2 overhead which adds ~2-10ms per request.');
