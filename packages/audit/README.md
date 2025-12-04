# @lemur-bookstores/audit

Audit logging module for SecureStack.

## Features

- Event logging with structured data
- Automatic sensitive data masking
- Multiple storage adapters (Console, File, Database)
- Query interface for retrieving audit logs
- Middleware integration
- Configurable retention policies

## Usage

### Basic Setup

```typescript
import { AuditLogger, ConsoleAdapter, FileAdapter } from '@lemur-bookstores/audit';

const logger = new AuditLogger({
  adapters: [new ConsoleAdapter(), new FileAdapter('./logs/audit.log')],
  maskFields: ['password', 'token', 'secret', 'creditCard'],
});

// Log an event
await logger.log('user.login', { id: 'user-123', ip: '192.168.1.1' }, 'success');
```

### With Middleware

```typescript
import { auditMiddleware } from '@lemur-bookstores/audit';

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
import { FileAdapter } from '@lemur-bookstores/audit';

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
import { DatabaseAdapter } from '@lemur-bookstores/audit';

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

## Custom Adapters

Implement the `AuditAdapter` interface:

```typescript
import { AuditAdapter, AuditEvent } from '@lemur-bookstores/audit';

class DatabaseAdapter implements AuditAdapter {
  async log(event: AuditEvent): Promise<void> {
    await db.auditLogs.create({ data: event });
  }

  async query(params: AuditQueryParams): Promise<AuditEvent[]> {
    return db.auditLogs.findMany({ where: params });
  }
}
```
