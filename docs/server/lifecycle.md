# Server Lifecycle

SecureStackServer provides a set of lifecycle hooks that allow you to execute code at specific points in the server's life. This is useful for database connections, cleanup, service registration, and more.

## Available Hooks

| Hook | Description |
|------|-------------|
| `onStart` | Called before the server starts listening. Ideal for DB connections. |
| `onReady` | Called after the server is listening. Ideal for service registration. |
| `onShutdown` | Called when the server receives a termination signal. Ideal for cleanup. |

## Usage

You can register hooks using the `hook` method or by passing them in the constructor options (if extending).

```typescript
const app = new SecureStackServer({
  name: 'my-service',
  port: 3000,
});

// 1. onStart: Initialize resources
app.hook('onStart', async () => {
  console.log('🔌 Connecting to database...');
  await prisma.$connect();
  console.log('✅ Database connected');
});

// 2. onReady: Register service
app.hook('onReady', async () => {
  const address = app.server.server.address();
  console.log(`🚀 Server running on port ${address.port}`);
  
  // Example: Notify a monitoring service
  await notifyMonitoring('UP');
});

// 3. onShutdown: Cleanup
app.hook('onShutdown', async () => {
  console.log('🛑 Shutting down...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
});

await app.start();
```

## Graceful Shutdown

SecureStack automatically handles `SIGINT` and `SIGTERM` signals. When received:

1.  The server stops accepting new connections.
2.  The `onShutdown` hooks are executed in order.
3.  The process exits with code 0.

To trigger a shutdown manually:

```typescript
await app.stop();
```

## Error Handling in Hooks

If an error occurs in `onStart`, the server will fail to start and throw the error.
If an error occurs in `onShutdown`, it will be logged, but the shutdown process will continue.

```typescript
app.hook('onStart', async () => {
  try {
    await db.connect();
  } catch (err) {
    console.error('Fatal: Could not connect to DB');
    throw err; // Prevents server start
  }
});
```
