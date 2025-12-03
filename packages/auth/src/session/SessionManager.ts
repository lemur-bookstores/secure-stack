import { UserJWTManager, UserTokenPayload } from '../utils/UserJWTManager';

export interface SessionConfig {
    accessTokenSecret: string;
    accessTokenExpiresIn: string | number;
    refreshTokenSecret: string;
    refreshTokenExpiresIn: string | number;
}

export interface SessionTokens {
    accessToken: string;
    refreshToken: string;
}

export class SessionManager {
    private readonly accessJwt: UserJWTManager;
    private readonly refreshJwt: UserJWTManager;

    constructor(config: SessionConfig) {
        this.accessJwt = new UserJWTManager({
            jwtSecret: config.accessTokenSecret,
            jwtExpiresIn: config.accessTokenExpiresIn,
        });
        this.refreshJwt = new UserJWTManager({
            jwtSecret: config.refreshTokenSecret,
            jwtExpiresIn: config.refreshTokenExpiresIn,
        });
    }

    public createSession(payload: UserTokenPayload): SessionTokens {
        const accessToken = this.accessJwt.generateToken(payload);
        // We add a type to distinguish, though the secret is different anyway
        const refreshToken = this.refreshJwt.generateToken({ ...payload, tokenType: 'refresh' });
        return { accessToken, refreshToken };
    }

    public verifyAccessToken(token: string): UserTokenPayload {
        return this.accessJwt.verifyToken(token);
    }

    public verifyRefreshToken(token: string): UserTokenPayload {
        const payload = this.refreshJwt.verifyToken(token);
        if (payload.tokenType !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return payload;
    }

    public refreshSession(refreshToken: string): SessionTokens {
        const payload = this.verifyRefreshToken(refreshToken);
        // Remove 'tokenType', 'iat', 'exp' from payload before regenerating
        const { tokenType, iat, exp, ...userPayload } = payload;
        return this.createSession(userPayload as UserTokenPayload);
    }
}
