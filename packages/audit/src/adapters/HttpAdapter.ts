import { AuditAdapter, AuditEvent } from '../types';

export interface HttpClient {
    post(url: string, data: any, headers?: Record<string, string>): Promise<any>;
}

export interface HttpAuth {
    type: 'bearer' | 'basic' | 'api-key' | 'custom';
    token?: string; // For bearer
    username?: string; // For basic
    password?: string; // For basic
    apiKey?: string; // For api-key
    headerName?: string; // For api-key (default: 'X-API-Key')
    customHeader?: { name: string; value: string }; // For custom
}

export interface HttpAdapterConfig {
    client?: HttpClient;
    endpoint: string;
    headers?: Record<string, string>;
    auth?: HttpAuth;
    mapEvent?: (event: AuditEvent) => any;
    onError?: (error: Error, event: AuditEvent) => void;
}

export class HttpAdapter implements AuditAdapter {
    private client: HttpClient;
    private endpoint: string;
    private headers: Record<string, string>;
    private mapEvent: (event: AuditEvent) => any;
    private onError?: (error: Error, event: AuditEvent) => void;

    constructor(config: HttpAdapterConfig) {
        this.client = config.client || this.defaultHttpClient();
        this.endpoint = config.endpoint;
        this.headers = this.buildHeaders(config);
        this.mapEvent = config.mapEvent || this.defaultMapEvent;
        this.onError = config.onError;
    }

    private buildHeaders(config: HttpAdapterConfig): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(config.headers || {}),
        };

        if (config.auth) {
            switch (config.auth.type) {
                case 'bearer':
                    if (config.auth.token) {
                        headers['Authorization'] = `Bearer ${config.auth.token}`;
                    }
                    break;
                case 'basic':
                    if (config.auth.username && config.auth.password) {
                        const credentials = Buffer.from(
                            `${config.auth.username}:${config.auth.password}`
                        ).toString('base64');
                        headers['Authorization'] = `Basic ${credentials}`;
                    }
                    break;
                case 'api-key':
                    if (config.auth.apiKey) {
                        const headerName = config.auth.headerName || 'X-API-Key';
                        headers[headerName] = config.auth.apiKey;
                    }
                    break;
                case 'custom':
                    if (config.auth.customHeader) {
                        headers[config.auth.customHeader.name] = config.auth.customHeader.value;
                    }
                    break;
            }
        }

        return headers;
    }

    async log(event: AuditEvent): Promise<void> {
        try {
            const payload = this.mapEvent(event);
            await this.client.post(this.endpoint, payload, this.headers);
        } catch (error) {
            if (this.onError) {
                this.onError(error as Error, event);
            } else {
                console.error('[HttpAdapter] Failed to send audit log:', error);
            }
        }
    }

    private defaultHttpClient(): HttpClient {
        return {
            post: async (url: string, data: any, headers?: Record<string, string>) => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: headers || {},
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json();
            },
        };
    }

    private defaultMapEvent(event: AuditEvent): any {
        return {
            ...event,
            timestamp: event.timestamp.toISOString(),
        };
    }
}
