import { OAuthProvider, OAuthProviderConfig, OAuthUserProfile } from './types';

interface GoogleTokenResponse {
    access_token: string;
    [key: string]: unknown;
}

interface GoogleUserInfoResponse {
    sub: string;
    email: string;
    name: string;
    picture: string;
    [key: string]: unknown;
}

export class GoogleProvider implements OAuthProvider {
    private readonly config: OAuthProviderConfig;
    private readonly authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    private readonly tokenUrl = 'https://oauth2.googleapis.com/token';
    private readonly userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';

    constructor(config: OAuthProviderConfig) {
        this.config = config;
    }

    public getAuthUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
        });

        if (state) {
            params.append('state', state);
        }

        return `${this.authUrl}?${params.toString()}`;
    }

    public async getToken(code: string): Promise<string> {
        const params = new URLSearchParams({
            code,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            redirect_uri: this.config.redirectUri,
            grant_type: 'authorization_code',
        });

        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            throw new Error('Failed to get token from Google');
        }

        const data = await response.json() as GoogleTokenResponse;
        return data.access_token;
    }

    public async getUserProfile(token: string): Promise<OAuthUserProfile> {
        const response = await fetch(this.userInfoUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get user profile from Google');
        }

        const data = await response.json() as GoogleUserInfoResponse;

        return {
            id: data.sub,
            email: data.email,
            name: data.name,
            picture: data.picture,
            provider: 'google',
        };
    }
}
