# Security Best Practices

SecureStack is secure by default, but building a secure application requires adherence to best practices across the entire stack.

## 1. Input Validation

Never trust user input. SecureStack enforces Zod validation for all inputs, but ensure your schemas are strict.

```typescript
// ❌ Weak validation
z.object({
  email: z.string(),
  age: z.number(),
})

// ✅ Strong validation
z.object({
  email: z.string().email().max(255),
  age: z.number().int().min(18).max(120),
})
```

## 2. Authentication & Authorization

- **Use HTTPS**: Never transmit credentials over HTTP.
- **Short-lived Tokens**: Access tokens should expire quickly (e.g., 15 mins).
- **Rotation**: Rotate refresh tokens and signing keys regularly.
- **Least Privilege**: Grant users the minimum permissions required (RBAC).

## 3. Rate Limiting

Protect your API from abuse and DDoS attacks.

```typescript
import rateLimit from '@fastify/rate-limit';

await app.server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'], // Allow internal services
});
```

## 4. Security Headers (Helmet)

Use `@fastify/helmet` to set secure HTTP headers.

```typescript
import helmet from '@fastify/helmet';

await app.server.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // ... customize for your app
    },
  },
});
```

## 5. Data Protection

- **Sanitize Data**: Sanitize HTML input to prevent XSS if rendering user content.
- **Parameter Pollution**: Be aware of HTTP parameter pollution attacks.
- **NoSQL Injection**: Validate inputs before passing them to database queries (Prisma handles SQL injection, but logic flaws can still exist).

## 6. Error Handling

Never leak sensitive information in error messages.

```typescript
// ❌ Bad: Leaking stack trace or internal details
throw new Error('Database connection failed: ' + err.message);

// ✅ Good: Generic error for client, detailed log for server
logger.error(err);
throw new SecureStackError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Something went wrong',
});
```

## 7. Dependency Management

- **Audit**: Run `npm audit` or `pnpm audit` regularly.
- **Updates**: Keep dependencies up to date.
- **Lockfile**: Always commit your lockfile (`pnpm-lock.yaml`) to ensure consistent builds.

## 8. Service Mesh Security

- **mTLS**: Ensure mutual authentication is enabled in the mesh config.
- **Firewall**: Restrict access to internal service ports to only the mesh network.
