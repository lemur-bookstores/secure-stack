# Auth Server Example

This example demonstrates how to use `@lemur-bookstores/server` with authentication and RBAC.

## Features

- ✅ User registration with password hashing
- ✅ User login with JWT tokens
- ✅ Session management (access & refresh tokens)
- ✅ Role-Based Access Control (RBAC)
- ✅ Protected routes with authentication middleware
- ✅ Admin routes with permission checks

## Quick Start

```bash
# Install dependencies (from workspace root)
npm install

# Run the example
npm run dev --workspace=examples/auth-server
```

## API Endpoints

### Public Endpoints (No Auth Required)

#### Health Check
```bash
GET /api/public/health
```

#### Register
```bash
POST /api/public/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

#### Login
```bash
POST /api/public/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

# Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Protected Endpoints (Auth Required)

#### Get Profile
```bash
GET /api/protected/profile
Authorization: Bearer <accessToken>
```

#### Update Profile
```bash
POST /api/protected/updateProfile
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Jane Doe",
  "bio": "Software Developer"
}
```

### Admin Endpoints (Admin Permissions Required)

#### List Users
```bash
GET /api/admin/listUsers?page=1&limit=10
Authorization: Bearer <adminAccessToken>
```

#### Delete User
```bash
POST /api/admin/deleteUser
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "userId": "user_123"
}
```

## RBAC Configuration

The example defines three roles with inheritance:

- **user**: Can read and update their own profile
  - Permissions: `read:profile`, `update:profile`

- **editor**: Inherits from `user`, can also create and manage posts
  - Permissions: `create:post`, `update:post`, `read:post`
  - Inherits: `user`

- **admin**: Inherits from `editor`, can manage users and delete posts
  - Permissions: `delete:post`, `manage:users`
  - Inherits: `editor`

## Testing

### 1. Register a user
```bash
curl -X POST http://localhost:3000/api/public/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/public/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Access protected endpoint
```bash
curl http://localhost:3000/api/protected/profile \
  -H "Authorization: Bearer <your-access-token>"
```

### 4. Try admin endpoint (will fail without admin role)
```bash
curl http://localhost:3000/api/admin/listUsers \
  -H "Authorization: Bearer <your-access-token>"
```

## Architecture

```
examples/auth-server/
├── src/
│   └── index.ts          # Main server setup
├── package.json
├── tsconfig.json
└── README.md
```

## Key Concepts

### 1. Server Initialization with Auth
```typescript
const server = new SecureStackServer({
    name: 'auth-server-example',
    port: 3000,
    auth: {
        jwtSecret: 'your-secret',
        rbac: {
            roles: [/* role definitions */]
        }
    }
});
```

### 2. Middleware Usage
```typescript
// Authentication middleware
protectedRouter.use(createAuthMiddleware(server.auth));

// Permission middleware
adminRouter.use(createRoleMiddleware(server.auth, ['manage:users']));
```

### 3. Accessing User Context
```typescript
handler: async ({ ctx }) => {
    console.log(ctx.user?.userId);
    console.log(ctx.user?.role);
}
```

## Production Considerations

⚠️ **This is a demo example. For production:**

1. Use environment variables for secrets
2. Connect to a real database
3. Implement password verification
4. Add rate limiting
5. Use HTTPS
6. Implement refresh token rotation
7. Add input validation
8. Implement proper error handling
9. Add logging and monitoring
10. Use secure session storage
