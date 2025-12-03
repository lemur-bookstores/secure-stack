import jwt from 'jsonwebtoken';
import { KeyManager } from '../crypto/KeyManager';

export interface TokenPayload {
    sub: string; // Subject (Service ID)
    iss: string; // Issuer (Service ID)
    aud: string; // Audience (Target Service ID)
    iat?: number;
    exp?: number;
    jti?: string;
    [key: string]: any;
}

export class JWTManager {
    private keyManager: KeyManager;
    private serviceId: string;

    constructor(serviceId: string, keyManager: KeyManager) {
        this.serviceId = serviceId;
        this.keyManager = keyManager;
    }

    /**
     * Generates a JWT token for a target service
     */
    public generateToken(targetServiceId: string, expiresIn: string = '1h'): string {
        const keyPair = this.keyManager.getOrCreateKeyPair(this.serviceId);

        const payload: TokenPayload = {
            sub: this.serviceId,
            iss: this.serviceId,
            aud: targetServiceId,
        };

        const options: jwt.SignOptions = {
            algorithm: 'RS256',
            expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
        };

        return jwt.sign(payload, keyPair.privateKey, options);
    }

    /**
     * Verifies a JWT token from a source service
     */
    public verifyToken(token: string, sourceServiceId: string): TokenPayload {
        const keyPair = this.keyManager.loadKeyPair(sourceServiceId);

        if (!keyPair) {
            throw new Error(`Public key for service ${sourceServiceId} not found`);
        }

        try {
            const decoded = jwt.verify(token, keyPair.publicKey, {
                algorithms: ['RS256'],
                audience: this.serviceId,
                issuer: sourceServiceId,
            }) as TokenPayload;

            return decoded;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Token verification failed: ${error.message}`);
            }
            throw new Error('Token verification failed');
        }
    }

    /**
     * Decodes a token without verification to get the header/payload
     */
    public decodeToken(token: string): TokenPayload | null {
        return jwt.decode(token) as TokenPayload;
    }
}
