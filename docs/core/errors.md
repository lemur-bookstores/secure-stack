# Error Handling

SecureStack provides a robust error handling system with standardized error codes, type-safe error throwing, and consistent error responses.

## Table of Contents

- [Error Codes](#error-codes)
- [Throwing Errors](#throwing-errors)
- [Handling Errors](#handling-errors)
- [Custom Errors](#custom-errors)
- [Error Middleware](#error-middleware)
- [Client-Side Error Handling](#client-side-error-handling)

## Error Codes

SecureStack uses standard HTTP-like error codes:

```typescript
type ErrorCode =
  | 'BAD_REQUEST'          // 400 - Invalid input
  | 'UNAUTHORIZED'         // 401 - Not authenticated
  | 'FORBIDDEN'            // 403 - Not authorized
  | 'NOT_FOUND'            // 404 - Resource not found
  | 'CONFLICT'             // 409 - Resource conflict
  | 'UNPROCESSABLE_ENTITY' // 422 - Validation failed
  | 'TOO_MANY_REQUESTS'    // 429 - Rate limit exceeded
  | 'INTERNAL_SERVER_ERROR'; // 500 - Server error
```

## Throwing Errors

### Basic Error

```typescript
import { SecureStackError } from '@lemur-bookstores/core';

const handler = async ({ input, ctx }) => {
  const user = await ctx.db.user.findUnique({
    where: { id: input.id },
  });
  
  if (!user) {
    throw new SecureStackError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }
  
  return user;
};
```

### Error with Cause

```typescript
const handler = async ({ input, ctx }) => {
  try {
    return await ctx.db.user.create({
      data: input,
    });
  } catch (error) {
    throw new SecureStackError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create user',
      cause: error,
    });
  }
};
```

### Error with Metadata

```typescript
throw new SecureStackError({
  code: 'UNPROCESSABLE_ENTITY',
  message: 'Validation failed',
  meta: {
    fields: {
      email: 'Invalid email format',
      password: 'Password too weak',
    },
  },
});
```

## Handling Errors

### In Handlers

```typescript
const userRouter = router()
  .query('getUser', {
    input: z.object({ id: z.string() }),
    handler: async ({ input, ctx }) => {
      try {
        const user = await ctx.db.user.findUniqueOrThrow({
          where: { id: input.id },
        });
        return user;
      } catch (error) {
        if (error.code === 'P2025') {
          throw new SecureStackError({
            code: 'NOT_FOUND',
            message: `User with ID ${input.id} not found`,
          });
        }
        throw error;
      }
    },
  });
```

### Database Errors

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const handler = async ({ input, ctx }) => {
  try {
    return await ctx.db.user.create({
      data: input,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new SecureStackError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }
    }
    throw error;
  }
};
```

### Validation Errors

```typescript
const handler = async ({ input, ctx }) => {
  // Custom validation beyond Zod
  if (input.age < 18) {
    throw new SecureStackError({
      code: 'UNPROCESSABLE_ENTITY',
      message: 'User must be 18 or older',
      meta: { field: 'age', value: input.age },
    });
  }
  
  return createUser(input);
};
```

## Custom Errors

### Create Custom Error Classes

```typescript
export class UserNotFoundError extends SecureStackError {
  constructor(userId: string) {
    super({
      code: 'NOT_FOUND',
      message: `User with ID ${userId} not found`,
      meta: { userId },
    });
  }
}

export class InsufficientPermissionsError extends SecureStackError {
  constructor(required: string[], actual: string[]) {
    super({
      code: 'FORBIDDEN',
      message: 'Insufficient permissions',
      meta: { required, actual },
    });
  }
}

// Usage
throw new UserNotFoundError(input.id);
throw new InsufficientPermissionsError(['admin'], ['user']);
```

### Domain-Specific Errors

```typescript
export class PaymentError extends SecureStackError {
  constructor(message: string, paymentId?: string) {
    super({
      code: 'UNPROCESSABLE_ENTITY',
      message,
      meta: { paymentId },
    });
  }
}

export class InventoryError extends SecureStackError {
  constructor(productId: string, available: number, requested: number) {
    super({
      code: 'CONFLICT',
      message: 'Insufficient inventory',
      meta: { productId, available, requested },
    });
  }
}
```

## Error Middleware

### Global Error Handler

```typescript
const errorHandlerMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    try {
      return await next();
    } catch (error) {
      // Log error
      ctx.logger.error('Request failed:', {
        error: error.message,
        stack: error.stack,
        path: ctx.path,
      });
      
      // Transform unknown errors
      if (!(error instanceof SecureStackError)) {
        throw new SecureStackError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          cause: error,
        });
      }
      
      throw error;
    }
  });

const app = new SecureStackServer({
  name: 'my-api',
  port: 3000,
});

app.router('api', router()
  .middleware(errorHandlerMiddleware)
  .query('test', { ... })
);
```

### Error Transformation

```typescript
const transformErrorMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    try {
      return await next();
    } catch (error) {
      // Transform Prisma errors
      if (error instanceof PrismaClientKnownRequestError) {
        const errorMap = {
          P2002: { code: 'CONFLICT', message: 'Duplicate entry' },
          P2025: { code: 'NOT_FOUND', message: 'Record not found' },
          P2003: { code: 'BAD_REQUEST', message: 'Foreign key constraint failed' },
        };
        
        const mapped = errorMap[error.code];
        if (mapped) {
          throw new SecureStackError({
            code: mapped.code as any,
            message: mapped.message,
            cause: error,
          });
        }
      }
      
      throw error;
    }
  });
