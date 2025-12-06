# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-06

### Added

#### Client Package (@lemur-bookstores/client)

- **Middleware System**: Client-side middleware pipeline with composable architecture
- **Auth Middleware**: Automatic token refresh on 401 responses with retry logic
- **Token Manager**: In-memory token storage with change listeners
- **CSRF Protection**: Double-submit cookie pattern implementation
  - Client-side CSRF middleware for automatic token injection
  - Server-side validation helpers for Next.js
  - Token generation and validation utilities
- **Session Management**:
  - `SessionProvider` with SSR hydration support
  - Background session refresh mechanism
  - Cookie-based session persistence
- **Auth Helper Hooks**:
  - `useSignIn`: Handle user authentication with automatic session setup
  - `useSignOut`: Logout functionality with cookie cleanup
  - `useIsAuthenticated`: Check authentication status
  - `useSession`: Access current session data
  - `usePermission`: Check user permissions
  - `useRole`: Check user roles
- **RBAC Components**:
  - `SessionGuard`: Protect routes requiring authentication
  - `RoleGate`: Conditional rendering based on user roles
  - `PermissionGate`: Conditional rendering based on permissions
  - `Protect`: Generic guard component with custom conditions
- **Server Utilities** (Next.js):
  - `getServerSession`: Extract session from server-side cookies with JWT decode
  - Cookie management helpers (get, set, clear)
  - Server-side CSRF validation
  - JWT payload decoder with type-safe mapping

#### Core Package (@lemur-bookstores/core)

- Core framework with context, middleware, and router system
- Type-safe procedure definitions
- Error handling with custom error codes

#### Server Package (@lemur-bookstores/server)

- HTTP, tRPC, and gRPC adapter implementations
- Server lifecycle management
- Protocol abstraction layer

### Documentation

- Complete auth helper hooks documentation ([docs/client/auth-helper-hooks.md](docs/client/auth-helper-hooks.md))
- CSRF protection guide ([docs/client/csrf-protection.md](docs/client/csrf-protection.md))
- Updated client API reference
- React hooks documentation
- SSR support guide
- Development guide for client auth provider

### Examples

- **Next.js 15 Example** (`examples/next-client`):
  - Complete authentication flow with login/logout
  - API routes for auth operations (login, logout, session, refresh)
  - Demo components showcasing all features
  - SSR session hydration
  - CSRF protection in action
  - RBAC guards demonstration
  - Cookie management examples
  - Network diagnostics panel

### Infrastructure

- Updated README with client package features and documentation links
- Organized git commits by functionality
- Version bumped to 0.1.0 across all packages
