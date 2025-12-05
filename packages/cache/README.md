# @lemur-bookstores/cache

A robust caching module for SecureStack with support for multiple providers (Memory, Redis, Memcached).

## Features

- 🔌 **Driver-based architecture**: Easily switch between caching strategies.
- 💾 **Memory Provider**: Built-in LRU cache for development and testing.
- 🚀 **Redis Provider**: High-performance caching using `ioredis`.
- 📦 **Memcached Provider**: Alternative caching using `memjs`.
- 🛡️ **Unified API**: Consistent interface across all providers.
- ⏱️ **TTL Support**: Time-to-live support for all operations.

## Installation

```bash
npm install @lemur-bookstores/cache
```

## Usage

### Basic Usage (Memory)

```typescript
import { CacheManager } from '@lemur-bookstores/cache';

const cache = new CacheManager({
  store: 'memory',
  memory: {
    max: 500, // Max items
    ttl: 60,  // Default TTL in seconds
  },
});

await cache.set('key', 'value');
const value = await cache.get('key');
```

### Redis Usage

```typescript
import { CacheManager } from '@lemur-bookstores/cache';

const cache = new CacheManager({
  store: 'redis',
  redis: {
    host: 'localhost',
    port: 6379,
    ttl: 3600, // Default TTL
  },
});
```

### Memcached Usage

```typescript
import { CacheManager } from '@lemur-bookstores/cache';

const cache = new CacheManager({
  store: 'memcached',
  memcached: {
    servers: 'localhost:11211',
    options: {
      expires: 60,
    },
  },
});
```

## API

### `CacheManager`

- `get<T>(key: string): Promise<T | null>`
- `set<T>(key: string, value: T, ttl?: number): Promise<void>`
- `del(key: string): Promise<void>`
- `clear(): Promise<void>`
- `has(key: string): Promise<boolean>`
- `getProvider(): CacheProvider`

## License

MIT