```

### Error Reporting

```typescript
const errorReportingMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    try {
      return await next();
    } catch (error) {
      // Report to error tracking service
      if (error instanceof SecureStackError && error.code === 'INTERNAL_SERVER_ERROR') {
        await ctx.errorReporter.captureException(error, {
          user: ctx.user,
          path: ctx.path,
          input: ctx.input,
        });
      }
      
      throw error;
    }
  });
```

## Client-Side Error Handling

### React Query Error Handling

```typescript
import { useQuery } from '@lemur-bookstores/client/react';

function UserProfile({ userId }: { userId: string }) {
  const { data, error, isError } = useQuery('user.getUser', {
    input: { id: userId },
  });
  
  if (isError) {
    if (error.code === 'NOT_FOUND') {
      return <div>User not found</div>;
    }
    
    if (error.code === 'UNAUTHORIZED') {
      return <div>Please log in to view this profile</div>;
    }
    
    return <div>Error: {error.message}</div>;
  }
  
  return <div>{data?.name}</div>;
}
```

### Mutation Error Handling

```typescript
function CreateUserForm() {
  const createUser = useMutation('user.createUser', {
    onError: (error) => {
      if (error.code === 'CONFLICT') {
        toast.error('Email already exists');
      } else if (error.code === 'UNPROCESSABLE_ENTITY') {
        toast.error('Validation failed: ' + error.message);
      } else {
        toast.error('Failed to create user');
      }
    },
    onSuccess: () => {
      toast.success('User created successfully');
    },
  });
  
  const handleSubmit = async (data: FormData) => {
    try {
      await createUser.mutateAsync(data);
    } catch (error) {
      // Error already handled in onError
      console.error(error);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Global Error Boundary

```typescript
import { SecureStackProvider } from '@lemur-bookstores/client';

function App() {
  return (
    <SecureStackProvider
      client={client}
      onError={(error) => {
        // Global error handler
        console.error('API Error:', error);
        
        if (error.code === 'UNAUTHORIZED') {
          // Redirect to login
          window.location.href = '/login';
        }
      }}
    >
      <YourApp />
    </SecureStackProvider>
  );
}
```

## Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "path": "user.getUser",
    "meta": {
      "userId": "123"
    }
  }
}
```

## Best Practices

### 1. Use Appropriate Error Codes

```typescript
// ✅ Good: Specific error codes
if (!user) {
  throw new SecureStackError({ code: 'NOT_FOUND', message: 'User not found' });
}

if (user.id !== ctx.user.id) {
  throw new SecureStackError({ code: 'FORBIDDEN', message: 'Access denied' });
}

// ❌ Bad: Generic errors
throw new Error('Something went wrong');
```

### 2. Provide Helpful Messages

```typescript
// ✅ Good: Clear, actionable message
throw new SecureStackError({
  code: 'UNPROCESSABLE_ENTITY',
  message: 'Password must be at least 8 characters and contain a number',
});

// ❌ Bad: Vague message
throw new SecureStackError({
  code: 'BAD_REQUEST',
  message: 'Invalid input',
});
```

### 3. Include Context

```typescript
// ✅ Good: Include relevant context
throw new SecureStackError({
  code: 'CONFLICT',
  message: 'Email already registered',
  meta: { email: input.email },
});

// ❌ Bad: No context
throw new SecureStackError({
  code: 'CONFLICT',
  message: 'Duplicate entry',
});
```

### 4. Don't Expose Sensitive Information

```typescript
// ✅ Good: Safe error message
throw new SecureStackError({
  code: 'UNAUTHORIZED',
  message: 'Invalid credentials',
});

// ❌ Bad: Exposes information
throw new SecureStackError({
  code: 'UNAUTHORIZED',
  message: 'Password incorrect for user@example.com',
});
```

## Next Steps

- [Learn about Middleware](./middleware.md)
- [Explore Context](./context.md)
- [See Authentication Examples](../auth/setup.md)
- [View Complete Examples](../examples/basic-crud.md)
