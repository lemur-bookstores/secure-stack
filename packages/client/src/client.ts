/**
 * SecureStack Client
 * Core client for making type-safe API calls
 */

import type { ClientConfig, RequestOptions, ClientResponse, ClientError } from './types';

export class SecureStackClient {
    private config: Required<ClientConfig>;

    constructor(config: ClientConfig) {
        this.config = {
            url: config.url,
            headers: config.headers || {},
            timeout: config.timeout || 30000,
            retry: config.retry ?? true,
            maxRetries: config.maxRetries || 3,
            signal: config.signal!,
        };
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
        const response = await this.fetch<TOutput>(url, {
            method: 'GET',
            ...options,
        });
        return response.data;
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
        const response = await this.fetch<TOutput>(url, {
            method: 'POST',
            body: JSON.stringify(input),
            ...options,
        });
        return response.data;
    }

    /**
     * Build URL with query parameters
     */
    private buildUrl(path: string, params?: unknown): string {
        const url = new URL(path, this.config.url);

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
