/**
 * Cache Benchmarks
 * Tests cache performance with different strategies
 */

import { Bench } from 'tinybench';
import { CacheManager, TimeBasedStrategy, StaleWhileRevalidateStrategy } from '@lemur-bookstores/secure-stack-client';

const bench = new Bench({ time: 1000 });

// Test data
const smallData = { id: '123', name: 'John Doe' };
const mediumData = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    profile: {
        age: 30,
        address: {
            street: '123 Main St',
            city: 'New York',
            country: 'USA'
        },
        preferences: ['dark-mode', 'email-notifications']
    }
};
const largeData = {
    ...mediumData,
    posts: Array(100).fill(null).map((_, i) => ({
        id: `post-${i}`,
        title: `Post ${i}`,
        content: 'Lorem ipsum dolor sit amet '.repeat(10),
        tags: ['tag1', 'tag2', 'tag3']
    }))
};

// Create cache instances
const timeBasedCache = new CacheManager(TimeBasedStrategy);
const swrCache = new CacheManager(StaleWhileRevalidateStrategy);

// Pre-populate caches
for (let i = 0; i < 100; i++) {
    timeBasedCache.set(`key-${i}`, smallData);
    swrCache.set(`key-${i}`, smallData);
}

// Benchmarks
bench
    .add('Cache set (small data)', () => {
        timeBasedCache.set('test-key', smallData);
    })
    .add('Cache set (medium data)', () => {
        timeBasedCache.set('test-key', mediumData);
    })
    .add('Cache set (large data)', () => {
        timeBasedCache.set('test-key', largeData);
    })
    .add('Cache get (hit)', () => {
        timeBasedCache.get('key-0');
    })
    .add('Cache get (miss)', () => {
        timeBasedCache.get('non-existent-key');
    })
    .add('Cache remove', () => {
        timeBasedCache.set('temp-key', smallData);
        timeBasedCache.remove('temp-key');
    })
    .add('TimeBasedStrategy getStatus (fresh)', () => {
        TimeBasedStrategy.getStatus(Date.now(), 60000);
    })
    .add('TimeBasedStrategy getStatus (expired)', () => {
        TimeBasedStrategy.getStatus(Date.now() - 70000, 60000);
    })
    .add('SWR strategy getStatus (fresh)', () => {
        StaleWhileRevalidateStrategy.getStatus(Date.now(), 60000);
    })
    .add('SWR strategy getStatus (stale)', () => {
        StaleWhileRevalidateStrategy.getStatus(Date.now() - 45000, 30000);
    })
    .add('Cache clear (100 items)', () => {
        const cache = new CacheManager(TimeBasedStrategy);
        for (let i = 0; i < 100; i++) {
            cache.set(`key-${i}`, smallData);
        }
        cache.clear();
    })
    .add('Cache size check', () => {
        timeBasedCache.size();
    });

// Run benchmarks
console.log('🔥 Running Cache Benchmarks...\n');

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

// Performance targets
console.log('\n🎯 Performance Targets:');
console.log('  Cache get (hit):    > 10M ops/sec (< 0.1ms avg)');
console.log('  Cache set:          > 1M ops/sec (< 1ms avg)');
console.log('  Strategy getStatus: > 10M ops/sec (< 0.1ms avg)');
console.log('  Cache clear (100):  > 100K ops/sec (< 10ms avg)');
