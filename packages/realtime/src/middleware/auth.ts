import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';

export type VerifyCallback = (token: string) => Promise<any>;

export interface AuthOptions {
    verify: VerifyCallback;
    tokenKey?: string; // Default: 'token'
}

export const socketAuthMiddleware = (options: AuthOptions) => {
    return async (socket: Socket, next: (err?: ExtendedError) => void) => {
        const tokenKey = options.tokenKey || 'token';
        const token =
            socket.handshake.auth[tokenKey] ||
            socket.handshake.headers[tokenKey] ||
            socket.handshake.query[tokenKey];

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const user = await options.verify(token as string);
            if (!user) {
                return next(new Error('Authentication error: Invalid token'));
            }
            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: ' + (err instanceof Error ? err.message : 'Unknown error')));
        }
    };
};
