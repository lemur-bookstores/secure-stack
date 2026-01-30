# Service Mesh Overview

SecureStack includes a built-in Service Mesh for secure microservices communication with hybrid encryption, mutual authentication, and service discovery.

## Features

- **Hybrid Encryption**: RSA-4096 + AES-256-GCM + HMAC-SHA256
- **Mutual Authentication**: JWT-based service-to-service auth
- **Service Discovery**: Static and dynamic service registration
- **Circuit Breaker**: Automatic failure detection and recovery
- **Rate Limiting**: Distributed rate limiting across services
- **Audit Logging**: Complete communication audit trail
- **Key Rotation**: Automatic encryption key rotation

## Installation

```bash
npm install @lemur-bookstores/secure-stack-mesh
```

## Basic Setup

### Server Configuration

```typescript
import { SecureStackServer } from '@lemur-bookstores/secure-stack-server';

const app = new SecureStackServer({
  name: 'user-service',
  port: 50051,
  
  mesh: {
    enabled: true,
    
    security: {
      encryption: 'hybrid',
      rsaKeySize: 4096,
      aesKeySize: 256,
    },
    
    discovery: {
      mode: 'static',
      services: [
        { id: 'auth-service', host: 'auth.internal', port: 50052 },
        { id: 'order-service', host: 'order.internal', port: 50053 },
      ],
    },
  },
});

await app.start();
```

## Service Communication

### Calling Other Services

```typescript
import { router } from '@lemur-bookstores/secure-stack-core';

const userRouter = router()
  .query('getUserWithOrders', {
    input: z.object({ userId: z.string() }),
    handler: async ({ input, ctx }) => {
      // Get user from local database
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });
      
      // Call order service through mesh
      const orders = await ctx.mesh.call('order-service', 'getOrdersByUser', {
        userId: input.userId,
      });
      
      return {
        ...user,
        orders,
      };
    },
  });
```

### Automatic Encryption

All service-to-service communication is automatically encrypted:

```
Service A → [RSA Handshake] → Service B
         ↓
    [AES-256-GCM Encrypted Messages]
         ↓
    [HMAC-SHA256 Integrity Check]
```

## Security Features

### Mutual Authentication

```typescript
// Each service authenticates with JWT
const mesh = new SecureMesh({
  serviceId: 'user-service',
  jwtSecret: process.env.JWT_SECRET,
  
  auth: {
    enabled: true,
    tokenExpiry: '1h',
  },
});
```

### Encryption Layers

1. **RSA-4096**: Initial key exchange
2. **AES-256-GCM**: Session encryption (authenticated)
3. **HMAC-SHA256**: Message integrity verification

### Key Rotation

```typescript
const mesh = new SecureMesh({
  keyRotation: {
    enabled: true,
    interval: 3600000, // 1 hour
  },
});
```

## Service Discovery

### Static Discovery

```typescript
const mesh = new SecureMesh({
  discovery: {
    mode: 'static',
    services: [
      { id: 'service-a', host: 'localhost', port: 50051 },
      { id: 'service-b', host: 'localhost', port: 50052 },
    ],
  },
});
```

### Dynamic Discovery (Consul/etcd)

```typescript
const mesh = new SecureMesh({
  discovery: {
    mode: 'consul',
    consulUrl: 'http://consul:8500',
    serviceName: 'my-service',
    healthCheckInterval: 10000,
  },
});
```

## Resilience Patterns

### Circuit Breaker

```typescript
const mesh = new SecureMesh({
  circuitBreaker: {
    enabled: true,
    threshold: 5,        // Open after 5 failures
    timeout: 60000,      // Try again after 60s
    halfOpenRequests: 3, // Test with 3 requests
  },
});
```

### Rate Limiting

```typescript
const mesh = new SecureMesh({
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000, // 100 requests per minute
  },
});
```

### Retry Policy

```typescript
const mesh = new SecureMesh({
  retry: {
    enabled: true,
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
  },
});
```

## Monitoring & Observability

### Audit Logging

```typescript
const mesh = new SecureMesh({
  audit: {
    enabled: true,
    logPath: './logs/mesh-audit.log',
    events: ['connection', 'message', 'error', 'key_rotation'],
  },
});
```

### Metrics Collection

```typescript
const mesh = new SecureMesh({
  metrics: {
    enabled: true,
    endpoint: '/metrics',
  },
});

// Access metrics
const metrics = await mesh.getMetrics();
console.log(metrics);
// {
//   totalRequests: 1000,
//   successfulRequests: 950,
//   failedRequests: 50,
//   averageLatency: 45,
//   activeConnections: 5
// }
```

## Complete Example

### Service A (User Service)

```typescript
import { SecureStackServer } from '@lemur-bookstores/secure-stack-server';
import { router } from '@lemur-bookstores/secure-stack-core';

const app = new SecureStackServer({
  name: 'user-service',
  port: 50051,
  
  mesh: {
    enabled: true,
    security: {
      encryption: 'hybrid',
    },
    discovery: {
      mode: 'static',
      services: [
        { id: 'order-service', host: 'localhost', port: 50052 },
      ],
    },
  },
});

const userRouter = router()
  .query('getUserProfile', {
    input: z.object({ userId: z.string() }),
    handler: async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });
      
      // Secure call to order service
      const orders = await ctx.mesh.call('order-service', 'getUserOrders', {
        userId: input.userId,
      });
      
      return { ...user, orders };
    },
  });

app.router('user', userRouter);
await app.start();
```

### Service B (Order Service)

```typescript
import { SecureStackServer } from '@lemur-bookstores/secure-stack-server';
import { router } from '@lemur-bookstores/secure-stack-core';

const app = new SecureStackServer({
  name: 'order-service',
  port: 50052,
  
  mesh: {
    enabled: true,
    security: {
      encryption: 'hybrid',
    },
  },
});

const orderRouter = router()
  .query('getUserOrders', {
    input: z.object({ userId: z.string() }),
    handler: async ({ input, ctx }) => {
      return ctx.db.order.findMany({
        where: { userId: input.userId },
      });
    },
  });

app.router('order', orderRouter);
await app.start();
```

## Best Practices

1. **Use Service Discovery**: Don't hardcode service addresses
2. **Enable Circuit Breakers**: Prevent cascade failures
3. **Monitor Metrics**: Track service health and performance
4. **Rotate Keys Regularly**: Enhance security with key rotation
5. **Log Audit Events**: Maintain security audit trail

## Next Steps

- [Learn about Encryption](./encryption.md)
- [Explore Service Discovery](./discovery.md)
- [See Microservices Example](../examples/microservices.md)
- [Understand Security Best Practices](../advanced/security.md)
