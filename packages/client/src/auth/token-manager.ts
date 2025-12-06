/**
 * Simple token manager to handle access tokens in memory
 */
export class TokenManager {
    private accessToken: string | null = null;
    private listeners: ((token: string | null) => void)[] = [];

    /**
     * Get the current access token
     */
    getToken(): string | null {
        return this.accessToken;
    }

    /**
     * Set the access token
     */
    setToken(token: string | null) {
        this.accessToken = token;
        this.notifyListeners();
    }

    /**
     * Subscribe to token changes
     */
    subscribe(listener: (token: string | null) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.accessToken));
    }
}

export const globalTokenManager = new TokenManager();
