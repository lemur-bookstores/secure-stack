# SecureStack Client Auth Provider & Middleware System

## Why This Matters

The current `@lemur-bookstores/secure-stack-client` package exposes data-fetching hooks but leaves authentication/session state up to each app. Modern Next.js apps expect features similar to NextAuth:

- Automatic cookie-based session continuity on both client and server components.
- Hooks that expose the authenticated user with role/permission metadata.
- Guards/components that block UI until the session is resolved.
- A provider capable of stacking middlewares (session, RBAC, feature flags, org context, etc.).

This document lays out the feature spec for building that experience directly into SecureStack.

## High-Level Goals

1. **Multiple Client Providers** – Allow stacking purpose-built providers (SessionProvider, RBACProvider, FeatureFlagProvider, etc.) powered by a shared SecureStackClient instance.
2. **Composable Middlewares** – Reusable middleware layer capable of augmenting requests with auth headers, refreshing tokens, injecting tracing headers, etc.
3. **Cookie-Based Session Handling** – Access/refresh tokens stored securely in cookies (HttpOnly + Secure + SameSite). Provide helpers to read/write cookies on server actions, Route Handlers, and Edge runtime.
4. **Universal Session Hooks** – `useSession()` for client components and `getSession()` helpers for RSC/Route Handlers to read the logged-in user with roles/permissions.
5. **RBAC & Permission Utilities** – Components (`<RequireRole/>`) and hooks (`useAuthorization`) that verify roles/permissions before rendering children.
6. **User Context Provider** – Top-level provider that exposes the resolved user and metadata to all descendants with zero prop drilling.
7. **Extra Features** – Recommended add-ons such as background refresh, CSRF protection, and multi-tenant awareness.

## Architecture Overview

```
<SecureStackProvider>
  <SessionProvider cookieStrategy="http-only">
    <RBACProvider policySource="/api/auth/policy">
      {children}
    </RBACProvider>
  </SessionProvider>
</SecureStackProvider>
```

- **SecureStackProvider** stays responsible for creating the client + React Query context.
- **SessionProvider** owns session state (user object, tokens, status) and exposes `useSession`.
- **RBACProvider** consumes `useSession` and builds fine-grained permission helpers.
- Each provider can register client-side middlewares (beforeQuery, beforeMutation) to modify outgoing requests.

## Session & Token Strategy

| Concern        | Recommendation                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Token storage  | Access token in memory, refresh token in HttpOnly cookie (NextAuth style).                                     |
| Rotation       | Auto-refresh on 401 via middleware using refresh cookie.                                                       |
| CSRF           | Double-submit token (cookie + header) when using refresh endpoints.                                            |
| Session cookie | `secure-stack.session` stores a user payload (unsigned JWT) so `getServerSession` can hydrate without fetches. |
| Cookie helpers | `getSessionCookies()` / `setSessionCookies()` / `clearAuthCookies()` unify cookie handling across runtimes.    |

During login, call `setSessionCookies({ accessToken, refreshToken, session })` where `session` is a signed or unsigned JWT containing the serialized user fields you want to hydrate on the server.

### Data Flow

1. **Login mutation** returns `{ user, accessToken, refreshToken }`.
2. SessionProvider stores `user` in context, access token in memory, refresh token via cookie helper.
3. Middleware injects `Authorization: Bearer <accessToken>` into queries/mutations.
4. On 401, middleware attempts refresh using cookie; on success, updates access token and retries original request.
5. Server components call `getServerSession()` which first inspects the session/refresh cookies, decodes the JWT payload locally, and only calls `/api/auth/session` as a fallback before hydrating SessionProvider to avoid waterfalls.

## API Surface

### Providers & Hooks

- `SessionProvider` props:
  - `sessionFetcher?: () => Promise<AuthSession | null>` (SSR hydration)
  - `cookieStrategy?: 'http-only' | 'document'`
  - `refreshConfig?: { endpoint: string; intervalMs?: number }`
- Hooks: `useSession`, `useIsAuthenticated`, `useRefreshToken`, `useSignIn`, `useSignOut`.
- Helpers: `getServerSession(req)`, `getEdgeSession(request)`.

### RBAC Layer

- `RBACProvider` accepts `policySource` (static object or remote endpoint).
- Hooks: `useAuthorization`, `useHasRole`, `useHasPermission`.
- Components: `<RequireRole roles={['admin']}>`, `<RequirePermission permission="orders.create">` with fallback render prop.

### Session Object & State Machine

- Session shape returned by hooks/helpers:

```ts
interface AuthSession {
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    permissions?: string[];
    orgId?: string;
    [key: string]: unknown;
  } | null;
  accessToken?: string;
  error?: Error;
}
```

- State transitions:
  1. `loading` → `authenticated` when `sessionFetcher` or login resolves with a valid user.
  2. `loading` → `unauthenticated` when no cookies/session found.
  3. Any state → `error` if refresh/login fails (expose `retry()` function from hook).
  4. `authenticated` → `unauthenticated` on logout or refresh failure.

Hooks such as `useSession` should always return `{ data, status, error, refresh }` so UI can implement skeletons consistently.

### Middleware Composition

```ts
const client = new SecureStackClient({
  url: 'https://api.app.com',
  middlewares: [sessionMiddleware({ getAccessToken }), tracingMiddleware(), retryMiddleware()],
});
```

- Each middleware receives `{ path, input, options, next }` similar to server-side middlewares.
- Session middleware is exported from SessionProvider to ensure shared state.

