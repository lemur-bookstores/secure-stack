/**
 * Middleware system for SecureStack
 */

export type MiddlewareFunction<TContext = unknown> = (
    ctx: TContext,
    next: () => Promise<void>
) => Promise<void> | void;

export interface Middleware<TContext = unknown> {
    (ctx: TContext, next: () => Promise<void>): Promise<void>;
}

/**
 * Compose multiple middlewares into a single middleware
 */
export function compose<TContext = unknown>(
    middlewares: MiddlewareFunction<TContext>[]
): Middleware<TContext> {
    if (!Array.isArray(middlewares)) {
        throw new TypeError('Middlewares must be an array');
    }

    for (const fn of middlewares) {
        if (typeof fn !== 'function') {
            throw new TypeError('Middleware must be a function');
        }
    }

    return async function composedMiddleware(ctx: TContext, next: () => Promise<void>) {
        let index = -1;

        async function dispatch(i: number): Promise<void> {
            if (i <= index) {
                throw new Error('next() called multiple times');
            }

            index = i;

            const fn = i === middlewares.length ? next : middlewares[i];

            if (!fn) {
                return;
            }

            try {
                await fn(ctx, () => dispatch(i + 1));
            } catch (err) {
                throw err;
            }
        }

        return dispatch(0);
    };
}

/**
 * Create a middleware
 */
export function createMiddleware<TContext = unknown>(
    fn: MiddlewareFunction<TContext>
): Middleware<TContext> {
    return fn as Middleware<TContext>;
}
