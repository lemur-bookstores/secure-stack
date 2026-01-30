# @lemur-bookstores/secure-stack-core

> Core framework - Foundation of SecureStack

## Installation

```bash
npm install @lemur-bookstores/secure-stack-core
# or
pnpm add @lemur-bookstores/secure-stack-core
```

## Features

- ✅ **Context System** - Flexible context builder with extension support
- ✅ **Middleware Pipeline** - Koa-style middleware composition
- ✅ **Router Abstraction** - Type-safe procedure definitions
- ✅ **Error Handling** - Comprehensive error system with codes
- ✅ **Type Inference** - Full TypeScript support
- ✅ **Service Mesh Support** - Built-in mesh configuration

## Quick Start

```typescript
import { SecureStack, router, ServiceType } from '@lemur-bookstores/secure-stack-core';
import { z } from 'zod';

const app = new SecureStack({
  name: 'my-service',
  port: 3000,
  type: ServiceType.Microservice,
});

const userRouter = router()
  .query('getUser', {
    input: z.string(),
    handler: async ({ input }) => {
      return { id: input, name: 'John Doe' };
    }
  });

app.router('user', userRouter);
await app.start();
```

## Middleware

SecureStack includes built-in middlewares:

```typescript
import { logger, errorHandler, cors } from '@lemur-bookstores/secure-stack-core';

app.use(errorHandler());
app.use(logger());
app.use(cors({ origin: '*' }));
```

### Custom Middleware

```typescript
app.use(async (ctx, next) => {
  console.log('Before');
  await next();
  console.log('After');
});
```

## Context

Create and extend contexts:

```typescript
import { createContext } from '@lemur-bookstores/secure-stack-core';

const contextBuilder = createContext<{ user?: User }>();

app.setContextFactory((initial) => {
  return contextBuilder.create(initial);
});
```

## Error Handling

Use built-in error types:

```typescript
import { SecureStackError } from '@lemur-bookstores/secure-stack-core';

// Throw errors
throw SecureStackError.notFound('User not found');
throw SecureStackError.unauthorized();
throw SecureStackError.forbidden('Access denied');
throw SecureStackError.validationError('Invalid input');
```

## Router

Define type-safe procedures:

```typescript
const router = router()
  .query('getName', {
    input: z.string(),
    handler: async ({ input }) => {
      return { name: input };
    }
  })
  .mutation('create', {
    input: z.object({ name: z.string() }),
    handler: async ({ input }) => {
      return { id: '123', ...input };
    }
  });
```

## Service Mesh

Enable the service mesh:

```typescript
import { ServiceType, EncryptionMode, DiscoveryMode } from '@lemur-bookstores/secure-stack-core';

const app = new SecureStack({
  name: 'user-service',
  port: 50051,
  type: ServiceType.Microservice,
  mesh: {
    enabled: true,
    security: {
      encryption: EncryptionMode.Hybrid,
      rsaKeySize: 4096,
      aesKeySize: 256,
    },
    discovery: {
      mode: DiscoveryMode.Static,
      services: [
        { id: 'auth-service', host: 'auth.internal', port: 50052 }
      ]
    }
  }
});

// Connect to other services
const authService = app.mesh.connect('auth-service');
const response = await authService.call('verify', { token: 'abc' });
```

## API Reference

### SecureStack

Main framework class.

**Methods:**
- `router(name, router)` - Register a router
- `use(middleware)` - Add middleware
- `setContextFactory(factory)` - Set context factory
- `createContext(initial)` - Create context instance
- `start()` - Start the server
- `stop()` - Stop the server

### router()

Create a new router.

**Methods:**
- `query(name, config)` - Define a query procedure
- `mutation(name, config)` - Define a mutation procedure
- `subscription(name, config)` - Define a subscription procedure
- `middleware(fn)` - Add middleware to router

### Enums

- `ServiceType` - Microservice | Gateway
- `EncryptionMode` - Hybrid | TLS | None
- `DiscoveryMode` - Static | DNS | Consul | Etcd
- `ErrorCode` - All error codes

## Examples

See the `examples/` directory for complete examples:

- `examples/basic` - Basic usage
- `examples/advanced` - Middleware, errors, validation

## License

MIT © [@elkincp5](https://github.com/elkincp5)
