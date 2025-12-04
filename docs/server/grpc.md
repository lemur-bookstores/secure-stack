# gRPC Integration

SecureStack includes a powerful gRPC adapter for high-performance microservices communication. It allows you to define your API using TypeScript routers and automatically exposes them as gRPC services.

## Features

- **Automatic Proto Generation**: No need to write `.proto` files manually
- **Type Safety**: Full TypeScript support for gRPC handlers
- **Streaming**: Support for server-side streaming (subscriptions)
- **Metadata**: Easy access to gRPC metadata
- **Reflection**: Built-in gRPC reflection support

## Setup

The gRPC adapter is optional. Enable it in your server configuration.

```typescript
import { SecureStackServer, router } from '@lemur-bookstores/server';
import { z } from 'zod';

const app = new SecureStackServer({
  name: 'grpc-service',
  port: 50051, // Standard gRPC port
  grpc: {
    enabled: true,
    protoPath: './proto/service.proto', // Output path for generated proto
  },
});

const serviceRouter = router()
  .query('getUser', {
    input: z.object({ id: z.string() }),
    handler: async ({ input }) => {
      return { id: input.id, name: 'John Doe' };
    },
  });

app.router('UserService', serviceRouter);

await app.start();
```

## Mapping Concepts

SecureStack maps concepts to gRPC as follows:

| SecureStack | gRPC |
|-------------|------|
| Router | Service |
| Query | Unary Call |
| Mutation | Unary Call |
| Subscription | Server Streaming |
| Input (Zod) | Message Type |
| Output | Message Type |

## Defining Services

### Unary Calls (Request/Response)

```typescript
const mathRouter = router()
  .query('add', {
    input: z.object({ a: z.number(), b: z.number() }),
    handler: async ({ input }) => {
      return { result: input.a + input.b };
    },
  });
```

### Server Streaming

Use generators for streaming responses:

```typescript
const streamRouter = router()
  .subscription('countdown', {
    input: z.object({ start: z.number() }),
    handler: async function* ({ input }) {
      for (let i = input.start; i >= 0; i--) {
        yield { count: i };
        await new Promise(r => setTimeout(r, 1000));
      }
    },
  });
```

## Client Usage

You can use any standard gRPC client to connect to your SecureStack server.

### Node.js Client

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('./proto/service.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

const client = new proto.UserService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

client.getUser({ id: '123' }, (err, response) => {
  console.log(response);
});
```

### SecureStack Mesh Client

The easiest way to connect is using the built-in Mesh client:

```typescript
import { SecureStackServer } from '@lemur-bookstores/server';

const app = new SecureStackServer({
  // ...
  mesh: { enabled: true }
});

// Type-safe call
const user = await app.mesh.call('user-service', 'getUser', { id: '123' });
```

## Metadata & Context

Access gRPC metadata through the context:

```typescript
const router = router()
  .query('meta', {
    handler: ({ ctx }) => {
      // Access metadata
      const token = ctx.metadata.get('authorization')[0];
      
      // Set outgoing metadata
      ctx.metadata.set('x-server-time', new Date().toISOString());
      
      return { received: true };
    },
  });
```

## Error Handling

SecureStack errors are mapped to gRPC status codes:

| Error Code | gRPC Status |
|------------|-------------|
| BAD_REQUEST | INVALID_ARGUMENT (3) |
| UNAUTHORIZED | UNAUTHENTICATED (16) |
| FORBIDDEN | PERMISSION_DENIED (7) |
| NOT_FOUND | NOT_FOUND (5) |
| CONFLICT | ALREADY_EXISTS (6) |
| INTERNAL_SERVER_ERROR | INTERNAL (13) |

## Limitations

- **Client Streaming**: Not currently supported via the high-level Router API.
- **Bidirectional Streaming**: Not currently supported via the high-level Router API.
- **Complex Types**: Zod types must be compatible with Protocol Buffers (e.g., no `union` types, limited `any` support).

## Generated Proto Example

The above configuration would generate a proto file similar to:

```protobuf
syntax = "proto3";

package UserService;

service UserService {
  rpc GetUser (GetUserRequest) returns (GetUserResponse);
}

message GetUserRequest {
  string id = 1;
}

message GetUserResponse {
  string id = 1;
  string name = 2;
}
```
