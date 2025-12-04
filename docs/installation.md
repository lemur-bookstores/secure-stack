# Installation

Getting started with SecureStack is easy. You can install the packages you need individually or use our CLI (coming soon).

## Prerequisites

- **Node.js**: v18 or higher
- **Package Manager**: npm, pnpm (recommended), or yarn

## Core Packages

Install the core packages to build a server.

```bash
npm install @lemur-bookstores/core @lemur-bookstores/server zod
```

## Client Packages

Install the client packages for your frontend application.

```bash
npm install @lemur-bookstores/client @tanstack/react-query
```

## Optional Packages

### Authentication

For JWT and RBAC support:

```bash
npm install @lemur-bookstores/auth
```

### Service Mesh

For microservices communication:

```bash
npm install @lemur-bookstores/mesh
```

## TypeScript Configuration

SecureStack is built with TypeScript in mind. We recommend the following `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Next Steps

Once installed, follow the [Quick Start Guide](./getting-started.md) to build your first API.
