# Getting Started with Mesh

## Installation

```bash
npm install @lemur-bookstores/mesh
```

## Quick Start

### 1. Create a Basic Service

```typescript
import { SecureMesh } from '@lemur-bookstores/mesh';

const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50051
});

await mesh.initialize();
console.log('Mesh initialized!');
```

### 2. Connect to Another Service

```typescript
// Register services for discovery
const mesh = new SecureMesh({
  serviceId: 'service-a',
  port: 50051,
  discovery: {
    services: [
      { id: 'service-b', host: 'localhost', port: 50052 }
    ]
  }
});

await mesh.initialize();

// Connect and make a call
const client = mesh.connect('service-b');
const response = await client.call('greet', { name: 'World' });
console.log(response);
```

### 3. Create a Server

```typescript
import { SecureMeshServer } from '@lemur-bookstores/mesh';

const server = new SecureMeshServer('my-service');

await server.start(50051);
console.log('Server running on port 50051');
```

## Directory Structure

Create the following directory structure for your mesh service:

```
my-service/
├── proto/
│   └── secure-messaging.proto  # Copy from node_modules/@lemur-bookstores/mesh/proto
├── keys/                       # Auto-generated RSA keys
├── logs/                       # Service logs (if monitoring enabled)
├── metrics/                    # Metrics data (if monitoring enabled)
└── src/
    └── index.ts               # Your service code
```

## Custom Paths

If you prefer a different structure:

```typescript
const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50051,
  paths: {
    protoFile: './config/proto/secure-messaging.proto',
    keysDir: './secrets/keys',
    logsDir: './data/logs',
    metricsDir: './data/metrics'
  }
});
```

## Next Steps

- Read the [Configuration Guide](./configuration.md) for detailed configuration options
- Check the [README](../../README.md) for API reference
- See [examples](../../examples) for complete working examples

## Common Issues

### Proto File Not Found

If you get a "proto file not found" error:

1. Copy the proto file from `node_modules/@lemur-bookstores/mesh/proto/secure-messaging.proto`
2. Place it in your project's `./proto` directory
3. Or configure a custom path using `paths.protoFile`

### Keys Directory Permissions

Ensure the keys directory has proper permissions:

```bash
chmod 700 ./keys
```

### Port Already in Use

If the port is already in use, change it in your configuration:

```typescript
const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50052  // Use a different port
});
```
