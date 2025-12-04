# Testing Strategies

Testing is crucial for maintaining a reliable SecureStack application. We recommend a testing pyramid approach: Unit Tests, Integration Tests, and E2E Tests.

## 1. Unit Testing

Test individual functions and logic in isolation. We recommend [Vitest](https://vitest.dev/) for its speed and TypeScript support.

```typescript
// utils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotal } from './utils';

describe('calculateTotal', () => {
  it('should sum prices correctly', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });
});
```

## 2. Integration Testing (Routers)

Test your routers by calling them directly. SecureStack's design makes this easy because routers are just functions.

### Setup Test Context

```typescript
// test/context.ts
import { createContext } from '../src/context';

export const createTestContext = async (user = null) => {
  return createContext({
    req: { headers: { authorization: user ? `Bearer ${user.token}` : '' } },
    res: {},
  });
};
```

### Test Router

```typescript
// routers/user.test.ts
import { describe, it, expect } from 'vitest';
import { userRouter } from '../src/routers/user';
import { createTestContext } from '../test/context';

describe('User Router', () => {
  it('should create a user', async () => {
    const ctx = await createTestContext();
    const caller = userRouter.createCaller(ctx);
    
    const result = await caller.create({
      name: 'Test User',
      email: 'test@example.com',
    });
    
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('Test User');
  });
});
```

## 3. End-to-End (E2E) Testing

Test the full application flow, including HTTP requests and database interactions. We recommend [Playwright](https://playwright.dev/) or Supertest.

### Using Supertest

```typescript
import supertest from 'supertest';
import { app } from '../src/server';

describe('API E2E', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('GET /health', async () => {
    const response = await supertest(app.server)
      .get('/health')
      .expect(200);
      
    expect(response.body.status).toBe('ok');
  });
});
```

## 4. Mocking

Mock external dependencies like databases or third-party APIs to keep tests fast and deterministic.

```typescript
// Mocks
vi.mock('../src/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));
```

## 5. Continuous Integration

Run your tests automatically on every push.

```yaml
# .github/workflows/test.yml
steps:
  - uses: actions/checkout@v3
  - run: pnpm install
  - run: pnpm test
```
