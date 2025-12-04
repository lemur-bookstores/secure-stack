import { PasswordManager } from './utils/PasswordManager';
import { UserJWTManager, AuthConfig } from './utils/UserJWTManager';
import { SessionManager, SessionConfig } from './session/SessionManager';
import { RBACManager } from './rbac/RBACManager';
import { RBACConfig } from './rbac/types';

export type AuthModuleConfig = AuthConfig & Partial<SessionConfig> & { rbac?: RBACConfig };

export class AuthModule {
    public readonly password: PasswordManager;
    public readonly jwt: UserJWTManager;
    public readonly session?: SessionManager;
    public readonly rbac?: RBACManager;

    constructor(config: AuthModuleConfig) {
        this.password = new PasswordManager();
        this.jwt = new UserJWTManager(config);

        if (config.accessTokenSecret && config.refreshTokenSecret) {
            this.session = new SessionManager({
                accessTokenSecret: config.accessTokenSecret,
                accessTokenExpiresIn: config.accessTokenExpiresIn || '15m',
                refreshTokenSecret: config.refreshTokenSecret,
                refreshTokenExpiresIn: config.refreshTokenExpiresIn || '7d',
            });
        }

        if (config.rbac) {
            this.rbac = new RBACManager(config.rbac);
        }
    }

    /**
     * Initialize the auth module
     */
    public static init(config: AuthModuleConfig): AuthModule {
        return new AuthModule(config);
    }
}

export * from './utils/PasswordManager';
export * from './utils/UserJWTManager';
export * from './session/SessionManager';
export * from './rbac';
export * from './providers';

