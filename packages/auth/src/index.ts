import { PasswordManager } from './utils/PasswordManager';
import { UserJWTManager, AuthConfig } from './utils/UserJWTManager';
import { SessionManager, SessionConfig } from './session/SessionManager';

export type AuthModuleConfig = AuthConfig & Partial<SessionConfig>;

export class AuthModule {
    public readonly password: PasswordManager;
    public readonly jwt: UserJWTManager;
    public readonly session?: SessionManager;

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
export * from './providers';

