import jwt from 'jsonwebtoken';

export interface UserTokenPayload {
    userId: string;
    email?: string;
    role?: string;
    [key: string]: any;
}

export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn?: string | number;
}

export class UserJWTManager {
    private readonly secret: string;
    private readonly expiresIn: string | number;

    constructor(config: AuthConfig) {
        this.secret = config.jwtSecret;
        this.expiresIn = config.jwtExpiresIn || '1d';
    }

    /**
     * Generates a token for a user
     */
    public generateToken(payload: UserTokenPayload): string {
        return jwt.sign(payload, this.secret, {
            expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
        });
    }

    /**
     * Verifies a user token
     */
    public verifyToken(token: string): UserTokenPayload {
        try {
            return jwt.verify(token, this.secret) as UserTokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Decodes a token without verification
     */
    public decodeToken(token: string): UserTokenPayload | null {
        return jwt.decode(token) as UserTokenPayload;
    }
}
