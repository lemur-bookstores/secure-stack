export interface OAuthUserProfile {
    id: string;
    email: string;
    name?: string;
    picture?: string;
    provider: string;
}

export interface OAuthProviderConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface OAuthProvider {
    getAuthUrl(state?: string): string;
    getToken(code: string): Promise<string>;
    getUserProfile(token: string): Promise<OAuthUserProfile>;
}
