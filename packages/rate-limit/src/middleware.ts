import { RateLimitManager } from './RateLimitManager';
import { RateLimitConfig } from './types';

export function rateLimitMiddleware(config: Partial<RateLimitConfig> & { windowMs: number; max: number }) {
    const manager = new RateLimitManager(config);

    return async (ctx: any, next: () => Promise<void>) => {
        // Default key generator uses IP if available
        const key = config.keyGenerator
            ? config.keyGenerator(ctx)
            : (ctx.ip || ctx.req?.ip || ctx.request?.ip || 'unknown');

        const { isRateLimited, info } = await manager.checkLimit(key);

        // Set headers if enabled
        if (config.headers !== false) {
            const setHeader = (name: string, value: string | number) => {
                if (typeof ctx.set === 'function') ctx.set(name, String(value));
                else if (ctx.res?.setHeader) ctx.res.setHeader(name, String(value));
                else if (ctx.response?.headers?.set) ctx.response.headers.set(name, String(value));
            };

            setHeader('X-RateLimit-Limit', info.limit);
            setHeader('X-RateLimit-Remaining', info.remaining);
            setHeader('X-RateLimit-Reset', Math.ceil(info.resetTime.getTime() / 1000));
        }

        if (isRateLimited) {
            const statusCode = config.statusCode || 429;
            const message = config.message || 'Too many requests, please try again later.';

            if (ctx.status !== undefined) ctx.status = statusCode;
            else if (ctx.res) ctx.res.statusCode = statusCode;

            if (ctx.body !== undefined) ctx.body = message;
            else if (ctx.res?.end) ctx.res.end(message);
            else if (ctx.send) ctx.send(message);
            else throw new Error(message); // Fallback

            return; // Stop execution
        }

        await next();
    };
}
