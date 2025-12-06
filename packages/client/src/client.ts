/**
 * SecureStack Client
 * Core client for making type-safe API calls
 */

import type { ClientConfig, RequestOptions, ClientResponse, ClientError, SubscriptionOptions } from './types';
import { CacheManager } from './cache/cache';
import { CacheStatus } from './cache/strategies';

export class SecureStackClient {
    private config: Required<ClientConfig>;
    private cache: CacheManager;
    private ws: WebSocket | null = null;
    private wsReconnectTimer: any = null;
    private subscriptionHandlers: Map<string, {
        onData: (data: any) => void;
        onError: (error: any) => void;
        path: string;
        input: any;
    }> = new Map();

    constructor(config: ClientConfig) {
        this.config = {
            url: config.url,
            headers: config.headers || {},
            timeout: config.timeout || 30000,
            retry: config.retry ?? true,
            maxRetries: config.maxRetries || 3,
            signal: config.signal!,
        };
        this.cache = new CacheManager();
    }

    /**
     * Make a query request (GET)
     */
    async query<TInput = void, TOutput = unknown>(
        path: string,
        input?: TInput,
        options?: RequestOptions
    ): Promise<TOutput> {
        const url = this.buildUrl(path, input);

        if (options?.enableCache) {
            const { data, status } = this.cache.get<TOutput>(url);

            if (status === CacheStatus.Fresh && data !== undefined) {
                return data;
            }

            if (status === CacheStatus.Stale && data !== undefined) {
                // Return stale data immediately, but trigger background refresh
                const { enableCache, cacheTTL, ...fetchOptions } = options;
                this.fetch<TOutput>(url, { method: 'GET', ...fetchOptions })
                    .then(response => {
                        this.cache.set(url, response.data, cacheTTL);
                    })
                    .catch(err => {
                        console.warn('[SecureStackClient] Background refresh failed:', err);
                    });

                return data;
            }
        }

        const { enableCache, cacheTTL, ...fetchOptions } = options || {};
        const response = await this.fetch<TOutput>(url, {
            method: 'GET',
            ...fetchOptions,
        });

        if (enableCache) {
            this.cache.set(url, response.data, cacheTTL);
        } return response.data;
    }

    /**
     * Subscribe to real-time updates
     */
    subscribe<TInput = void, TOutput = unknown>(
        path: string,
        input: TInput,
        options: SubscriptionOptions<TOutput>
    ): () => void {
        if (typeof WebSocket === 'undefined') {
            console.warn('[SecureStackClient] WebSocket is not available in this environment');
            return () => { };
        }

        const id = Math.random().toString(36).substring(7);

        this.connectWs();

        this.subscriptionHandlers.set(id, {
            onData: options.onData,
            onError: options.onError || (() => { }),
            path,
            input
        });

        // Send subscribe message if connected, otherwise it will be sent on open
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.sendWsMessage({
                type: 'SUBSCRIBE',
                id,
                path,
                input
            });
        }

        if (options.onOpen) options.onOpen();

        return () => {
            this.sendWsMessage({ type: 'UNSUBSCRIBE', id });
            this.subscriptionHandlers.delete(id);
            if (options.onClose) options.onClose();
        };
    }

    private getWsUrl(): string {
        const url = new URL(this.config.url);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return url.toString();
    }

    private connectWs() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const wsUrl = this.getWsUrl();
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            // Resubscribe to all active subscriptions
            this.subscriptionHandlers.forEach((handler, id) => {
                this.sendWsMessage({
                    type: 'SUBSCRIBE',
                    id,
                    path: handler.path,
                    input: handler.input
                });
            });
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const { id, type, data, error } = message;

                const handler = this.subscriptionHandlers.get(id);
                if (!handler) return;

                if (type === 'DATA') {
                    handler.onData(data);
                } else if (type === 'ERROR') {
                    handler.onError(error);
                }
            } catch (e) {
                console.error('[SecureStackClient] Failed to parse WS message', e);
            }
        };

        this.ws.onclose = () => {
            // Reconnect logic
            if (this.wsReconnectTimer) clearTimeout(this.wsReconnectTimer);
            this.wsReconnectTimer = setTimeout(() => {
                this.ws = null;
                // Only reconnect if we have active subscriptions
                if (this.subscriptionHandlers.size > 0) {
                    this.connectWs();
                }
            }, 5000);
        };
    }

    private sendWsMessage(message: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Make a mutation request (POST)
     */
    async mutate<TInput = unknown, TOutput = unknown>(
        path: string,
        input: TInput,
        options?: RequestOptions
    ): Promise<TOutput> {
        const url = this.buildUrl(path);
        const { enableCache, cacheTTL, ...fetchOptions } = options || {};
        const response = await this.fetch<TOutput>(url, {
            method: 'POST',
            body: JSON.stringify(input),
            ...fetchOptions,
        });
        return response.data;
    }

    /**
     * Build URL with query parameters
     */
    private buildUrl(path: string, params?: unknown): string {
        // Ensure base URL ends with /
        const baseUrl = this.config.url.endsWith('/')
            ? this.config.url
            : this.config.url + '/';

        // Create full URL by appending path
        const url = new URL(path, baseUrl);

        if (params && typeof params === 'object') {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        return url.toString();
    }

    /**
     * Core fetch implementation with retry logic
     */
    private async fetch<TData>(
        url: string,
        options: RequestInit & RequestOptions = {}
    ): Promise<ClientResponse<TData>> {
        const {
            headers: optionHeaders,
            timeout: optionTimeout,
            signal: optionSignal,
            ...fetchOptions
        } = options;

        const headers = {
            'Content-Type': 'application/json',
            ...this.config.headers,
            ...optionHeaders,
        };

        const timeout = optionTimeout || this.config.timeout;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Combine abort signals
        const signal = optionSignal || this.config.signal;
        if (signal) {
            signal.addEventListener('abort', () => controller.abort());
        }

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw await this.createError(response);
            }

            const data = (await response.json()) as TData;
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            return {
                data,
                headers: responseHeaders,
                status: response.status,
            };
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === 'AbortError') {
                const timeoutError: ClientError = new Error('Request timeout') as ClientError;
                timeoutError.status = 408;
                timeoutError.code = 'TIMEOUT';
                throw timeoutError;
            }

            throw error;
        }
    }

    /**
     * Create a ClientError from a Response
     */
    private async createError(response: Response): Promise<ClientError> {
        let errorData: any;
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: response.statusText };
        }

        const error: ClientError = new Error(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
        ) as ClientError;

        error.status = response.status;
        error.code = errorData.code;
        error.data = errorData.data;

        return error;
    }

    /**
     * Update client configuration
     */
    setConfig(config: Partial<ClientConfig>): void {
        this.config = {
            ...this.config,
            ...config,
        };
    }

    /**
     * Get current configuration
     */
    getConfig(): Readonly<Required<ClientConfig>> {
        return { ...this.config };
    }
}
