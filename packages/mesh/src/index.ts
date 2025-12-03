/**
 * @lemur-bookstores/mesh
 * Secure Service Mesh for SecureStack
 */

// Main exports
export * from './SecureMesh';

// Crypto
export * from './crypto/CryptoManager';

// Auth
export * from './auth/JWTManager';
export * from './auth/SessionManager';

// Discovery
export * from './discovery/types';
export * from './discovery/StaticDiscovery';

// Client
export * from './client/SecureMeshClient';

export const version = '0.0.1';
