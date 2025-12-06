import { MonitoringAdapter, MeshAuditEvent } from '../types';

export interface HttpClient {
    post(url: string, data: any, headers?: Record<string, string>): Promise<any>;
}

export interface HttpAuth {
    type: 'bearer' | 'basic' | 'api-key' | 'custom';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    headerName?: string;
    customHeader?: { name: string; value: string };
}

export interface HttpAdapterConfig {
    client?: HttpClient;
    endpoint: string;
    metricsEndpoint?: string;
    headers?: Record<string, string>;
    auth?: HttpAuth;
    mapEvent?: (event: MeshAuditEvent) => any;
    mapMetrics?: (metrics: any) => any;
    onError?: (error: Error, event: MeshAuditEvent | any) => void;
}

export class HttpAdapter implements MonitoringAdapter {
    private client: HttpClient;
    private endpoint: string;
    private metricsEndpoint?: string;
    private headers: Record<string, string>;
    private mapEvent: (event: MeshAuditEvent) => any;
    private mapMetrics: (metrics: any) => any;
    private onError?: (error: Error, event: MeshAuditEvent | any) => void;

    constructor(config: HttpAdapterConfig) {
        this.client = config.client || this.defaultHttpClient();
        this.endpoint = config.endpoint;
        this.metricsEndpoint = config.metricsEndpoint;
        this.headers = this.buildHeaders(config);
        this.mapEvent = config.mapEvent || this.defaultMapEvent;
        this.mapMetrics = config.mapMetrics || this.defaultMapMetrics;
        this.onError = config.onError;
    }

    async logEvent(event: MeshAuditEvent): Promise<void> {
        try {
            const payload = this.mapEvent(event);
            await this.client.post(this.endpoint, payload, this.headers);
        } catch (error) {
            if (this.onError) {
                this.onError(error as Error, event);
            } else {
                console.error('[HttpAdapter] Failed to send event:', error);
            }
        }
    }

    async logMetrics(metrics: any): Promise<void> {
        if (!this.metricsEndpoint) return;

        try {
            const payload = this.mapMetrics(metrics);
            await this.client.post(this.metricsEndpoint, payload, this.headers);
        } catch (error) {
            if (this.onError) {
                this.onError(error as Error, metrics);
            } else {
                console.error('[HttpAdapter] Failed to send metrics:', error);
            }
        }
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

    private defaultMapEvent(event: MeshAuditEvent): any {
        return {
            ...event,
            timestamp: event.timestamp.toISOString(),
        };
    }

    private defaultMapMetrics(metrics: any): any {
        return {
            timestamp: new Date().toISOString(),
            ...metrics,
        };
    }
}
