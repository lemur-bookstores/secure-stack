# Session Management

## Overview

The mesh package provides robust session management for tracking and securing service-to-service communications. Sessions maintain state between services and enable features like sliding expiration and session tracking.

## Session Lifecycle

### 1. Session Creation

Sessions are automatically created during the handshake process:

```typescript
// Server side - automatic session creation
const server = new SecureMeshServer('my-service');
await server.start(50051);

// Client connects and session is created
const client = mesh.connect('my-service');
await client.call('greet', { name: 'World' });
```

### 2. Session Management

```typescript
import { SessionManager } from '@lemur-bookstores/mesh';

const sessionManager = new SessionManager(3600000);  // 1 hour TTL

// Create session
const session = sessionManager.createSession(
  'client-service',
  sessionKey,
  { metadata: 'custom-data' }
);

// Get session
const retrieved = sessionManager.getSession(session.id);

// Get by service ID
const byService = sessionManager.getSessionByServiceId('client-service');

// Invalidate session
sessionManager.invalidateSession(session.id);

// Cleanup expired sessions
sessionManager.cleanupExpiredSessions();
```

### 3. Session Properties

```typescript
interface Session {
  id: string;              // Unique session ID (UUID)
  serviceId: string;       // Remote service identifier
  sessionKey: Buffer;      // Shared AES-256 encryption key
  createdAt: number;       // Creation timestamp
  lastActivity: number;    // Last activity timestamp
  expiresAt: number;       // Expiration timestamp
  metadata?: Record<string, any>;  // Custom metadata
}
```

## Configuration

### Session Timeout

```typescript
const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50051,
  security: {
    sessionTimeout: 7200000  // 2 hours
  }
});
```

### Sliding Expiration

Sessions use sliding expiration - each activity extends the session:

```typescript
// Session created at T=0, expires at T=1h
const session = sessionManager.getSession(sessionId);

// Activity at T=30min
// Session now expires at T=30min + 1h = T=1h30min
```

## Use Cases

### 1. Long-Running Connections

```typescript
// Maintain persistent connections between services
const dataSync = new SecureMesh({
  serviceId: 'data-sync-service',
  port: 50051,
  security: {
    sessionTimeout: 86400000  // 24 hours for long-running sync
  }
});
```

### 2. Short-Lived Sessions

```typescript
// Quick request-response patterns
const apiGateway = new SecureMesh({
  serviceId: 'api-gateway',
  port: 50051,
  security: {
    sessionTimeout: 300000  // 5 minutes
  }
});
```

### 3. Session Metadata Tracking

```typescript
// Track additional session information
const sessionManager = new SessionManager(3600000);

const session = sessionManager.createSession(
  'mobile-app',
  sessionKey,
  {
    userId: 'user-123',
    deviceId: 'device-456',
    ipAddress: '192.168.1.1',
    userAgent: 'MobileApp/1.0'
  }
);

// Later, retrieve metadata
const retrieved = sessionManager.getSession(session.id);
console.log(retrieved.metadata.userId);  // 'user-123'
```

### 4. Session Monitoring

```typescript
// Monitor active sessions
const stats = mesh.getStats();
console.log('Active sessions:', stats.sessions.activeSessions);

// Cleanup expired sessions periodically
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 300000);  // Every 5 minutes
```

### 5. Session-Based Rate Limiting

```typescript
// Rate limit per session
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000
});

async function handleRequest(sessionId: string) {
  const session = sessionManager.getSession(sessionId);
  if (!session) {
    throw new Error('Invalid session');
  }
  
  const limit = await rateLimiter.checkLimit(session.serviceId);
  if (!limit.allowed) {
    throw new Error('Rate limit exceeded');
  }
  
  // Process request
}
```

## Best Practices

### 1. Appropriate Timeouts

```typescript
// Match timeout to use case
const configs = {
  // Real-time APIs
  realtime: { sessionTimeout: 300000 },      // 5 minutes
  
  // Standard APIs
  standard: { sessionTimeout: 3600000 },     // 1 hour
  
  // Background jobs
  background: { sessionTimeout: 86400000 },  // 24 hours
  
  // Batch processing
  batch: { sessionTimeout: 604800000 }       // 7 days
};
```

### 2. Session Cleanup

```typescript
// Regular cleanup to prevent memory leaks
class SessionCleanupService {
  constructor(private sessionManager: SessionManager) {
    setInterval(() => this.cleanup(), 300000);  // Every 5 minutes
  }
  
  private cleanup() {
    const before = this.sessionManager.getStats().activeSessions;
    this.sessionManager.cleanupExpiredSessions();
    const after = this.sessionManager.getStats().activeSessions;
    
    console.log(`Cleaned up ${before - after} expired sessions`);
  }
}
```

### 3. Session Security

```typescript
// Validate sessions on every request
async function validateSession(sessionId: string): Promise<Session> {
  const session = sessionManager.getSession(sessionId);
  
  if (!session) {
    throw new Error('Session not found or expired');
  }
  
  // Additional validation
  if (session.metadata?.revoked) {
    sessionManager.invalidateSession(sessionId);
    throw new Error('Session has been revoked');
  }
  
  return session;
}
```

### 4. Graceful Session Termination

```typescript
// Cleanup on service shutdown
async function shutdown() {
  console.log('Shutting down...');
  
  // Get all active sessions
  const stats = mesh.getStats();
  console.log(`Terminating ${stats.sessions.activeSessions} sessions`);
  
  // Cleanup
  await mesh.cleanup();
  
  console.log('Shutdown complete');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

## Session Statistics

```typescript
// Get session statistics
const stats = sessionManager.getStats();
console.log(stats);
// {
//   activeSessions: 42
// }

// Get detailed session info
const session = sessionManager.getSession(sessionId);
console.log({
  id: session.id,
  serviceId: session.serviceId,
  age: Date.now() - session.createdAt,
  timeUntilExpiry: session.expiresAt - Date.now(),
  idle: Date.now() - session.lastActivity
});
```

## Integration with Other Features

### With Rate Limiting

```typescript
// Rate limit per session
const server = new SecureMeshServer(
  'my-service',
  './keys',
  {
    maxRequests: 1000,
    windowMs: 60000
  }
);

// Server automatically uses session.serviceId for rate limiting
```

### With Monitoring

```typescript
// Log session events
const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50051,
  monitoring: {
    enabled: true,
    adapters: [new SessionMonitoringAdapter()]
  }
});

class SessionMonitoringAdapter implements MonitoringAdapter {
  async logEvent(event: MeshAuditEvent): Promise<void> {
    if (event.eventType === 'connection') {
      console.log(`Session created for ${event.serviceId}`);
    }
  }
}
```

### With Health Checks

```typescript
// Include session health in health checks
healthMonitor.registerCheck({
  name: 'sessions',
  check: async () => {
    const stats = sessionManager.getStats();
    const healthy = stats.activeSessions < 1000;  // Threshold
    
    return {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      details: { activeSessions: stats.activeSessions }
    };
  }
});
```
