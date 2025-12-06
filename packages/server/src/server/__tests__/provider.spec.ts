import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecureStackServer } from '../SecureStackServer';
import { router } from '@lemur-bookstores/core';

describe('SecureStackServer Provider Integration', () => {
    let server: SecureStackServer;

    beforeEach(() => {
        server = new SecureStackServer({
            name: 'test-server',
            port: 3000,
        });
    });

    it('should register a provider', () => {
        const mockProvider = { foo: 'bar' };
        server.registerProvider('testProvider', mockProvider);

        // Access private property for testing
        const providers = (server as any).providers;
        expect(providers.get('testProvider')).toBe(mockProvider);
    });

    it('should inject provider into context', async () => {
        const mockRealtime = { emit: vi.fn() };
        server.registerProvider('realtime', mockRealtime);

        // Create a router that uses the context
        const testRouter = router().query('test', {
            handler: async ({ ctx }: any) => {
                return { hasRealtime: !!ctx.realtime };
            }
        });

        server.router('test', testRouter);

        // Mock fastify injection
        // Since we can't easily start the full server in unit test without port conflicts,
        // we'll inspect the registerHTTPRoutes logic via a spy or just trust the integration.
        // But let's try to simulate a request if possible or just check the logic.

        // Actually, we can use fastify.inject() if we expose it.
        // SecureStackServer doesn't expose fastify instance publicly but we can cast to any.

        await (server as any).init();
        // (server as any).registerHTTPRoutes();

        const response = await (server as any).fastify.inject({
            method: 'GET',
            url: '/api/test/test',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.hasRealtime).toBe(true);
    });
});
