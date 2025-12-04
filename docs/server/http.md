# HTTP Adapter

The HTTP adapter in SecureStack is built on top of [Fastify](https://www.fastify.io/), providing a high-performance, low-overhead web server with a familiar developer experience.

## Features

- **High Performance**: Built on Fastify, one of the fastest Node.js frameworks
- **Type-Safe Routing**: Automatic type inference for inputs and outputs
- **Middleware Support**: Express-like middleware system
- **Validation**: Built-in Zod validation
- **OpenAPI Support**: Automatic Swagger/OpenAPI generation (optional)

## Basic Usage

The HTTP adapter is automatically configured when you use `SecureStackServer`.

```typescript
import { SecureStackServer, router } from '@lemur-bookstores/server';
import { z } from 'zod';

const app = new SecureStackServer({
  name: 'http-api',
  port: 3000,
});

const apiRouter = router()
  .query('hello', {
    input: z.object({ name: z.string() }),
    handler: async ({ input }) => {
      return { message: `Hello, ${input.name}!` };
    },
  });

app.router('api', apiRouter);

await app.start();
```

## Request Handling

### Query Parameters

For `query` procedures, inputs are mapped from the query string:

```typescript
// GET /api/users?id=123
const userRouter = router()
  .query('getUser', {
    input: z.object({ id: z.string() }),
    handler: async ({ input }) => {
      // input.id is "123"
    },
  });
```

### Body Payload

For `mutation` procedures, inputs are mapped from the JSON body:

```typescript
// POST /api/users
// Body: { "name": "Alice", "email": "alice@example.com" }
const userRouter = router()
  .mutation('createUser', {
    input: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    handler: async ({ input }) => {
      // input is fully typed
    },
  });
```

### URL Parameters

SecureStack handles URL parameters through the input object. Currently, we recommend using query parameters or body payloads for simplicity and type safety, but dynamic route parameters can be handled via Fastify instance access if needed.

## Accessing Request/Response

You can access the raw Fastify request and reply objects via the context:

```typescript
const router = router()
  .query('headers', {
    handler: async ({ ctx }) => {
      const userAgent = ctx.req.headers['user-agent'];
      
      ctx.res.header('X-Custom-Header', 'SecureStack');
      
      return { userAgent };
    },
  });
```

## File Uploads

SecureStack supports multipart file uploads via `@fastify/multipart`.

### Setup

First, register the multipart plugin on the underlying Fastify instance:

```typescript
import multipart from '@fastify/multipart';

const app = new SecureStackServer({ ... });

await app.server.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
```

### Handling Uploads

```typescript
const uploadRouter = router()
  .mutation('upload', {
    handler: async ({ ctx }) => {
      const data = await ctx.req.file();
      
      if (!data) {
        throw new Error('No file uploaded');
      }
      
      // Process stream
      await pump(data.file, fs.createWriteStream(data.filename));
      
      return { filename: data.filename };
    },
  });
```

## Cookies

Cookie support is provided via `@fastify/cookie`.

### Setup

```typescript
import cookie from '@fastify/cookie';

const app = new SecureStackServer({ ... });

await app.server.register(cookie, {
  secret: 'my-secret',
});
```

### Usage

```typescript
const authRouter = router()
  .mutation('login', {
    handler: async ({ ctx }) => {
      // Set cookie
      ctx.res.setCookie('token', 'abc-123', {
        path: '/',
        httpOnly: true,
        secure: true,
      });
      
      return { success: true };
    },
  });
```

## Rate Limiting

Protect your HTTP endpoints with rate limiting.

```typescript
import rateLimit from '@fastify/rate-limit';

const app = new SecureStackServer({ ... });

await app.server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});
```

## CORS Configuration

CORS is configured in the `SecureStackServer` constructor:

```typescript
const app = new SecureStackServer({
  name: 'api',
  port: 3000,
  cors: {
    origin: ['https://example.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

## Error Handling

HTTP errors are automatically mapped from `SecureStackError`:

| Error Code | HTTP Status |
|------------|-------------|
| BAD_REQUEST | 400 |
| UNAUTHORIZED | 401 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| CONFLICT | 409 |
| UNPROCESSABLE_ENTITY | 422 |
| TOO_MANY_REQUESTS | 429 |
| INTERNAL_SERVER_ERROR | 500 |

## Advanced Fastify Usage

You have full access to the underlying Fastify instance:

```typescript
const app = new SecureStackServer({ ... });

// Add global hook
app.server.addHook('onRequest', async (req, reply) => {
  // Global logic
});

// Add custom content type parser
app.server.addContentTypeParser('application/custom', (req, body, done) => {
  // Parsing logic
});
```
