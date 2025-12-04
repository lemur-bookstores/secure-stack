/**
 * Client Benchmarks
 * Tests React hooks and cache performance
 */

import { Bench } from 'tinybench';
import { Window } from 'happy-dom';
import { renderHook } from '@testing-library/react';
import { QueryClient, onlineManager, focusManager } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { SecureStackClient } from '@lemur-bookstores/client';
import { useQuery, useMutation, SecureStackProvider } from '@lemur-bookstores/client/react';

// Force online and focus
onlineManager.setOnline(true);
focusManager.setFocused(true);

// Setup DOM environment
const window = new Window({ url: 'http://localhost:3000' });

// Safely set globals
const globals = {
    window,
    document: window.document,
    navigator: window.navigator,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    Text: window.Text,
    MutationObserver: window.MutationObserver,
    Request: window.Request,
    Response: window.Response,
    fetch: window.fetch
};

for (const [key, value] of Object.entries(globals)) {
    try {
        // @ts-ignore
        global[key] = value;
    } catch (e) {
        // Ignore read-only properties
    }
}

const bench = new Bench({ time: 1000 });

// ============================================================================
// Setup mock client
// ============================================================================

const mockClient = {
    query: async (path: string, input: any) => {
        if (path === 'getUser') {
            return { id: input.id, name: 'John Doe' };
        }
        return { ok: true };
    },
    mutate: async (path: string, input: any) => {
        return { id: `user_${Date.now()}`, success: true };
    },
    subscribe: (path: string, input: any, onData: (data: any) => void) => {
        const interval = setInterval(() => {
            onData({ timestamp: Date.now() });
        }, 1000);
        return () => clearInterval(interval);
    }
} as unknown as SecureStackClient;

// ============================================================================
// Test wrapper
// ============================================================================

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            }
        }
    });

    return ({ children }: { children: ReactNode }) =>
        createElement(SecureStackProvider, { client: mockClient, queryClient, children });
}

// ============================================================================
// Benchmarks
// ============================================================================

bench
    // Hook rendering
    .add('Render useQuery hook', () => {
        const wrapper = createWrapper();
        renderHook(
            () => useQuery('getUser', { id: '123' }),
            { wrapper }
        );
    })
    .add('Render useMutation hook', () => {
        const wrapper = createWrapper();
        renderHook(
            () => useMutation('createUser'),
            { wrapper }
        );
    })

    // Direct client calls (bypassing React hooks)
    .add('Direct client query', async () => {
        await mockClient.query('getUser', { id: '123' });
    })

    .add('Direct client mutation', async () => {
        await mockClient.mutate('createUser', { name: 'John', email: 'john@example.com' });
    });

// Run benchmarks
console.log('🔥 Running Client Benchmarks...\n');

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

// Performance targets
console.log('\n🎯 Performance Targets:');
console.log('  Render hooks:     > 10K ops/sec (< 0.1ms avg)');
console.log('  Direct calls:     > 100K ops/sec (< 0.01ms avg)');
