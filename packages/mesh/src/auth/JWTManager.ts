/**
 * JWT Manager - Mutual Authentication
 * Handles JWT token generation and verification for service-to-service authentication
 */

import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export interface JWTPayload {
    serviceId: string;
    sessionId: string;
    iat: number;
    exp: number;
}

export interface JWTOptions {
    secret?: string;
    expiresIn?: string | number;
}

export class JWTManager {
    private secret: string;
    private expiresIn: string | number;

    constructor(options: JWTOptions = {}) {
        // Generate random secret if not provided
        this.secret = options.secret || crypto.randomBytes(64).toString('hex');
        this.expiresIn = options.expiresIn || '1h';
    }

    /**
     * Generate JWT token for a service
     */
    generateToken(serviceId: string, sessionId: string): string {
        const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            serviceId,
            sessionId,
        };

        return jwt.sign(payload, this.secret, {
            expiresIn: this.expiresIn,
            algorithm: 'HS256',
        } as jwt.SignOptions);
    }

    /**
     * Verify JWT token
     */
    verifyToken(token: string): JWTPayload {
        try {
            const decoded = jwt.verify(token, this.secret, {
                algorithms: ['HS256'],
            }) as JWTPayload;

            return decoded;
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('JWT token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid JWT token');
            }
            throw error;
        }
    }

    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token: string): JWTPayload | null {
        try {
            return jwt.decode(token) as JWTPayload;
        } catch {
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(token: string): boolean {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        return Date.now() >= decoded.exp * 1000;
    }

    /**
     * Get token expiration time
     */
    getTokenExpiration(token: string): Date | null {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return null;

        return new Date(decoded.exp * 1000);
    }

    /**
     * Refresh secret (for key rotation)
     */
    refreshSecret(newSecret?: string): void {
        this.secret = newSecret || crypto.randomBytes(64).toString('hex');
        console.log('[JWTManager] Secret refreshed for key rotation');
    }
}
