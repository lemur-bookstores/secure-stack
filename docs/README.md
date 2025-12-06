# SecureStack Documentation

Welcome to the **SecureStack Framework** documentation! SecureStack is a full-stack TypeScript framework with hybrid communication (gRPC + tRPC), built-in security mesh, and premium developer experience.

## 📚 Table of Contents

### Getting Started

- [Quick Start Guide](./getting-started.md)
- [Installation](./installation.md)
- [Architecture Overview](./architecture.md)

### Core Concepts

- [Router & Procedures](./core/router.md)
- [Middleware System](./core/middleware.md)
- [Context Management](./core/context.md)
- [Error Handling](./core/errors.md)

### Packages

#### Server

- [SecureStackServer API](./server/api.md)
- [HTTP Adapter](./server/http.md)
- [tRPC Integration](./server/trpc.md)
- [gRPC Integration](./server/grpc.md)
- [Lifecycle Hooks](./server/lifecycle.md)

#### Client

- [SecureStackClient API](./client/api.md)
- [Auth Helper Hooks](./client/auth-helper-hooks.md)
- [CSRF Protection](./client/csrf-protection.md)
- [React Hooks](./client/react-hooks.md)
- [Cache Management](./client/cache.md)
- [SSR Support](./client/ssr.md)

#### Authentication

- [Authentication Setup](./auth/setup.md)
- [RBAC System](./auth/rbac.md)
- [JWT Configuration](./auth/jwt.md)

#### Service Mesh

- [Mesh Overview](./mesh/overview.md)
- [Encryption & Security](./mesh/encryption.md)
- [Service Discovery](./mesh/discovery.md)

### Examples & Use Cases

- [Basic CRUD Application](./examples/basic-crud.md)
- [Microservices Architecture](./examples/microservices.md)
- [Authentication & Authorization](./examples/auth-example.md)
- [Real-time Subscriptions](./examples/realtime.md)
- [Full-Stack Application](./examples/fullstack.md)

### Advanced Topics

- [Deployment Strategies](./advanced/deployment.md)
- [Performance Optimization](./advanced/performance.md)
- [Security Best Practices](./advanced/security.md)
- [Testing Strategies](./advanced/testing.md)

### API Reference

- [Complete API Reference](./api-reference/index.md)

## 🚀 Quick Example

```typescript
import { SecureStackServer, router } from '@lemur-bookstores/secure-stack';
import { z } from 'zod';

// Create a server
const app = new SecureStackServer({
  name: 'my-api',
  port: 3000,
});

// Define a router
const userRouter = router()
  .query('getUser', {
    input: z.object({ id: z.string() }),
    handler: async ({ input }) => {
      return { id: input.id, name: 'John Doe' };
    },
  })
  .mutation('createUser', {
    input: z.object({ name: z.string(), email: z.string().email() }),
    handler: async ({ input }) => {
      // Create user logic
      return { id: '123', ...input };
    },
  });

// Register router
app.router('user', userRouter);

// Start server
await app.start();
console.log('🚀 Server running on http://localhost:3000');
```

## 💡 Key Features

- **🔒 Type-Safe**: End-to-end type safety without manual codegen
- **⚡ Fast**: Built on Fastify for maximum performance
- **🔐 Secure**: Built-in encryption, authentication, and RBAC
- **🌐 Hybrid**: Support for HTTP, tRPC, and gRPC
- **🎯 Simple**: Express-like API with modern TypeScript
- **📦 Modular**: Use only what you need

## 🤝 Community & Support

- [GitHub Repository](https://github.com/lemur-bookstores/secure-stack)
- [Issue Tracker](https://github.com/lemur-bookstores/secure-stack/issues)
- [Contributing Guide](../CONTRIBUTING.md)

## 📄 License

MIT © [@elkincp5](https://github.com/elkincp5)
