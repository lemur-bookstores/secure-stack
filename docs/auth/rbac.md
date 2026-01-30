# Role-Based Access Control (RBAC)

SecureStack provides a flexible and powerful RBAC system to manage permissions and roles within your application.

## Features

- **Role Management**: Define roles and assign them to users.
- **Permission Granularity**: Fine-grained control over actions and resources.
- **Dynamic Rules**: Create complex authorization logic based on context.
- **Middleware Integration**: Seamlessly protect your routes.

## Basic Setup

### 1. Define Roles and Permissions

```typescript
// config/rbac.ts
import { createRBAC } from '@lemur-bookstores/secure-stack-auth';

export const rbac = createRBAC({
  roles: {
    admin: ['*'],
    editor: ['post:create', 'post:edit', 'post:publish'],
    user: ['post:read', 'comment:create'],
  },
});
```

### 2. Protect Routes

```typescript
import { router } from '@lemur-bookstores/secure-stack-core';
import { rbac } from './config/rbac';

const postRouter = router()
  .mutation('create', {
    middleware: rbac.require('post:create'),
    handler: async ({ ctx }) => {
      // Only editors and admins can reach here
    },
  });
```

## Advanced Usage

### Dynamic Permissions

Sometimes static roles aren't enough. You might want to allow a user to edit *their own* post.

```typescript
const rbac = createRBAC({
  roles: {
    user: ['post:read'],
  },
  rules: [
    {
      action: 'post:edit',
      condition: async ({ user, resource }) => {
        return user.id === resource.authorId;
      },
    },
  ],
});
```

### Checking Permissions Programmatically

You can check permissions manually within your handlers.

```typescript
const router = router()
  .mutation('deletePost', {
    handler: async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input.id } });
      
      const canDelete = await ctx.rbac.can(ctx.user, 'post:delete', post);
      
      if (!canDelete) {
        throw new Error('Permission denied');
      }
      
      await ctx.db.post.delete({ where: { id: input.id } });
    },
  });
```

## Integration with Context

Ensure your context includes the RBAC instance and the current user.

```typescript
// context.ts
import { rbac } from './config/rbac';

export const createContext = async ({ req }) => {
  const user = await getUserFromRequest(req);
  return {
    user,
    rbac,
    db: prisma,
  };
};
```

## Best Practices

1.  **Least Privilege**: Grant only the permissions necessary for a role.
2.  **Group Permissions**: Use naming conventions like `resource:action` (e.g., `user:create`, `order:view`).
3.  **Audit Logs**: Log permission checks failures for security auditing.
