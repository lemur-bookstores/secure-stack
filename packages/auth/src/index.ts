import { PasswordManager } from './utils/PasswordManager';
import { UserJWTManager, AuthConfig } from './utils/UserJWTManager';

export class AuthModule {
    public readonly password: PasswordManager;
    public readonly jwt: UserJWTManager;

    constructor(config: AuthConfig) {
        this.password = new PasswordManager();
        this.jwt = new UserJWTManager(config);
    }

    /**
     * Initialize the auth module
     */
    public static init(config: AuthConfig): AuthModule {
        return new AuthModule(config);
    }
}

export * from './utils/PasswordManager';
export * from './utils/UserJWTManager';
export * from './providers';

