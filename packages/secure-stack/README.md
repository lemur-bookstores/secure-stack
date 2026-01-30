# @lemur-bookstores/secure-stack

The complete SecureStack framework. This meta-package includes all core modules for building secure, scalable applications.

## Installation

```bash
npm install @lemur-bookstores/secure-stack
```

## Usage

You can import individual modules from the main package:

```typescript
import { Server, Auth, Realtime } from '@lemur-bookstores/secure-stack';

const server = new Server.SecureStackServer();

// Use modules
server.use(Auth.authMiddleware());
```

## Included Packages

- `@lemur-bookstores/secure-stack-audit`
- `@lemur-bookstores/secure-stack-auth`
- `@lemur-bookstores/secure-stack-cache`
- `@lemur-bookstores/secure-stack-client`
- `@lemur-bookstores/secure-stack-core`
- `@lemur-bookstores/secure-stack-mesh`
- `@lemur-bookstores/secure-stack-rate-limit`
- `@lemur-bookstores/secure-stack-rbac`
- `@lemur-bookstores/secure-stack-realtime`
- `@lemur-bookstores/secure-stack-server`
- `@lemur-bookstores/secure-stack-storage`
