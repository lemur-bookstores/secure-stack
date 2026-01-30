# Service Discovery

Service Discovery allows microservices to find and communicate with each other without hardcoding IP addresses or ports. SecureStack supports both static and dynamic discovery modes.

## Static Discovery

Best for development or simple deployments where service locations don't change often.

```typescript
const app = new SecureStackServer({
  mesh: {
    discovery: {
      mode: 'static',
      services: [
        { id: 'user-service', host: 'localhost', port: 5001 },
        { id: 'order-service', host: 'localhost', port: 5002 },
        { id: 'payment-service', host: 'localhost', port: 5003 },
      ],
    },
  },
});
```

## Dynamic Discovery

For production environments with scaling and dynamic IPs, SecureStack integrates with external service registries.

### Consul Integration

```typescript
const app = new SecureStackServer({
  mesh: {
    discovery: {
      mode: 'consul',
      consulUrl: 'http://consul:8500',
      serviceName: 'my-service',
      tags: ['production', 'v1'],
    },
  },
});
```

### Custom Registry

You can implement a custom discovery provider by extending the `DiscoveryProvider` interface.

```typescript
import { DiscoveryProvider, ServiceNode } from '@lemur-bookstores/secure-stack-mesh';

class MyCustomRegistry implements DiscoveryProvider {
  async register(service: ServiceNode): Promise<void> {
    // Register service logic
  }

  async discover(serviceId: string): Promise<ServiceNode[]> {
    // Lookup logic
    return [{ id: serviceId, host: '10.0.0.5', port: 8080 }];
  }
}

const app = new SecureStackServer({
  mesh: {
    discovery: {
      provider: new MyCustomRegistry(),
    },
  },
});
```

## Load Balancing

When multiple instances of a service are discovered, the Mesh client automatically load balances requests.

### Strategies

- **Round Robin** (Default): Cycles through available instances.
- **Random**: Selects a random instance.
- **Least Connections**: Selects the instance with the fewest active connections.

```typescript
const app = new SecureStackServer({
  mesh: {
    loadBalancing: {
      strategy: 'round-robin',
    },
  },
});
```

## Health Checks

The discovery system automatically filters out unhealthy instances.

1.  **Active Checks**: The mesh periodically pings services.
2.  **Passive Checks**: If a request fails, the instance is temporarily marked as unhealthy.

```typescript
const app = new SecureStackServer({
  mesh: {
    healthCheck: {
      interval: 10000, // Check every 10 seconds
      timeout: 2000,   // Timeout after 2 seconds
    },
  },
});
```
