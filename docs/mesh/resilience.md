# Resilience Patterns

## Overview

The mesh package provides built-in resilience patterns to make your microservices more robust and fault-tolerant. These patterns help handle failures gracefully and prevent cascading failures across your service mesh.

## Rate Limiting

### Purpose

Protect your services from being overwhelmed by too many requests, whether from legitimate traffic spikes or malicious attacks.

### Configuration

```typescript
const mesh = new SecureMesh({
  serviceId: 'api-gateway',
  port: 50051,
  resilience: {
    rateLimit: {
      maxRequests: 1000,  // Max requests per window
      windowMs: 60000     // 1 minute window
    }
  }
});
```

### Use Cases

#### 1. API Gateway Protection

```typescript
// Protect your API gateway from DDoS attacks
const gateway = new SecureMesh({
  serviceId: 'api-gateway',
  port: 50051,
  resilience: {
    rateLimit: {
      maxRequests: 5000,
      windowMs: 60000  // 5000 requests per minute
    }
  }
});
```

#### 2. Per-Service Rate Limiting

```typescript
// Different limits for different service types
const paymentService = new SecureMesh({
  serviceId: 'payment-service',
  port: 50052,
  resilience: {
    rateLimit: {
      maxRequests: 100,   // Lower limit for critical services
      windowMs: 60000
    }
  }
});
```

#### 3. Burst Protection

```typescript
// Protect against sudden traffic bursts
const notificationService = new SecureMesh({
  serviceId: 'notification-service',
  port: 50053,
  resilience: {
    rateLimit: {
      maxRequests: 1000,
      windowMs: 10000  // Shorter window for burst protection
    }
  }
});
```

### Server-Side Rate Limiting

The `SecureMeshServer` automatically enforces rate limits on incoming requests:

```typescript
import { SecureMeshServer } from '@lemur-bookstores/mesh';

const server = new SecureMeshServer(
  'my-service',
  './keys',
  {
    maxRequests: 1000,
    windowMs: 60000
  }
);

await server.start(50051);
// Server will reject requests exceeding the limit with RESOURCE_EXHAUSTED status
```

## Circuit Breaker

### Purpose

Prevent cascading failures by stopping requests to failing services and giving them time to recover.

### Configuration

```typescript
const mesh = new SecureMesh({
  serviceId: 'order-service',
  port: 50051,
  resilience: {
    circuitBreaker: {
      failureThreshold: 5,     // Open after 5 failures
      successThreshold: 2,     // Close after 2 successes
      timeout: 60000           // Try again after 1 minute
    }
  }
});
```

### States

- **Closed**: Normal operation, requests flow through
- **Open**: Service is failing, requests are rejected immediately
- **Half-Open**: Testing if service has recovered

### Use Cases

#### 1. Database Connection Protection

```typescript
// Protect against database connection failures
const userService = new SecureMesh({
  serviceId: 'user-service',
  port: 50051,
  resilience: {
    circuitBreaker: {
      failureThreshold: 3,   // Quick detection
      successThreshold: 2,
      timeout: 30000         // Retry after 30s
    }
  }
});
```

#### 2. External API Integration

```typescript
// Protect against third-party API failures
const paymentGateway = new SecureMesh({
  serviceId: 'payment-gateway',
  port: 50052,
  resilience: {
    circuitBreaker: {
      failureThreshold: 5,
      successThreshold: 3,   // More successes needed
      timeout: 120000        // Longer recovery time
    }
  }
});
```

#### 3. Microservice Dependencies

```typescript
// Protect service mesh from cascading failures
const orderService = new SecureMesh({
  serviceId: 'order-service',
  port: 50053,
  discovery: {
    services: [
      { id: 'inventory-service', host: 'localhost', port: 50054 },
      { id: 'payment-service', host: 'localhost', port: 50055 }
    ]
  },
  resilience: {
    circuitBreaker: {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000
    }
  }
});

// Circuit breaker is created per service connection
const inventory = orderService.connect('inventory-service');
const payment = orderService.connect('payment-service');
// Each has its own circuit breaker
```

## Retry Policy

### Purpose

Automatically retry failed requests with exponential backoff to handle transient failures.

### Configuration

```typescript
const mesh = new SecureMesh({
  serviceId: 'notification-service',
  port: 50051,
  resilience: {
    retry: {
      maxAttempts: 3,      // Retry up to 3 times
      initialDelay: 1000   // Start with 1s delay
    }
  }
});
```

### Backoff Strategy

The retry policy uses exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 1s delay
- Attempt 3: 2s delay
- Attempt 4: 4s delay

### Use Cases

#### 1. Network Transient Failures

```typescript
// Handle temporary network issues
const emailService = new SecureMesh({
  serviceId: 'email-service',
  port: 50051,
  resilience: {
    retry: {
      maxAttempts: 5,      // More retries for network issues
      initialDelay: 500    // Shorter initial delay
    }
  }
});
```

#### 2. Database Deadlock Recovery

```typescript
// Retry on database deadlocks
const transactionService = new SecureMesh({
  serviceId: 'transaction-service',
  port: 50052,
  resilience: {
    retry: {
      maxAttempts: 3,
      initialDelay: 100    // Quick retry for deadlocks
    }
  }
});
```

#### 3. Rate Limit Backoff

```typescript
// Retry when hitting rate limits
const analyticsService = new SecureMesh({
  serviceId: 'analytics-service',
  port: 50053,
  resilience: {
    retry: {
      maxAttempts: 4,
      initialDelay: 2000   // Longer delay for rate limits
    }
  }
});
```

## Combined Resilience Patterns

### Production-Ready Configuration

```typescript
const mesh = new SecureMesh({
  serviceId: 'production-service',
  port: 50051,
  resilience: {
    // Protect from overload
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000
    },
    // Prevent cascading failures
    circuitBreaker: {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000
    },
    // Handle transient failures
    retry: {
      maxAttempts: 3,
      initialDelay: 1000
    }
  }
});
```

### Request Flow

```
Incoming Request
    ↓
Rate Limiter (check quota)
    ↓
Circuit Breaker (check service health)
    ↓
Retry Policy (handle failures)
    ↓
Service Call
```

## Best Practices

1. **Rate Limiting**
   - Set limits based on service capacity
   - Use lower limits for critical services
   - Monitor rate limit hits to adjust thresholds

2. **Circuit Breaker**
   - Set failure threshold based on error rate tolerance
   - Use longer timeouts for external dependencies
   - Monitor circuit breaker state changes

3. **Retry Policy**
   - Don't retry non-idempotent operations
   - Use exponential backoff to avoid overwhelming services
   - Set reasonable max attempts (3-5 typically)

4. **Combined Patterns**
   - Use all three patterns together for maximum resilience
   - Tune parameters based on service characteristics
   - Monitor metrics to optimize configuration

## Monitoring

Track resilience pattern metrics:

```typescript
const stats = mesh.getStats();
console.log(stats.metrics);
// {
//   messagesSent: 1000,
//   messagesFailed: 5,
//   circuitBreakerState: 'closed',
//   ...
// }
```
