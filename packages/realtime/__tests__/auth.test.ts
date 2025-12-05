import { describe, it, expect, vi } from 'vitest';
import { socketAuthMiddleware } from '../src/middleware/auth.js';

describe('SocketAuthMiddleware', () => {
    it('should authenticate with valid token', async () => {
        const verify = vi.fn().mockResolvedValue({ id: 'user1' });
        const middleware = socketAuthMiddleware({ verify });

        const socket: any = {
            handshake: { auth: { token: 'valid' }, headers: {}, query: {} },
            user: null,
        };
        const next = vi.fn();

        await middleware(socket, next);

        expect(verify).toHaveBeenCalledWith('valid');
        expect(socket.user).toEqual({ id: 'user1' });
        expect(next).toHaveBeenCalledWith();
    });

    it('should fail with missing token', async () => {
        const verify = vi.fn();
        const middleware = socketAuthMiddleware({ verify });

        const socket: any = {
            handshake: { auth: {}, headers: {}, query: {} },
        };
        const next = vi.fn();

        await middleware(socket, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('Token missing');
    });

    it('should fail with invalid token', async () => {
        const verify = vi.fn().mockResolvedValue(null);
        const middleware = socketAuthMiddleware({ verify });

        const socket: any = {
            handshake: { auth: { token: 'invalid' }, headers: {}, query: {} },
        };
        const next = vi.fn();

        await middleware(socket, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('Invalid token');
    });

    it('should check headers and query for token', async () => {
        const verify = vi.fn().mockResolvedValue({ id: 'user1' });
        const middleware = socketAuthMiddleware({ verify });

        // Check headers
        const socket1: any = {
            handshake: { auth: {}, headers: { token: 'valid' }, query: {} },
        };
        await middleware(socket1, vi.fn());
        expect(verify).toHaveBeenCalledWith('valid');

        // Check query
        const socket2: any = {
            handshake: { auth: {}, headers: {}, query: { token: 'valid2' } },
        };
        await middleware(socket2, vi.fn());
        expect(verify).toHaveBeenCalledWith('valid2');
    });
});
