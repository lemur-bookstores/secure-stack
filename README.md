# SecureStack Framework

> Full-stack TypeScript framework with hybrid communication (gRPC + tRPC), built-in security mesh, and premium developer experience

[![npm version](https://badge.fury.io/js/%40lemur-bookstores%2Fsecure-stack.svg)](https://www.npmjs.com/package/@lemur-bookstores/secure-stack)
[![npm downloads](https://img.shields.io/npm/dm/@lemur-bookstores/secure-stack.svg)](https://www.npmjs.com/package/@lemur-bookstores/secure-stack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://github.com/lemur-bookstores/secure-stack/workflows/CI/badge.svg)](https://github.com/lemur-bookstores/secure-stack/actions)
[![Code Coverage](https://codecov.io/gh/lemur-bookstores/secure-stack/branch/main/graph/badge.svg)](https://codecov.io/gh/lemur-bookstores/secure-stack)
[![GitHub stars](https://img.shields.io/github/stars/lemur-bookstores/secure-stack.svg?style=social&label=Star)](https://github.com/lemur-bookstores/secure-stack)
[![GitHub forks](https://img.shields.io/github/forks/lemur-bookstores/secure-stack.svg?style=social&label=Fork)](https://github.com/lemur-bookstores/secure-stack/fork)
[![GitHub issues](https://img.shields.io/github/issues/lemur-bookstores/secure-stack.svg)](https://github.com/lemur-bookstores/secure-stack/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributors](https://img.shields.io/github/contributors/lemur-bookstores/secure-stack.svg)](https://github.com/lemur-bookstores/secure-stack/graphs/contributors)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/elkincp5)
[![Changelog](https://img.shields.io/badge/Changelog-View-orange)](CHANGELOG.md)

## 🚀 Features

- **Hybrid Communication**: gRPC for internal microservices + tRPC for client-server
- **Type-Safety End-to-End**: Complete type inference without manual codegen
- **Built-in Security Mesh**: Encrypted communication, JWT auth, rate limiting, audit logs
- **Express-like DX**: Familiar middleware system and routing
- **Plug-and-Play Modules**: Auth, RBAC, Cache, Storage, Realtime, and more

## 🧩 Modules & Use Cases

### 🔐 Authentication & Security (`@lemur-bookstores/secure-stack-auth`)

Complete security suite with JWT, RBAC, and Session management.

- **Use Case**: Protect your API with role-based access control and secure session handling.
- **Docs**: [Auth Setup](docs/auth/setup.md) | [RBAC Guide](docs/auth/rbac.md)

### 🕸️ Service Mesh (`@lemur-bookstores/secure-stack-mesh`)

Internal communication layer with mTLS-like encryption and service discovery.

- **Use Case**: Securely connect microservices without managing complex certificates.
- **Docs**: [Mesh Overview](docs/mesh/overview.md) | [Configuration](docs/mesh/configuration.md)

### 📱 Client SDK (`@lemur-bookstores/secure-stack-client`)

Type-safe client SDK with React integration, auth helpers, and CSRF protection.

- **Use Case**: Build secure frontend applications with authentication, session management, and RBAC.
- **Features**: Middleware pipeline, token management, SessionProvider with SSR hydration, auth hooks (useSignIn, useSignOut, useIsAuthenticated), RBAC guards (SessionGuard, RoleGate, PermissionGate), CSRF protection, server-side utilities for Next.js
- **Docs**: [Client API](docs/client/api.md) | [Auth Helper Hooks](docs/client/auth-helper-hooks.md) | [CSRF Protection](docs/client/csrf-protection.md) | [React Hooks](docs/client/react-hooks.md) | [SSR Support](docs/client/ssr.md)

### ⚡ Realtime (`@lemur-bookstores/secure-stack-realtime`)

Scalable WebSocket support using Socket.io and Redis.

- **Use Case**: Build chat apps, live notifications, or collaborative tools.
- **Docs**: [Realtime Overview](docs/realtime/overview.md)

### 🛠️ CLI Tool (`@lemur-bookstores/secure-stack-cli`)

Powerful CLI for scaffolding, code generation, and management.

- **Use Case**: Quickly bootstrap new services or generate boilerplate code.
- **Docs**: [CLI Guide](packages/cli/README.md)

## 📦 Installation

```bash
npm install @lemur-bookstores/secure-stack
# or
pnpm add @lemur-bookstores/secure-stack
# or
yarn add @lemur-bookstores/secure-stack
```

## 🎯 Quick Start

```typescript
import { SecureStack, router } from '@lemur-bookstores/secure-stack';
import { z } from 'zod';

const app = new SecureStack({
  name: 'my-service',
  port: 50051,
});

const userRouter = router().query('getUser', {
  input: z.string(),
  handler: async ({ input }) => {
    return { id: input, name: 'John Doe' };
  },
});

app.router('user', userRouter);

await app.start();
console.log('🚀 Server ready!');
```

## 📚 Documentation

Visit [our documentation](docs/README.md) for detailed guides and API reference.

- [Getting Started](docs/getting-started.md)
- [Core Concepts](docs/core/router.md)
- [Server Package](docs/server/api.md)
- [Client Package](docs/client/api.md)
- [Authentication](docs/auth/setup.md)
- [Service Mesh](docs/mesh/overview.md)
- [Examples](docs/examples/basic-crud.md)
- [API Reference](docs/api-reference/index.md)

## 🏗️ Project Structure

This is a monorepo managed with **Turborepo** and **npm workspaces**:

```
secure-stack/
├── packages/
│   └── core/                    # @lemur-bookstores/secure-stack-core
│       ├── src/
│       │   ├── SecureStack.ts   # Main framework class
│       │   ├── router.ts        # Router builder
│       │   ├── types.ts         # Type definitions
│       │   └── index.ts         # Package entry point
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts
├── examples/
│   └── basic/                   # Basic usage example
│       ├── src/
│       │   └── index.ts
│       └── package.json
├── docs/                        # Documentation (coming soon)
├── .development-guide/          # Development planning docs
│   ├── roadmap.md              # Development roadmap
│   ├── feasibility-analysis.md # Feasibility analysis
│   └── secure-microservices-mesh.md # Mesh documentation
├── package.json                 # Root package.json
├── turbo.json                   # Turborepo configuration
├── pnpm-workspace.yaml          # Workspace configuration
└── tsconfig.json                # Shared TypeScript config
```

### Packages

- **@lemur-bookstores/secure-stack-core** - Core framework with context, middleware, and router
- **@lemur-bookstores/secure-stack-server** - Server implementation with HTTP, tRPC, and gRPC adapters
- **@lemur-bookstores/secure-stack-client** - Client SDK with React integration, auth, CSRF protection, and SSR support
- **@lemur-bookstores/secure-stack-mesh** - Service Mesh (coming soon)
- **@lemur-bookstores/secure-stack-cli** - CLI tool (coming soon)

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ or Bun 1.0+
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/lemur-bookstores/secure-stack.git
cd secure-stack

# Install dependencies
npm install

# Build all packages
npm run build

# Run the basic example
npm run dev --workspace=examples/basic
```

### Development

```bash
# Run all packages in dev mode
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [@elkincp5](https://github.com/elkincp5)

## 🙏 Acknowledgments

Inspired by:

- [Express](https://expressjs.com/) - Simplicity and familiarity
- [Firebase](https://firebase.google.com/) - Premium developer experience
- [tRPC](https://trpc.io/) - Type-safe APIs
- [NestJS](https://nestjs.com/) - Enterprise architecture patterns
