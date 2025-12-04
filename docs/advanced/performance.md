# Performance Optimization

SecureStack is built for speed, but there are several ways to further optimize your application for high-performance scenarios.

## 1. Fastify Optimizations

Since SecureStack uses Fastify, all standard Fastify optimizations apply.

### Schema Serialization

Always define response schemas with Zod. Fastify compiles these schemas into highly optimized serialization functions.

```typescript
router().query('getUser', {
  input: z.object({ id: z.string() }),
  // 👇 Defining output schema speeds up serialization by 2-3x
  output: z.object({
    id: z.string(),
    name: z.string(),
  }),
  handler: async ({ input }) => { ... }
});
```

### Logging

In production, use a low-overhead logger configuration.

```typescript
const app = new SecureStackServer({
  logger: {
    level: 'error', // Reduce log volume
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }), // Minimal request log
    },
  },
});
```

## 2. Database Optimization (Prisma)

### Select Only What You Need

Avoid fetching unnecessary fields.

```typescript
// ❌ Bad: Fetches all fields including large blobs
const user = await ctx.db.user.findUnique({ where: { id } });

// ✅ Good: Fetches only needed fields
const user = await ctx.db.user.findUnique({
  where: { id },
  select: { id: true, name: true },
});
```

### Connection Pooling

Use `PgBouncer` or Prisma's built-in connection pooling in serverless environments to manage database connections efficiently.

## 3. Caching

Implement caching strategies at multiple layers.

### Application Cache (Redis)

Cache expensive database queries or computation results.

```typescript
const cachedUser = await redis.get(`user:${id}`);
if (cachedUser) return JSON.parse(cachedUser);

const user = await db.user.findUnique(...);
await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 60);
```

### HTTP Caching

Set appropriate cache headers for static or semi-static data.

```typescript
router().query('getConfig', {
  handler: async ({ ctx }) => {
    ctx.res.header('Cache-Control', 'public, max-age=3600');
    return config;
  },
});
```

## 4. Service Mesh Optimization

### Keep-Alive

Ensure persistent connections between services to avoid handshake overhead.

```typescript
const app = new SecureStackServer({
  mesh: {
    http: {
      keepAlive: true,
      keepAliveMsecs: 1000,
    },
  },
});
```

### Compression

Enable compression for large payloads.

```typescript
await app.server.register(require('@fastify/compress'), {
  global: true,
  threshold: 1024, // Only compress bodies > 1KB
});
```

## 5. Node.js Tuning

- **Memory Limit**: Set `--max-old-space-size` appropriate for your container.
- **Garbage Collection**: Monitor GC pauses.
- **Cluster Mode**: Use a process manager like PM2 to utilize all CPU cores.

```bash
pm2 start dist/index.js -i max
```
