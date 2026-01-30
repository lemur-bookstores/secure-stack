# @lemur-bookstores/secure-stack-audit

Audit logging module for SecureStack.

## Features

- Event logging with structured data
- Automatic sensitive data masking
- Multiple storage adapters (Console, File, Database, HTTP)
- Query interface for retrieving audit logs
- Middleware integration
- Configurable retention policies

## Usage

### Basic Setup

```typescript
import { AuditLogger, ConsoleAdapter, FileAdapter } from '@lemur-bookstores/secure-stack-audit';

const logger = new AuditLogger({
  adapters: [new ConsoleAdapter(), new FileAdapter('./logs/audit.log')],
  maskFields: ['password', 'token', 'secret', 'creditCard'],
});

// Log an event
await logger.log('user.login', { id: 'user-123', ip: '192.168.1.1' }, 'success');
```

### With Middleware

```typescript
import { auditMiddleware } from '@lemur-bookstores/secure-stack-audit';

const audit = auditMiddleware({
  logger,
  extractActor: (ctx) => ({
    id: ctx.user.id,
    type: 'user',
    ip: ctx.ip,
  }),
  extractResource: (ctx) =>
    ctx.resource
      ? {
          type: ctx.resource.type,
          id: ctx.resource.id,
        }
      : undefined,
});

app.use(audit);
```

### Querying Logs

```typescript
import { FileAdapter } from '@lemur-bookstores/secure-stack-audit';

const fileAdapter = new FileAdapter('./logs/audit.log');

const events = await fileAdapter.query({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  action: 'user.login',
  status: 'failure',
  limit: 50,
});
```

## Configuration

| Option        | Type           | Description                                                           |
| ------------- | -------------- | --------------------------------------------------------------------- |
| adapters      | AuditAdapter[] | Storage adapters for audit events                                     |
| enabled       | boolean        | Enable/disable logging (default: true)                                |
| maskFields    | string[]       | Fields to mask in logs (default: password, token, secret, creditCard) |
| retentionDays | number         | Days to retain logs (adapter-specific)                                |

## Adapters

### ConsoleAdapter

Logs events to console output.

### FileAdapter

Logs events to a JSON Lines file with query support.

```typescript
const adapter = new FileAdapter('./audit.log');
```

### DatabaseAdapter

Database-agnostic adapter for storing audit logs. Works with any database by providing a client interface.

```typescript
import { DatabaseAdapter } from '@lemur-bookstores/secure-stack-audit';

// Example with Prisma
const prismaClient = {
  insert: async (table: string, data: any) => {
    await prisma.auditLog.create({ data });
  },
  query: async (table: string, filters: any, options?: any) => {
    return prisma.auditLog.findMany({
      where: filters,
      take: options?.limit,
      skip: options?.offset,
    });
  },
};

const adapter = new DatabaseAdapter({
  client: prismaClient,
  tableName: 'audit_logs',
});

// Example with Drizzle ORM
const drizzleClient = {
  insert: async (table: string, data: any) => {
    await db.insert(auditLogs).values(data);
  },
  query: async (table: string, filters: any, options?: any) => {
    return db.select().from(auditLogs).where(filters).limit(options?.limit).offset(options?.offset);
  },
};

// Example with raw SQL
const sqlClient = {
  insert: async (table: string, data: any) => {
    await pool.query(\`INSERT INTO \${table} ...\`, Object.values(data));
  },
  query: async (table: string, filters: any, options?: any) => {
    return pool.query(\`SELECT * FROM \${table} WHERE ...\`);
  },
};
```

### HttpAdapter

Send audit logs to external services via HTTP/REST APIs. Perfect for cloud logging services (Datadog, Sentry, custom APIs).

```typescript
import { HttpAdapter } from '@lemur-bookstores/secure-stack-audit';

// Example with Bearer token authentication
const httpAdapter = new HttpAdapter({
  endpoint: 'https://api.example.com/audit-logs',
  auth: {
    type: 'bearer',
    token: process.env.API_TOKEN,
  },
});

// Example with Basic authentication
const basicAuthAdapter = new HttpAdapter({
  endpoint: 'https://api.example.com/logs',
  auth: {
    type: 'basic',
    username: 'admin',
    password: process.env.API_PASSWORD,
  },
});

// Example with API Key
const apiKeyAdapter = new HttpAdapter({
  endpoint: 'https://api.service.com/v1/logs',
  auth: {
    type: 'api-key',
    apiKey: process.env.SERVICE_API_KEY,
    headerName: 'X-Service-Key', // Optional, defaults to 'X-API-Key'
  },
});

// Example with Datadog
const datadogAdapter = new HttpAdapter({
  endpoint: 'https://http-intake.logs.datadoghq.com/v1/input',
  auth: {
    type: 'api-key',
    apiKey: process.env.DATADOG_API_KEY!,
    headerName: 'DD-API-KEY',
  },
  mapEvent: (event) => ({
    service: 'my-app',
    ddsource: 'audit',
    hostname: 'server-1',
    message: `${event.action} by ${event.actor.id}`,
    ...event,
  }),
});

// Example with custom authentication header
const customAuthAdapter = new HttpAdapter({
  endpoint: 'https://custom-service.com/logs',
  auth: {
    type: 'custom',
    customHeader: {
      name: 'X-Custom-Auth',
      value: `Token ${process.env.CUSTOM_TOKEN}`,
    },
  },
});

// Example with custom HTTP client (axios)
const axiosAdapter = new HttpAdapter({
  endpoint: 'https://api.example.com/logs',
  auth: {
    type: 'bearer',
    token: process.env.API_TOKEN,
  },
  client: {
    post: async (url, data, headers) => {
      return axios.post(url, data, { headers });
    },
  },
});
```

## Custom Adapters

Implement the `AuditAdapter` interface:

```typescript
import { AuditAdapter, AuditEvent } from '@lemur-bookstores/secure-stack-audit';

class DatabaseAdapter implements AuditAdapter {
  async log(event: AuditEvent): Promise<void> {
    await db.auditLogs.create({ data: event });
  }

  async query(params: AuditQueryParams): Promise<AuditEvent[]> {
    return db.auditLogs.findMany({ where: params });
  }
}
```
