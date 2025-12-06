import { describe, it, expect, beforeEach } from 'vitest';
import { AuthModule } from '../index';

describe('AuthModule', () => {
    let auth: AuthModule;
    const secret = 'super-secret-key';

    beforeEach(() => {
        auth = AuthModule.init({ jwtSecret: secret });
    });

    describe('PasswordManager', () => {
        it('should hash and verify passwords', async () => {
            const password = 'my-secure-password';
            const hash = await auth.password.hash(password);

            expect(hash).not.toBe(password);

            const isValid = await auth.password.verify(password, hash);
            expect(isValid).toBe(true);

            const isInvalid = await auth.password.verify('wrong-password', hash);
            expect(isInvalid).toBe(false);
        });
    });

    describe('UserJWTManager', () => {
        it('should generate and verify tokens', () => {
            const payload = { userId: 'user-123', role: 'admin' };
            const token = auth.jwt.generateToken(payload);

            expect(token).toBeDefined();

            const decoded = auth.jwt.verifyToken(token);
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.role).toBe(payload.role);
        });

        it('should fail on invalid token', () => {
            expect(() => auth.jwt.verifyToken('invalid-token')).toThrow();
        });
    });

    describe('RBAC Integration', () => {
        it('should initialize RBAC if config is provided', () => {
            const authWithRbac = AuthModule.init({
                jwtSecret: secret,
                rbac: {
                    roles: [{ name: 'admin', permissions: ['all'] }]
                }
            });
            
            expect(authWithRbac.rbac).toBeDefined();
            expect(authWithRbac.rbac?.roleExists('admin')).toBe(true);
        });
    });
});
