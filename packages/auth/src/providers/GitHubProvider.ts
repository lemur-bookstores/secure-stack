import { OAuthProvider, OAuthProviderConfig, OAuthUserProfile } from './types';

interface GitHubTokenResponse {
    access_token: string;
    [key: string]: unknown;
}

interface GitHubUserResponse {
    id: number;
    login: string;
    email: string | null;
    name: string | null;
    avatar_url: string;
    [key: string]: unknown;
}

interface GitHubEmailResponse {
    email: string;
    primary: boolean;
    verified: boolean;
    visibility: string | null;
}

export class GitHubProvider implements OAuthProvider {
    private readonly config: OAuthProviderConfig;
    private readonly authUrl = 'https://github.com/login/oauth/authorize';
    private readonly tokenUrl = 'https://github.com/login/oauth/access_token';
    private readonly userInfoUrl = 'https://api.github.com/user';
    private readonly userEmailsUrl = 'https://api.github.com/user/emails';

    constructor(config: OAuthProviderConfig) {
        this.config = config;
    }

    public getAuthUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: 'read:user user:email',
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
        });

        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            throw new Error('Failed to get token from GitHub');
        }

        const data = await response.json() as GitHubTokenResponse;
        return data.access_token;
    }

    public async getUserProfile(token: string): Promise<OAuthUserProfile> {
        const response = await fetch(this.userInfoUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get user profile from GitHub');
        }

        const data = await response.json() as GitHubUserResponse;

        let email = data.email;

        // If email is private, fetch it from emails endpoint
        if (!email) {
            const emailsResponse = await fetch(this.userEmailsUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (emailsResponse.ok) {
                const emails = await emailsResponse.json() as GitHubEmailResponse[];
                const primaryEmail = emails.find(e => e.primary && e.verified);
                if (primaryEmail) {
                    email = primaryEmail.email;
                }
            }
        }

        return {
            id: data.id.toString(),
            email: email || '',
            name: data.name || data.login,
            picture: data.avatar_url,
            provider: 'github',
        };
    }
}
