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

- `@lemur-bookstores/audit`
- `@lemur-bookstores/auth`
- `@lemur-bookstores/cache`
- `@lemur-bookstores/client`
- `@lemur-bookstores/core`
- `@lemur-bookstores/mesh`
- `@lemur-bookstores/rate-limit`
- `@lemur-bookstores/rbac`
- `@lemur-bookstores/realtime`
- `@lemur-bookstores/server`
- `@lemur-bookstores/storage`
