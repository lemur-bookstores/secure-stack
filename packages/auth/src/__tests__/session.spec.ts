import { describe, it, expect } from 'vitest';
import { SessionManager } from '../session/SessionManager';

describe('SessionManager', () => {
    const config = {
        accessTokenSecret: 'access-secret',
        accessTokenExpiresIn: '15m',
        refreshTokenSecret: 'refresh-secret',
        refreshTokenExpiresIn: '7d',
    };
    const sessionManager = new SessionManager(config);
    const userPayload = { userId: '123', email: 'test@example.com', role: 'user' };

    it('should create a session with access and refresh tokens', () => {
        const tokens = sessionManager.createSession(userPayload);
        expect(tokens.accessToken).toBeDefined();
        expect(tokens.refreshToken).toBeDefined();
    });

    it('should verify access token', () => {
        const tokens = sessionManager.createSession(userPayload);
        const payload = sessionManager.verifyAccessToken(tokens.accessToken);
        expect(payload.userId).toBe(userPayload.userId);
        expect(payload.email).toBe(userPayload.email);
    });

    it('should verify refresh token', () => {
        const tokens = sessionManager.createSession(userPayload);
        const payload = sessionManager.verifyRefreshToken(tokens.refreshToken);
        expect(payload.userId).toBe(userPayload.userId);
        expect(payload.tokenType).toBe('refresh');
    });

    it('should refresh session', () => {
        const tokens = sessionManager.createSession(userPayload);

        // We can't easily mock time here without affecting the whole suite or using async
        // So we just verify the new token is valid.
        // In a real scenario, time would pass.

        const newTokens = sessionManager.refreshSession(tokens.refreshToken);

        expect(newTokens.accessToken).toBeDefined();
        expect(newTokens.refreshToken).toBeDefined();

        const payload = sessionManager.verifyAccessToken(newTokens.accessToken);
        expect(payload.userId).toBe(userPayload.userId);
    }); it('should fail to verify invalid access token', () => {
        expect(() => sessionManager.verifyAccessToken('invalid-token')).toThrow();
    });

    it('should fail to verify invalid refresh token', () => {
        expect(() => sessionManager.verifyRefreshToken('invalid-token')).toThrow();
    });

    it('should fail if refresh token is used as access token', () => {
        const tokens = sessionManager.createSession(userPayload);
        // This might pass if secrets are same, but here they are different
        expect(() => sessionManager.verifyAccessToken(tokens.refreshToken)).toThrow();
    });
});
