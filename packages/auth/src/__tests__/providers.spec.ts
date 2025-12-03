import { describe, it, expect } from 'vitest';
import { GoogleProvider } from '../providers/GoogleProvider';
import { GitHubProvider } from '../providers/GitHubProvider';

describe('GoogleProvider', () => {
    const config = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
    };
    const provider = new GoogleProvider(config);

    it('should generate correct auth url', () => {
        const url = provider.getAuthUrl('test-state');
        expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
        expect(url).toContain('client_id=test-client-id');
        expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
        expect(url).toContain('state=test-state');
        expect(url).toContain('scope=openid+email+profile');
    });
});

describe('GitHubProvider', () => {
    const config = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
    };
    const provider = new GitHubProvider(config);

    it('should generate correct auth url', () => {
        const url = provider.getAuthUrl('test-state');
        expect(url).toContain('https://github.com/login/oauth/authorize');
        expect(url).toContain('client_id=test-client-id');
        expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
        expect(url).toContain('state=test-state');
        expect(url).toContain('scope=read%3Auser+user%3Aemail');
    });
});
