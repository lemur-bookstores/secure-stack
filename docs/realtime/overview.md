# Realtime Module

The `@lemur-bookstores/secure-stack-realtime` module provides a robust, scalable WebSocket solution built on top of [Socket.io](https://socket.io/) and [Redis](https://redis.io/).

## Features

- **Socket.io Integration**: Full compatibility with the Socket.io ecosystem.
- **Horizontal Scaling**: Built-in Redis Adapter for multi-instance deployments.
- **Automatic Authentication**: Seamless integration with `@lemur-bookstores/secure-stack-auth`.
- **Type-Safe Events**: (Coming soon) Typed events for client-server communication.
- **Provider Injection**: Access the `RealtimeManager` from any route via `ctx.realtime`.

## Installation

```bash
npm install @lemur-bookstores/secure-stack-realtime
```

## Usage

### Server Setup

```typescript
import { SecureStackServer } from '@lemur-bookstores/secure-stack-server';
import { useRealtime } from '@lemur-bookstores/secure-stack-realtime';

const app = new SecureStackServer({
  /* config */
});

// Initialize Realtime with Redis
useRealtime(app, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
  },
});

await app.start();
```

### Using in Routes

```typescript
app.router(
  'chat',
  router().mutation('send', {
    input: z.object({ text: z.string() }),
    handler: async ({ input, ctx }) => {
      // Broadcast to all clients
      ctx.realtime.emit({
        event: 'message',
        data: { text: input.text },
      });
      return { success: true };
    },
  })
);
```

## Configuration

| Option  | Type      | Description              | Default           |
| :------ | :-------- | :----------------------- | :---------------- |
| `redis` | `object`  | Redis connection config  | `undefined`       |
| `cors`  | `object`  | CORS configuration       | `{ origin: '*' }` |
| `path`  | `string`  | Socket.io path           | `'/socket.io'`    |
| `auth`  | `boolean` | Enable/Disable auto-auth | `true`            |

## Architecture

The module uses the **Provider Pattern** to inject the `RealtimeManager` into the SecureStack context. It automatically detects if the Auth module is present and configures the `socketAuthMiddleware` to secure your WebSocket connections using the same JWT tokens as your HTTP API.
