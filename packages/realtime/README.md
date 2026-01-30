# @lemur-bookstores/secure-stack-realtime

Realtime module for SecureStack using Socket.io.

## Features

- 🔌 **Socket.io Wrapper**: Simplified API for managing socket connections.
- 🚀 **Redis Adapter**: Built-in support for horizontal scaling using Redis.
- 🔒 **Authentication**: Middleware for JWT-based socket authentication.
- 📡 **Namespaces & Rooms**: Easy management of channels and groups.

## Installation

```bash
npm install @lemur-bookstores/secure-stack-realtime
```

## Usage

### Basic Setup

```typescript
import { RealtimeManager } from '@lemur-bookstores/secure-stack-realtime';
import { createServer } from 'http';

const httpServer = createServer();
const realtime = new RealtimeManager({
  cors: { origin: '*' }
}, httpServer);

httpServer.listen(3000);
```

### Authentication

```typescript
import { socketAuthMiddleware } from '@lemur-bookstores/secure-stack-realtime';

const realtime = new RealtimeManager();
const io = realtime.getServer();

io.use(socketAuthMiddleware({
  verify: async (token) => {
    // Verify token and return user
    return { id: 'user-123' };
  }
}));
```

### Sending Events

```typescript
// To all
realtime.emit({ event: 'notification', data: { message: 'Hello' } });

// To room
realtime.emit({ event: 'chat', data: 'Hi', room: 'room-1' });

// To namespace
realtime.emit({ event: 'alert', data: 'Warning', namespace: '/admin' });
```

### Redis Scaling

```typescript
const realtime = new RealtimeManager({
  redis: {
    host: 'localhost',
    port: 6379
  }
});
```
