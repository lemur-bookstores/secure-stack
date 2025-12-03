# Advanced Example

This example demonstrates advanced features of the SecureStack framework.

## Features Demonstrated

- ✅ **Error handling middleware** - Automatic error catching and formatting
- ✅ **Logger middleware** - Request/response logging
- ✅ **Custom middleware** - Adding request IDs
- ✅ **Input validation** - Using Zod schemas
- ✅ **Custom error handling** - Using SecureStackError
- ✅ **Type-safe procedures** - Full TypeScript support

## Running the example

```bash
# From the root of the monorepo
npm install

# Run the example
npm run dev --workspace=examples/advanced
```

## Code Structure

```typescript
// Use built-in middlewares
app.use(errorHandler());
app.use(logger());

// Custom middleware
app.use(async (ctx, next) => {
  ctx.requestId = generateId();
  await next();
});

// Define procedures with validation
const userRouter = router()
  .query('getById', {
    input: z.string().uuid(),
    handler: async ({ input }) => {
      // Handler logic
    }
  });
```

## Error Handling

The example shows different types of errors:

- `SecureStackError.notFound()` - 404 errors
- `SecureStackError.conflict()` - 409 errors  
- `SecureStackError.forbidden()` - 403 errors

All errors are automatically caught by the error handler middleware and formatted consistently.
