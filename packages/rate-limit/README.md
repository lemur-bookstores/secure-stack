# @lemur-bookstores/secure-stack-rate-limit

Rate Limiting module for SecureStack.

## Features

- Fixed Window algorithm
- Memory Store (built-in)
- Redis Store support
- SQLite Store support
- Middleware integration
- Custom key generators
- Configurable headers and status codes

## Usage

```typescript
import { rateLimitMiddleware, MemoryStore } from '@lemur-bookstores/secure-stack-rate-limit';

const limiter = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  store: new MemoryStore(15 * 60 * 1000), // Optional, defaults to MemoryStore
});

// Apply to router or app
app.use(limiter);
```

## Configuration

| Option | Type | Default | Description |
|Str | --- | --- | --- |
| windowMs | number | 60000 | Time frame for which requests are checked/remembered. |
| max | number | 5 | Max number of connections during windowMs before sending a 429 response. |
| message | string | "Too many requests..." | Error message sent to user when max is exceeded. |
| statusCode | number | 429 | HTTP status code returned when max is exceeded. |
| headers | boolean | true | Enable headers for request limit (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset). |
| keyGenerator | function | (req) => req.ip | Function used to generate keys. |
| store | RateLimitStore | MemoryStore | The storage to use for storing request counts. |
