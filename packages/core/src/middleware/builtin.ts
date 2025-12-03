/**
 * Built-in middlewares
 */

import type { MiddlewareFunction } from './middleware';
import type { DefaultContext } from '../context';

export interface BuiltinContext extends DefaultContext {
    method?: string;
    path?: string;
    procedure?: string;
    error?: any;
    status?: number;
    body?: any;
    headers?: Record<string, string>;
}

/**
 * Logger middleware
 */
export function logger<TContext extends BuiltinContext = BuiltinContext>(): MiddlewareFunction<TContext> {
    return async (ctx: TContext, next) => {
        const start = Date.now();
        console.log(`--> ${ctx.method || 'CALL'} ${ctx.path || ctx.procedure || 'unknown'}`);

        await next();

        const ms = Date.now() - start;
        console.log(`<-- ${ctx.method || 'CALL'} ${ctx.path || ctx.procedure || 'unknown'} ${ms}ms`);
    };
}

/**
 * Error handler middleware
 */
export function errorHandler<TContext extends BuiltinContext = BuiltinContext>(): MiddlewareFunction<TContext> {
    return async (ctx: TContext, next) => {
        try {
            await next();
        } catch (err: any) {
            console.error('Error:', err);
            ctx.error = err;
            ctx.status = err.status || 500;
            ctx.body = {
                error: {
                    message: err.message,
                    code: err.code || 'INTERNAL_ERROR',
                },
            };
        }
    };
}

/**
 * CORS middleware
 */
export function cors<TContext extends BuiltinContext = BuiltinContext>(options: {
    origin?: string | string[];
    credentials?: boolean;
} = {}): MiddlewareFunction<TContext> {
    return async (ctx: TContext, next) => {
        const { origin = '*', credentials = false } = options;

        ctx.headers = ctx.headers || {};
        ctx.headers['Access-Control-Allow-Origin'] = Array.isArray(origin) ? origin.join(',') : origin;
        ctx.headers['Access-Control-Allow-Credentials'] = credentials.toString();

        await next();
    };
}
