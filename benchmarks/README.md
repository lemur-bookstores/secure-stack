# SecureStack Benchmarks

Performance benchmarks for SecureStack framework components.

## Running Benchmarks

```bash
# Run all core benchmarks
npm run bench:all

# Run individual benchmarks
npm run bench:router      # Router performance
npm run bench:middleware  # Middleware composition
npm run bench:server      # Server execution
npm run bench:cache       # Cache strategies
npm run bench:client      # React hooks
npm run bench:e2e         # End-to-end HTTP

# Run comparison benchmarks
npm run bench:trpc        # vs tRPC
npm run bench:grpc        # vs gRPC
```

## Benchmarked Components

### Core Benchmarks

#### Router Benchmarks (`router.bench.ts`)

- Router creation (empty, with queries)
- Query execution (simple, validated, complex)
- Mutation execution with Zod validation

#### Middleware Benchmarks (`middleware.bench.ts`)

- Middleware composition (1, 3, 10+ middlewares)
- Middleware execution (sync, async, error handling)
- Stack performance analysis

#### Server Benchmarks (`server.bench.ts`)

- Router execution (direct, no HTTP)
- Request validation performance
- Mutation handling

#### Cache Benchmarks (`cache.bench.ts`)

- Cache get/set operations
- TimeBasedStrategy performance
- StaleWhileRevalidate performance
- Cache iteration and clearing
- Small vs large data performance

#### Client Benchmarks (`client.bench.ts`)

- React hook rendering (useQuery, useMutation)
- Query execution (cached vs uncached)
- Mutation execution
- Optimistic updates
- Cache invalidation

### End-to-End Benchmarks

#### E2E Benchmarks (`e2e.bench.ts`)

- Full HTTP request cycle
- HTTP overhead measurement
- Large response handling
- Direct vs HTTP comparison

### Comparison Benchmarks

#### vs tRPC (`comparison-trpc.bench.ts`)

- Router creation comparison
- Query execution comparison
- Mutation performance
- Side-by-side performance metrics

#### vs gRPC (`comparison-grpc.bench.ts`)

- Handler execution comparison
- Serialization overhead analysis
- Performance characteristics

## Performance Targets

Expected performance (on modern hardware):

| Component              | Target ops/sec | Notes                        |
| ---------------------- | -------------- | ---------------------------- |
| **Core**               |                |                              |
| Router creation        | >200,000       | Fast initialization          |
| Simple query           | >100,000       | No validation                |
| Validated query        | >50,000        | With Zod schemas             |
| Middleware (3 stack)   | >75,000        | Typical middleware chain     |
| **Cache**              |                |                              |
| Cache get (hit)        | >10,000,000    | In-memory lookup             |
| Cache set              | >1,000,000     | Write operation              |
| Strategy validation    | >10,000,000    | TTL checks                   |
| **Client**             |                |                              |
| Hook rendering         | >10,000        | React hook initialization    |
| Query (cached)         | >5,000         | With React Query cache       |
| Mutation               | >1,000         | State updates included       |
| **E2E**                |                |                              |
| HTTP request           | >1,000         | Full request cycle           |
| HTTP overhead          | <3ms avg       | Network + serialization      |
| **Comparison**         |                |                              |
| vs tRPC                | ±20%           | Similar performance expected |
| vs gRPC (handler only) | ±30%           | Excludes protobuf overhead   |

## Interpreting Results

- **ops/sec**: Operations per second (higher is better)
- **avg (ms)**: Average execution time in milliseconds
- **p99.5 (ms)**: 99.5th percentile latency (worst case for most requests)
- **min/max (ms)**: Best/worst case timings

## Adding New Benchmarks

Create a new `.bench.ts` file:

```typescript
import { Bench } from 'tinybench';

const bench = new Bench({ time: 1000 });

bench.add('My test', () => {
  // Test code here
});

await bench.run();
console.table(bench.table());
```

Update `package.json` to add the script:

```json
{
  "scripts": {
    "bench:mytest": "tsx mytest.bench.ts"
  }
}
```

## CI Integration

These benchmarks can be integrated into CI to:

- Detect performance regressions
- Compare framework versions
- Track performance over time
- Compare with competitors

Example GitHub Actions workflow:

```yaml
- name: Run Benchmarks
  run: npm run bench:all --workspace=benchmarks

- name: Run Comparison Benchmarks
  run: |
    npm run bench:trpc --workspace=benchmarks
    npm run bench:grpc --workspace=benchmarks
```
