# @lemur-bookstores/rbac

Role-Based Access Control (RBAC) module for SecureStack.

## Features

- Role hierarchy support
- Permission inheritance
- Middleware integration
- Dynamic permission checking
- Type-safe role definitions

## Usage

```typescript
import { RBAC, Role, Permission } from '@lemur-bookstores/rbac';

// Define roles and permissions
const rbac = new RBAC({
  roles: ['admin', 'user', 'guest'],
  permissions: {
    'post:read': ['guest', 'user', 'admin'],
    'post:create': ['user', 'admin'],
    'post:delete': ['admin'],
  },
});

// Check permissions
if (await rbac.can('user', 'post:create')) {
  console.log('User can create posts');
}
```
