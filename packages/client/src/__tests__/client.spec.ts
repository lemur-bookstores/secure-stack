import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecureStackClient } from '../client';
import type { ClientConfig } from '../types';

// Mock global fetch
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe('SecureStackClient', () => {
    let client: SecureStackClient;
    const config: ClientConfig = {
        url: 'http://api.example.com',
        headers: { 'X-Test': 'true' },
    };

    beforeEach(() => {
        client = new SecureStackClient(config);
        globalFetch.mockReset();
    });

    it('should initialize with config', () => {
        const c = client.getConfig();
        expect(c.url).toBe(config.url);
        expect(c.headers).toEqual(config.headers);
    });

    it('should make a query request correctly', async () => {
        const mockData = { id: 1, name: 'Test' };
        globalFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockData,
            headers: new Headers(),
        });

        const result = await client.query('user.get', { id: 1 });

        expect(globalFetch).toHaveBeenCalledWith(
            'http://api.example.com/user.get?id=1',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'X-Test': 'true',
                }),
            })
        );
        expect(result).toEqual(mockData);
    });

    it('should make a mutation request correctly', async () => {
        const mockResponse = { success: true };
        const input = { name: 'New User' };

        globalFetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: async () => mockResponse,
            headers: new Headers(),
        });

        const result = await client.mutate('user.create', input);

        expect(globalFetch).toHaveBeenCalledWith(
            'http://api.example.com/user.create',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(input),
            })
        );
        expect(result).toEqual(mockResponse);
    });

    it('should handle errors correctly', async () => {
        const errorResponse = {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
        };

        globalFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => errorResponse,
        });

        await expect(client.query('user.get')).rejects.toMatchObject({
            status: 400,
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
        });
    });

    it('should handle network timeouts', async () => {
        // Mock fetch to simulate timeout/abort
        globalFetch.mockImplementationOnce(() => {
            return new Promise((_, reject) => {
                const error = new Error('The operation was aborted');
                error.name = 'AbortError';
                reject(error);
            });
        });

        await expect(client.query('slow.endpoint')).rejects.toMatchObject({
            status: 408,
            code: 'TIMEOUT',
        });
    });
});
