# Monitoring and Observability

## Overview

The mesh package provides comprehensive monitoring capabilities to track service health, performance, and security events. This enables proactive issue detection and debugging in production environments.

## Audit Logging

### Purpose

Track security-critical events and service interactions for compliance, debugging, and security analysis.

### Configuration

```typescript
import { SecureMesh } from '@lemur-bookstores/secure-stack-mesh';
import { ConsoleAdapter } from './adapters/ConsoleAdapter';

const mesh = new SecureMesh({
  serviceId: 'user-service',
  port: 50051,
  monitoring: {
    enabled: true,
    adapters: [
      new ConsoleAdapter(),
      // new FileAdapter('./logs'),
      // new ElasticsearchAdapter(config)
    ]
  }
});
```

### Event Types

The audit logger tracks the following events:

- `connection`: Service connections and disconnections
- `message`: Message exchanges between services
- `key_rotation`: Cryptographic key rotation events
- `rate_limit`: Rate limit violations
- `circuit_breaker`: Circuit breaker state changes
- `error`: Error events
- `system`: System-level events (startup, shutdown)

### Use Cases

#### 1. Security Audit Trail

```typescript
// Track all security events for compliance
const financialService = new SecureMesh({
  serviceId: 'financial-service',
  port: 50051,
  monitoring: {
    enabled: true,
    adapters: [
      new FileAdapter('./audit-logs', {
        rotation: 'daily',
        retention: 90  // Keep logs for 90 days
      })
    ]
  }
});

// Events are automatically logged:
// - Service connections
// - Key rotations
// - Authentication attempts
// - Rate limit violations
```

#### 2. Debugging Service Interactions

```typescript
// Debug complex service interactions
const orderService = new SecureMesh({
  serviceId: 'order-service',
  port: 50051,
  monitoring: {
    enabled: true,
    adapters: [
      new ConsoleAdapter({ level: 'debug' }),
      new ElasticsearchAdapter({
        node: 'http://localhost:9200',
        index: 'mesh-audit-logs'
      })
    ]
  }
});

// View logs in real-time or query Elasticsearch
```

#### 3. Performance Monitoring

```typescript
// Track message latency and throughput
const apiGateway = new SecureMesh({
  serviceId: 'api-gateway',
  port: 50051,
  monitoring: {
    enabled: true,
    adapters: [
      new MetricsAdapter({
        interval: 60000,  // Aggregate every minute
        destination: 'prometheus'
      })
    ]
  }
});
```

### Custom Monitoring Adapter

Create custom adapters for your monitoring infrastructure:

```typescript
import { MonitoringAdapter, MeshAuditEvent } from '@lemur-bookstores/secure-stack-mesh';

class DatadogAdapter implements MonitoringAdapter {
  async logEvent(event: MeshAuditEvent): Promise<void> {
    // Send to Datadog
    await datadogClient.log({
      service: event.serviceId,
      message: event.details.action,
      level: event.eventType === 'error' ? 'error' : 'info',
      timestamp: event.timestamp,
      tags: [`event_type:${event.eventType}`]
    });
  }
}

const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50051,
  monitoring: {
    enabled: true,
    adapters: [new DatadogAdapter()]
  }
});
```

## Metrics Collection

### Purpose

Collect and expose service metrics for monitoring dashboards and alerting.

### Available Metrics

```typescript
const stats = mesh.getStats();
console.log(stats);
// {
//   service: 'my-service',
//   sessions: {
//     activeSessions: 5
//   },
//   connectedServices: ['user-service', 'payment-service'],
//   metrics: {
//     messagesSent: 1000,
//     messagesFailed: 5,
//     messagesReceived: 950,
//     connectionsSuccessful: 10,
//     connectionsFailed: 1,
//     averageLatency: 45,  // ms
//     circuitBreakerState: 'closed'
//   }
// }
```

### Use Cases

#### 1. Prometheus Integration

```typescript
import express from 'express';
import { register } from 'prom-client';

const app = express();
const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50051
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  const stats = mesh.getStats();
  
  // Convert to Prometheus format
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});

app.listen(9090);
```

#### 2. Health Dashboard

```typescript
// Real-time health monitoring
setInterval(async () => {
  const health = await mesh.healthCheck();
  
  console.log('Service Health:', health.status);
  console.log('Connected Services:', health.services);
  console.log('Health Checks:', health.details.checks);
  console.log('Metrics:', health.details.metrics);
}, 5000);
```

#### 3. Alerting

```typescript
// Alert on high error rate
setInterval(async () => {
  const stats = mesh.getStats();
  const errorRate = stats.metrics.messagesFailed / stats.metrics.messagesSent;
  
  if (errorRate > 0.05) {  // 5% error rate
    await alerting.send({
      severity: 'warning',
      message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
      service: stats.service
    });
  }
}, 60000);
```

## Health Monitoring

### Purpose

Continuously monitor service health and dependencies to detect issues early.

### Configuration

```typescript
const mesh = new SecureMesh({
  serviceId: 'my-service',
  port: 50051
});

await mesh.initialize();

// Health checks are automatically registered
// - mesh-core: Core mesh functionality
// - crypto: Cryptographic operations
// - discovery: Service discovery
```

### Custom Health Checks

```typescript
import { HealthMonitor } from '@lemur-bookstores/secure-stack-mesh';

const healthMonitor = new HealthMonitor();

// Add custom health check
healthMonitor.registerCheck({
  name: 'database',
  check: async () => {
    try {
      await db.ping();
      return { status: 'healthy', timestamp: new Date() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        timestamp: new Date(),
        error: error.message 
      };
    }
  }
});

healthMonitor.start();
```

