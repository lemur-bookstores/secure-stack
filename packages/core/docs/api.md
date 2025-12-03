# @lemur-bookstores/core API Reference

## Table of Contents

- [SecureStack](#securestack)
- [Router](#router)
- [Context](#context)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Types](#types)

---

## SecureStack

The main class for creating a SecureStack application.

### Constructor

```typescript
new SecureStack(config: SecureStackConfig)
```

**Parameters:**
- `config`: Configuration object
  - `name`: Service name
  - `port`: Port number
  - `type`: `ServiceType.Microservice` | `ServiceType.Gateway`
  - `mesh`: Optional mesh configuration

### Methods

#### `router(name: string, router: Router): this`
Registers a router with the given name.

#### `use(middleware: MiddlewareFunction): this`
Adds a global middleware to the application.

#### `setContextFactory(factory: (initial?) => TContext): this`
Sets the factory function for creating the request context.

#### `start(): Promise<void>`
Starts the server.

#### `stop(): Promise<void>`
Stops the server.

---

## Router

Builder for defining API procedures.

### `router()`
Creates a new router builder.

### Methods

#### `query(name: string, config: ProcedureConfig): this`
Defines a query procedure (read-only).

#### `mutation(name: string, config: ProcedureConfig): this`
Defines a mutation procedure (write operations).

#### `subscription(name: string, config: ProcedureConfig): this`
Defines a subscription procedure (real-time).

#### `middleware(fn: MiddlewareFunction): this`
Adds a middleware specific to this router.

---

## Context

System for passing state through the request lifecycle.

### `createContext<T>(factory?: (initial?) => T)`
Creates a context builder with an optional factory function.

**Returns:**
- `create(initial?)`: Creates a new context instance
- `extend(extension)`: Creates a new builder with extended context

---

## Middleware

Middleware system based on the "onion" model (like Koa).

### Type Definition

```typescript
type MiddlewareFunction<T> = (ctx: T, next: () => Promise<void>) => Promise<void> | void;
```

### Built-in Middleware

#### `logger()`
Logs request start, end, and duration.

#### `errorHandler()`
Catches errors and formats them as standard responses.

#### `cors(options?)`
Adds CORS headers.

---

## Error Handling

Standardized error system.

### `SecureStackError`

Base error class.

**Static Methods:**
- `badRequest(message, meta?)` - 400
- `unauthorized(message, meta?)` - 401
- `forbidden(message, meta?)` - 403
- `notFound(message, meta?)` - 404
- `validationError(message, meta?)` - 422
- `internal(message, cause?, meta?)` - 500

### `ErrorCode`
Enum with standard error codes.

---

## Types

### `ServiceType`
- `Microservice`
- `Gateway`

### `EncryptionMode`
- `Hybrid`
- `TLS`
- `None`

### `DiscoveryMode`
- `Static`
- `DNS`
- `Consul`
- `Etcd`
