# CSRF Protection

SecureStack ships with first-class support for CSRF (Cross-Site Request Forgery) prevention using the **double-submit cookie** pattern. This document explains how to enable the middleware, wire it into the client, and validate requests on the server.

---

## How it Works

1. `createCSRFMiddleware` ensures a CSRF token lives in a readable cookie (`secure-stack.csrf-token`).
2. For every state-changing request (`POST`, `PUT`, `PATCH`, `DELETE`) the middleware injects the same token into the `X-CSRF-Token` header.
3. Server-side helpers (`validateCSRFFromRequest`, `withCSRFProtection`, `csrfMiddleware`) verify the header value matches the cookie.
4. If they differ, the request is rejected with `403 CSRF_TOKEN_MISMATCH`.

This approach does **not** use HttpOnly cookies because the token must be readable from JavaScript. Instead, the refresh token remains HttpOnly while the CSRF token protects state-changing requests.

---

## Client Setup

```ts
import {
  SecureStackClient,
  createAuthMiddleware,
  createCSRFMiddleware,
  globalTokenManager,
  ensureCSRFToken,
  CSRF_HEADER_NAME,
} from '@lemur-bookstores/client';

const client = new SecureStackClient({
  url: 'https://app.example.com/api',
  middleware: [
    createCSRFMiddleware({
      protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
      excludePaths: ['/webhook/*'],
    }),
    createAuthMiddleware({
      tokenManager: globalTokenManager,
      onRefreshToken: async () => {
        const csrfToken = ensureCSRFToken();
        const res = await fetch('https://app.example.com/api/auth.refresh', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            [CSRF_HEADER_NAME]: csrfToken,
          },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.accessToken;
      },
    }),
  ],
});
```

### Notes

- The CSRF middleware **must run before** the auth middleware so that refresh calls include the header automatically.
- Use `ensureCSRFToken()` anytime you manually issue a `fetch` to a protected endpoint.
- Configure `protectedMethods` / `excludePaths` to skip third-party webhooks or public routes.

---

## Server Validation (Next.js)

### Route Handler Guard

```ts
import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFFromRequest } from '@lemur-bookstores/client/server';

export async function POST(request: NextRequest) {
  if (!validateCSRFFromRequest(request)) {
    return NextResponse.json({ error: 'CSRF_TOKEN_MISMATCH' }, { status: 403 });
  }

  // Perform protected action
  return NextResponse.json({ success: true });
}
```

### Higher-Order Wrapper

```ts
import { withCSRFProtection } from '@lemur-bookstores/client/server';

export const POST = withCSRFProtection(async (request) => {
  // Only executes if CSRF validation succeeded
  return NextResponse.json({ ok: true });
});
```

### Middleware Guard (optional)

```ts
import { csrfMiddleware } from '@lemur-bookstores/client/server';

export function middleware(request: NextRequest) {
  return csrfMiddleware(request, {
    excludePaths: ['/api/webhook/*'],
  });
}

export const config = { matcher: '/api/:path*' };
```

### Issuing the Cookie

Generate / refresh the CSRF cookie after login or when rendering the app shell:

```ts
import { setCSRFCookie } from '@lemur-bookstores/client/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  setCSRFCookie(response); // writes secure-stack.csrf-token
  return response;
}
```

---

## Refresh Endpoint Example

`app/api/auth.refresh/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookies, validateCSRFFromRequest } from '@lemur-bookstores/client/server';

export async function POST(request: NextRequest) {
  if (!validateCSRFFromRequest(request)) {
    return NextResponse.json({ message: 'CSRF_TOKEN_MISMATCH' }, { status: 403 });
  }

  const { refreshToken } = await getSessionCookies();
  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
  }

  return NextResponse.json({ accessToken: 'new-token-' + Date.now() });
}
```

`getSessionCookies()` abstracts the cookie names (`secure-stack.refresh-token`, etc.) so the example stays aligned with the helpers used in the Next.js demo app.

---

## Troubleshooting

| Symptom                   | Possible Cause                   | Fix                                                                                                   |
| ------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `403 CSRF_TOKEN_MISMATCH` | Missing header                   | Ensure `createCSRFMiddleware` runs before auth middleware and manual fetches call `ensureCSRFToken()` |
| CSRF cookie missing       | Cookie never set                 | Call `setCSRFCookie()` after login or on first GET                                                    |
| CSRF token not updating   | Browser caching                  | Set `maxAge` when calling `setCSRFCookie` or clear cookies on logout                                  |
| Errors on `GET` requests  | Misconfigured `protectedMethods` | Ensure only mutating methods are protected                                                            |

---

## Best Practices

1. **Always** include CSRF middleware in production builds.
2. Rotate the CSRF token after login/logout by calling `setCSRFCookie()`.
3. Keep refresh tokens HttpOnly; only the CSRF token should be accessible to JavaScript.
4. Use `excludePaths` for third-party callbacks that cannot send the CSRF header.
5. Combine CSRF with same-site cookies (`SameSite=Lax` or `Strict`) for defense in depth.
6. Log failures via `onFailure` in `csrfMiddleware` to detect repeated attacks.