### Use Cases

#### 1. Kubernetes Liveness Probe

```typescript
import express from 'express';

const app = express();

app.get('/health/live', async (req, res) => {
  const health = await mesh.healthCheck();
  
  if (health.status === 'healthy') {
    res.status(200).json(health);
  } else {
    res.status(503).json(health);
  }
});

app.listen(8080);
```

#### 2. Readiness Probe

```typescript
app.get('/health/ready', async (req, res) => {
  const health = await mesh.healthCheck();
  const allServicesConnected = health.services >= expectedServices;
  
  if (health.status === 'healthy' && allServicesConnected) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: 'dependencies not ready' });
  }
});
```

#### 3. Service Mesh Health

```typescript
// Monitor entire service mesh health
const services = ['user-service', 'order-service', 'payment-service'];

async function checkMeshHealth() {
  const results = await Promise.all(
    services.map(async (serviceId) => {
      try {
        const client = mesh.connect(serviceId);
        await client.call('health', {});
        return { service: serviceId, healthy: true };
      } catch (error) {
        return { service: serviceId, healthy: false, error };
      }
    })
  );
  
  return results;
}
```

## Key Rotation Monitoring

### Purpose

Track cryptographic key rotation events for security compliance and debugging.

### Configuration

```typescript
const mesh = new SecureMesh({
  serviceId: 'secure-service',
  port: 50051,
  rotation: {
    interval: 3600000,  // Rotate every hour
    autoRotate: true
  },
  monitoring: {
    enabled: true,
    adapters: [new FileAdapter('./security-logs')]
  }
});

// Key rotation events are automatically logged
```

### Use Cases

#### 1. Compliance Tracking

```typescript
// Track key rotation for compliance requirements
const complianceService = new SecureMesh({
  serviceId: 'compliance-service',
  port: 50051,
  rotation: {
    interval: 86400000,  // Daily rotation
    autoRotate: true
  },
  monitoring: {
    enabled: true,
    adapters: [
      new ComplianceAdapter({
        standard: 'PCI-DSS',
        requirement: '3.6.4'  // Key rotation requirement
      })
    ]
  }
});
```

#### 2. Security Incident Response

```typescript
// Manual key rotation after security incident
import { KeyRotation } from '@lemur-bookstores/secure-stack-mesh';

const keyRotation = new KeyRotation(
  'my-service',
  cryptoManager,
  { rotationInterval: 3600000, autoRotate: false },
  auditLogger
);

// Trigger immediate rotation
await keyRotation.rotate();
// Event is logged: { eventType: 'key_rotation', success: true, ... }
```

## Best Practices

### 1. Structured Logging

```typescript
// Use structured logging for better querying
class StructuredAdapter implements MonitoringAdapter {
  async logEvent(event: MeshAuditEvent): Promise<void> {
    const structured = {
      '@timestamp': event.timestamp,
      level: event.eventType === 'error' ? 'ERROR' : 'INFO',
      service: event.serviceId,
      event_type: event.eventType,
      ...event.details
    };
    
    await logger.log(structured);
  }
}
```

### 2. Sampling for High-Volume Services

```typescript
// Sample events to reduce log volume
class SamplingAdapter implements MonitoringAdapter {
  private sampleRate = 0.1;  // Log 10% of events
  
  async logEvent(event: MeshAuditEvent): Promise<void> {
    if (Math.random() < this.sampleRate || event.eventType === 'error') {
      // Always log errors, sample others
      await this.baseAdapter.logEvent(event);
    }
  }
}
```

### 3. Alerting on Critical Events

```typescript
class AlertingAdapter implements MonitoringAdapter {
  async logEvent(event: MeshAuditEvent): Promise<void> {
    // Alert on critical events
    if (event.eventType === 'error' || 
        event.eventType === 'circuit_breaker' ||
        event.eventType === 'rate_limit') {
      await pagerDuty.trigger({
        severity: 'warning',
        summary: `${event.eventType} in ${event.serviceId}`,
        details: event.details
      });
    }
  }
}
```

### 4. Metrics Aggregation

```typescript
// Aggregate metrics before sending to monitoring system
class AggregatingMetricsAdapter implements MonitoringAdapter {
  private buffer: MeshAuditEvent[] = [];
  
  constructor() {
    setInterval(() => this.flush(), 60000);  // Flush every minute
  }
  
  async logEvent(event: MeshAuditEvent): Promise<void> {
    this.buffer.push(event);
  }
  
  private async flush(): Promise<void> {
    const aggregated = this.aggregate(this.buffer);
    await metricsService.send(aggregated);
    this.buffer = [];
  }
}
```

## Monitoring Stack Example

```typescript
// Complete monitoring setup
const mesh = new SecureMesh({
  serviceId: 'production-service',
  port: 50051,
  monitoring: {
    enabled: true,
    adapters: [
      // Console for development
      new ConsoleAdapter({ level: 'info' }),
      
      // File for audit trail
      new FileAdapter('./logs/audit', {
        rotation: 'daily',
        retention: 90
      }),
      
      // Elasticsearch for querying
      new ElasticsearchAdapter({
        node: 'http://elasticsearch:9200',
        index: 'mesh-logs'
      }),
      
      // Datadog for metrics
      new DatadogAdapter({
        apiKey: process.env.DD_API_KEY,
        service: 'production-service'
      }),
      
      // PagerDuty for alerts
      new AlertingAdapter({
        integrationKey: process.env.PD_KEY
      })
    ]
  }
});
```
