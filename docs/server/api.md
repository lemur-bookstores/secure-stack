# SecureStackServer API

The `SecureStackServer` class extends the core `SecureStack` class with HTTP server capabilities, protocol adapters, and lifecycle management.

## Installation

```bash
npm install @lemur-bookstores/secure-stack-server
```

## Basic Usage

```typescript
import { SecureStackServer } from '@lemur-bookstores/secure-stack-server';

const app = new SecureStackServer({
  name: 'my-api',
  port: 3000,
});

await app.start();
```

## Configuration

### ServerConfig

```typescript
interface SecureStackServerConfig {
  // Required
  name: string;
  port: number;
  
  // Optional
  host?: string;              // Default: '0.0.0.0'
  apiPrefix?: string;         // Default: '/api'
  context?: () => Context;    // Context creator
  
  // CORS configuration
  cors?: {
    origin?: string | string[] | boolean;
    credentials?: boolean;
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
  };
}
```

### Example Configuration

```typescript
const app = new SecureStackServer({
  name: 'production-api',
  port: parseInt(process.env.PORT || '3000'),
  host: '0.0.0.0',
  apiPrefix: '/api/v1',
  
  cors: {
    origin: [
      'https://app.example.com',
      'https://admin.example.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  
  context: () => ({
    db: prisma,
    redis: redisClient,
    logger: winston.createLogger(),
  }),
});
```

## Lifecycle Hooks

### Available Hooks

```typescript
app.hook('onStart', async () => {
  // Called before server starts
  console.log('Server starting...');
});

app.hook('onReady', async () => {
  // Called when server is ready
  console.log('Server ready!');
});

app.hook('onShutdown', async () => {
  // Called during graceful shutdown
  console.log('Server shutting down...');
  await cleanup();
});
```

### Complete Example

```typescript
const app = new SecureStackServer({
  name: 'my-api',
  port: 3000,
});

app.hook('onStart', async () => {
  // Connect to database
  await prisma.$connect();
  console.log('✅ Database connected');
});

app.hook('onReady', async () => {
  // Send ready signal
  console.log('🚀 Server ready at http://localhost:3000');
  
  // Register with service discovery
  await serviceRegistry.register({
    name: 'my-api',
    host: 'localhost',
    port: 3000,
  });
});

app.hook('onShutdown', async () => {
  // Cleanup resources
  await prisma.$disconnect();
  await redis.quit();
  console.log('✅ Cleanup complete');
});

await app.start();
```

## Built-in Endpoints

The server automatically provides health check and metrics endpoints:

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2024-12-03T12:00:00.000Z",
  "service": "my-api"
}
```

### Ready Check

```bash
GET /ready
```

Response:
```json
{
  "status": "ready",
  "service": "my-api"
}
```

### Metrics

```bash
GET /metrics
```

Response:
```json
{
  "uptime": 123.456,
  "memory": {
    "rss": 50000000,
    "heapTotal": 20000000,
    "heapUsed": 15000000,
    "external": 1000000
  },
  "cpu": {
    "user": 100000,
    "system": 50000
  }
}
```

## Registering Routers

```typescript
import { router } from '@lemur-bookstores/secure-stack-core';

const userRouter = router()
  .query('getUser', { ... })
  .mutation('createUser', { ... });

const postRouter = router()
  .query('listPosts', { ... })
  .mutation('createPost', { ... });

// Register routers
app.router('user', userRouter);
app.router('post', postRouter);

// Routes will be available at:
// /api/user/getUser
// /api/user/createUser
// /api/post/listPosts
// /api/post/createPost
```

## Accessing Fastify Instance

For advanced use cases, access the underlying Fastify instance:

```typescript
const app = new SecureStackServer({ ... });

// Access Fastify instance
const fastify = app.server;

// Register Fastify plugins
await fastify.register(require('@fastify/helmet'));
await fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute',
});

// Add custom routes
fastify.get('/custom', async (request, reply) => {
  return { custom: 'route' };
});
```

## Graceful Shutdown

```typescript
const app = new SecureStackServer({ ... });

await app.start();

// Handle shutdown signals
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});
```

## Environment Variables

Common environment variable patterns:

```typescript
const app = new SecureStackServer({
  name: process.env.SERVICE_NAME || 'my-api',
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
});
```

## Error Handling

```typescript
const app = new SecureStackServer({ ... });

// Global error handler
app.server.setErrorHandler((error, request, reply) => {
  // Log error
  console.error('Server error:', error);
  
  // Send response
  reply.status(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
```

## Production Configuration

```typescript
import { SecureStackServer } from '@lemur-bookstores/secure-stack-server';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

const app = new SecureStackServer({
  name: 'production-api',
  port: parseInt(process.env.PORT || '3000'),
  host: '0.0.0.0',
  
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  },
});

// Security headers
await app.server.register(helmet);

// Rate limiting
await app.server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Logging
app.server.addHook('onRequest', async (request) => {
  console.log(`${request.method} ${request.url}`);
});

// Register routers
app.router('api', appRouter);

// Lifecycle hooks
app.hook('onReady', () => {
  console.log(`✅ Server ready on port ${process.env.PORT}`);
});

app.hook('onShutdown', async () => {
  await prisma.$disconnect();
  console.log('✅ Cleanup complete');
});

// Start server
await app.start();
```

## Next Steps

- [Learn about HTTP Adapter](./http.md)
- [Explore tRPC Integration](./trpc.md)
- [Understand gRPC Support](./grpc.md)
- [See Deployment Guide](../advanced/deployment.md)
