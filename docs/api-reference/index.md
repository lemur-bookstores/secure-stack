# API Reference

This section provides a detailed reference for the SecureStack API.

## Core

- **[SecureStack](../core/router.md)**: The main application class.
- **[Router](../core/router.md)**: Router creation and procedure definition.
- **[Middleware](../core/middleware.md)**: Middleware creation and composition.
- **[Context](../core/context.md)**: Context definition and type inference.
- **[SecureStackError](../core/errors.md)**: Standard error class.

## Server

- **[SecureStackServer](../server/api.md)**: Server implementation extending SecureStack.
- **[SecureStackServerConfig](../server/api.md#configuration)**: Configuration options.
- **[Lifecycle Hooks](../server/lifecycle.md)**: `onStart`, `onReady`, `onShutdown`.

## Client

- **[createClient](../client/api.md)**: Client factory function.
- **[SecureStackProvider](../client/api.md#react-integration)**: React context provider.
- **[useQuery](../client/react-hooks.md#usequery)**: Data fetching hook.
- **[useMutation](../client/react-hooks.md#usemutation)**: Data modification hook.
- **[useSubscription](../client/react-hooks.md#usesubscription)**: Real-time subscription hook.

## Auth

- **[createRBAC](../auth/rbac.md)**: RBAC instance creator.
- **[middleware](../auth/jwt.md)**: Authentication middleware.

## Mesh

- **[SecureMesh](../mesh/overview.md)**: Service Mesh configuration.
- **[DiscoveryProvider](../mesh/discovery.md)**: Interface for custom service discovery.

---

*Note: For detailed type definitions, please refer to the TypeScript definition files included in the package or your IDE's IntelliSense.*
