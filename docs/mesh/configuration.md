# Configuration Guide

## Overview

The Mesh package provides flexible configuration options for paths, security, resilience, and monitoring. This guide covers all available configuration options.

## Path Configuration

Configure custom paths for proto files, keys, logs, and metrics:

```typescript
import { SecureMesh } from '@lemur-bookstores/secure-stack-mesh';

const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50051,
  paths: {
    protoFile: './custom/path/to/secure-messaging.proto',
    keysDir: './custom/keys',
    logsDir: './custom/logs',
    metricsDir: './custom/metrics'
  }
});
```

### Default Paths

If not specified, the following defaults are used:

- `protoFile`: `./proto/secure-messaging.proto`
- `keysDir`: `./keys`
- `logsDir`: `./logs`
- `metricsDir`: `./metrics`

All paths are resolved relative to `process.cwd()` unless absolute paths are provided.

### Environment Variables

Use environment variables for production deployments:

```typescript
const mesh = new SecureMesh({
  serviceId: process.env.SERVICE_ID || 'my-service',
  port: parseInt(process.env.PORT || '50051'),
  paths: {
    protoFile: process.env.MESH_PROTO_FILE,
    keysDir: process.env.MESH_KEYS_DIR,
    logsDir: process.env.MESH_LOGS_DIR,
    metricsDir: process.env.MESH_METRICS_DIR
  }
});
```

### Production Example

```typescript
const mesh = new SecureMesh({
  serviceId: 'payment-service',
  port: 50051,
  paths: {
    protoFile: '/etc/mesh/secure-messaging.proto',
    keysDir: '/var/secrets/mesh-keys',
    logsDir: '/var/log/mesh',
    metricsDir: '/var/metrics/mesh'
  },
  security: {
    aesKeySize: 256,
    sessionTimeout: 3600000
  },
  resilience: {
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000
    },
    circuitBreaker: {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000
    },
    retry: {
      maxAttempts: 3,
      initialDelay: 1000
    }
  },
  monitoring: {
    enabled: true,
    adapters: [/* your monitoring adapters */]
  }
});
```

## Security Configuration

```typescript
security: {
  aesKeySize: 256,           // AES key size: 128, 192, or 256
  sessionTimeout: 3600000,   // Session timeout in ms (default: 1 hour)
  keysDir: './keys'          // Directory for RSA key storage (deprecated, use paths.keysDir)
}
```

## Resilience Configuration

### Rate Limiting

```typescript
resilience: {
  rateLimit: {
    maxRequests: 1000,  // Maximum requests per window
    windowMs: 60000     // Time window in milliseconds
  }
}
```

### Circuit Breaker

```typescript
resilience: {
  circuitBreaker: {
    failureThreshold: 5,    // Number of failures before opening circuit
    successThreshold: 2,    // Number of successes before closing circuit
    timeout: 60000          // Timeout before attempting to close circuit (ms)
  }
}
```

### Retry Policy

```typescript
resilience: {
  retry: {
    maxAttempts: 3,      // Maximum retry attempts
    initialDelay: 1000   // Initial delay between retries (ms)
  }
}
```

## Monitoring Configuration

```typescript
monitoring: {
  enabled: true,
  adapters: [
    // Custom monitoring adapters implementing MonitoringAdapter interface
  ]
}
```

## Key Rotation Configuration

```typescript
rotation: {
  interval: 3600000,  // Rotation interval in ms (default: 1 hour)
  autoRotate: true    // Enable automatic key rotation
}
```

## Service Discovery Configuration

```typescript
discovery: {
  services: [
    {
      id: 'user-service',
      host: 'localhost',
      port: 50052,
      publicKey: '...'  // Optional: RSA public key
    },
    {
      id: 'order-service',
      host: 'localhost',
      port: 50053
    }
  ]
}
```

## Complete Configuration Example

```typescript
import { SecureMesh } from '@lemur-bookstores/secure-stack-mesh';

const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50051,
  
  paths: {
    protoFile: './proto/secure-messaging.proto',
    keysDir: './keys',
    logsDir: './logs',
    metricsDir: './metrics'
  },
  
  security: {
    aesKeySize: 256,
    sessionTimeout: 3600000
  },
  
  discovery: {
    services: [
      { id: 'service-a', host: 'localhost', port: 50052 },
      { id: 'service-b', host: 'localhost', port: 50053 }
    ]
  },
  
  resilience: {
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000
    },
    circuitBreaker: {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000
    },
    retry: {
      maxAttempts: 3,
      initialDelay: 1000
    }
  },
  
  monitoring: {
    enabled: true,
    adapters: []
  },
  
  rotation: {
    interval: 3600000,
    autoRotate: true
  }
});

await mesh.initialize();
```

## Security Best Practices

1. **Keys Directory**: Store keys in a secure location with restricted permissions (e.g., `chmod 600`)
2. **Environment Variables**: Use environment variables for sensitive configuration in production
3. **Absolute Paths**: Use absolute paths in production to avoid path resolution issues
4. **Monitoring**: Enable monitoring to track security events and performance
5. **Rate Limiting**: Configure appropriate rate limits based on your service capacity
6. **Key Rotation**: Enable automatic key rotation for long-running services
