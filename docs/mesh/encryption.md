# Encryption & Security

The SecureStack Service Mesh employs a robust hybrid encryption scheme to ensure the confidentiality and integrity of all service-to-service communication.

## Hybrid Encryption Scheme

We combine the efficiency of symmetric encryption with the security of asymmetric encryption.

1.  **RSA-4096 (Asymmetric)**: Used for the initial handshake and key exchange.
2.  **AES-256-GCM (Symmetric)**: Used for encrypting the actual data payload.
3.  **HMAC-SHA256**: Used for message integrity verification.

### Handshake Process

1.  **Service A** (Client) requests a connection to **Service B** (Server).
2.  **Service B** sends its **RSA Public Key** to Service A.
3.  **Service A** generates a random **AES-256 Session Key**.
4.  **Service A** encrypts the Session Key with Service B's RSA Public Key and sends it.
5.  **Service B** decrypts the Session Key with its **RSA Private Key**.
6.  Both services now possess the shared Session Key and use it for subsequent communication.

## Configuration

Enable encryption in your server config:

```typescript
const app = new SecureStackServer({
  mesh: {
    enabled: true,
    security: {
      encryption: 'hybrid',
      rsaKeySize: 4096, // Default
      aesKeySize: 256,  // Default
    },
  },
});
```

## Key Management

### Key Rotation

Keys should be rotated regularly to limit the impact of a potential compromise. SecureStack handles this automatically.

```typescript
const app = new SecureStackServer({
  mesh: {
    security: {
      keyRotation: {
        enabled: true,
        interval: 3600000, // Rotate every 1 hour
      },
    },
  },
});
```

### Key Persistence

RSA keys can be persisted to disk to maintain identity across restarts.

```typescript
const app = new SecureStackServer({
  mesh: {
    security: {
      keyPath: './keys', // Directory to store keys
    },
  },
});
```

## Mutual Authentication (mTLS equivalent)

In addition to encryption, services authenticate each other using signed JWTs.

1.  Each service is provisioned with a `serviceId` and a shared `meshSecret`.
2.  During the handshake, the client sends a JWT signed with the `meshSecret`.
3.  The server verifies the JWT to confirm the client's identity.

```typescript
const app = new SecureStackServer({
  mesh: {
    auth: {
      serviceId: 'order-service',
      meshSecret: process.env.MESH_SECRET,
    },
  },
});
```

## Performance Impact

- **Handshake**: The RSA handshake adds a small latency (typically < 50ms) only at the start of a connection.
- **Data Transfer**: AES-256-GCM is hardware-accelerated on modern CPUs, resulting in negligible overhead for data transfer.
- **Session Reuse**: Connections and session keys are reused to minimize handshake overhead.