#### Middleware Contract

```ts
type ClientMiddleware = (ctx: {
  path: string;
  type: 'query' | 'mutation' | 'subscription';
  input: unknown;
  options: RequestOptions;
  next: (nextCtx?: Partial<typeof ctx>) => Promise<unknown>;
}) => Promise<unknown>;
```

- Middlewares execute in FIFO order and can short-circuit responses (e.g., return cached data).
- Provide helpers like `composeMiddlewares([...])` so apps can inject their own telemetry or feature flags without touching core providers.

## Server Hooks & Helpers

- `withServerSession(handler)` higher-order helper for Next.js Route Handlers to resolve the session and inject `ctx.user`.
- `createAuthCookies(res, tokens)` and `clearAuthCookies(res)` utilities.
- Optional integration with `@lemur-bookstores/secure-stack-auth` SessionManager for verifying tokens server-side.

### SSR / RSC Flow

1. A Next.js Route Handler or Server Component calls `getServerSession({ cookies })`.
2. The helper inspects `secure-stack.session` / `secure-stack.access-token` cookies, then runs either a custom `sessionDecoder` or the built-in JWT payload decoder (unsigned) to derive the user object.
3. If decoding fails and `disableRequest !== true`, it calls `/api/auth/session` (or custom `sessionEndpoint`) passing the cookie to let the backend verify the refresh token.
4. The resolved session is serialized and handed to `SessionProvider` for hydration so React trees skip the `loading` state immediately.
5. Edge runtime follows the same pattern via `RequestCookies`.

### `getServerSession` Options

- `tokenCookieNames`: Ordered list of cookie names to inspect (defaults to `['secure-stack.session', 'secure-stack.access-token', 'secure-stack.refresh-token', 'auth_token']`).
- `sessionDecoder`: Optional verified decoder (e.g., `jose` + public key) that returns either an `AuthSession` or raw user payload.
- `enableJwtDecode`: Toggles the built-in, unsigned payload decode helper for prototypes/local dev.
- `mapJwtPayloadToUser`: Custom mapper that turns decoded payloads into the `AuthSession['user']` shape.
- `disableRequest`: Skip the network fallback entirely when you trust the cookie payload.
- `requestInit`: Extra fetch options for the `/api/auth/session` call (headers, credentials, etc.).

This flow must handle **partial hydration**, meaning if only the user object is available (no tokens) the provider still works for read-only SSR pages.

## Validation Components

- `<SessionGuard status="authenticated" fallback={<SignIn/>}>children</SessionGuard>`.
- `<RoleGate anyOf={["admin", "editor"]} onDeny={<Forbidden/>}>children</RoleGate>`.
- `<PermissionGate allOf={["billing.read"]}>children</PermissionGate>`.
- These components should support Suspense boundaries so they can trigger data fetching.

## Recommended Enhancements

1. **Background Session Refresh** – Configurable refresh interval (e.g., every 10 minutes) that silently keeps the session alive.
2. **Org / Workspace Context** – Extend providers to include active organization/workspace with hooks like `useOrganization()`.
3. **Device Fingerprinting** – Optional middleware that attaches device/session identifiers to assist backend anomaly detection.
4. **Audit Hooks** – Emit lifecycle events (`session:login`, `session:logout`, `session:refresh`) so apps can plug into analytics/audit logs.
5. **Offline-Ready** – Cache last known session in IndexedDB to provide optimistic UI in offline scenarios.
6. **Edge Compatibility** – Ensure cookie utilities work under Next.js Edge runtime by using `NextRequest/NextResponse` helpers only.

## Implementation Plan (Suggested)

1. **Foundation** – Extend `SecureStackClient` to accept middlewares. Ship `sessionMiddleware` first.
2. **SessionProvider** – Build provider + hooks sharing state via React Context; expose SSR hydration helper.
3. **Cookie Utilities** – Cross-runtime helpers for reading/writing session cookies.
4. **RBAC Layer** – Introduce providers/hooks/components for permissions.
5. **Docs & Examples** – Update Next.js example to showcase full login/logout flow, guards, and SSR session loading.

## Testing Strategy

1. **Unit Tests** –

- Session middleware: token injection, refresh retry, failure modes.
- Hooks: ensure `useSession` state machine behaves across login/logout cycles.
- Cookie helpers: verify serialization/deserialization across Node + Edge polyfills.

2. **Integration Tests** – Spin up a mock SecureStack server + Next.js app, run Playwright suites covering login, guard redirects, role changes.
3. **Load/Timing Tests** – Validate background refresh cadence does not spam APIs (throttle invocation, exponential backoff on failures).
4. **Security Audits** –

- Confirm cookies always set with `Secure`, `HttpOnly`, `SameSite=strict` (configurable for localhost).
- Ensure CSRF double-submit tokens are enforced on refresh endpoints.
- Verify session data is never written to localStorage when `cookieStrategy="http-only"`.

Document expected test matrices so QA teams can extend coverage as providers evolve.

## Open Questions

- Should SessionProvider own storage (cookies) or delegate to app hooks for maximum flexibility?
- How do we support WebSocket subscriptions that need authenticated context? (Likely by injecting headers when establishing WS connection.)
- Do we need first-party integrations with external IdPs (OAuth) or rely on backend routers entirely?

---

This document should guide implementation discussions and keep the feature aligned with the rest of SecureStack's architecture.
