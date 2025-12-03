# SecureStack Examples

Collection of examples demonstrating SecureStack framework features.

## Available Examples

### 1. Basic Example (`index.ts`)

Basic router and procedure usage with SecureStack core.

```bash
npm run dev
```

### 2. Server Example (`server-example.ts`)

HTTP server with routers, lifecycle hooks, and REST endpoints.

**Features:**

- User and Post routers
- HTTP endpoints (GET/POST)
- Health checks and metrics
- Graceful shutdown
- CORS support

**Run:**

```bash
npm run dev:server
```

**Try:**

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/user/listUsers
curl -X POST http://localhost:3000/api/user/createUser \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
```

### 3. Service Mesh Example (`mesh-example.ts`)

Secure service-to-service communication with hybrid encryption.

**Features:**

- RSA-4096 + AES-256-GCM encryption
- JWT mutual authentication
- Session management
- Service discovery
- Message integrity (HMAC-SHA256)

**Run:**

```bash
npm run dev:mesh
```

## Requirements

- Node.js 20+
- npm or pnpm

## Install Dependencies

```bash
cd examples/basic
npm install
```

## Available Scripts

```bash
npm run dev        # Run basic example
npm run dev:server # Run server example
npm run dev:mesh   # Run mesh example
npm run build      # Build all examples
```

## Learn More

- [SecureStack Core](../../packages/core/README.md)
- [SecureStack Server](../../packages/server/README.md)
- [SecureStack Mesh](../../packages/mesh/README.md)
- [Full Documentation](../../docs/)
