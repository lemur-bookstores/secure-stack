import { AuditLogger } from './AuditLogger';
import { AuditEvent } from './types';

export interface AuditMiddlewareConfig {
    logger: AuditLogger;
    extractActor?: (ctx: any) => AuditEvent['actor'];
    extractResource?: (ctx: any) => AuditEvent['resource'] | undefined;
    extractMetadata?: (ctx: any) => Record<string, any> | undefined;
    shouldLog?: (ctx: any) => boolean;
}

export function auditMiddleware(config: AuditMiddlewareConfig) {
    const {
        logger,
        extractActor = (ctx) => ({
            id: ctx.user?.id || ctx.userId || 'anonymous',
            ip: ctx.ip || ctx.req?.ip,
            userAgent: ctx.headers?.['user-agent'] || ctx.req?.headers?.['user-agent'],
        }),
        extractResource,
        extractMetadata,
        shouldLog = () => true,
    } = config;

    return async (ctx: any, next: () => Promise<void>) => {
        if (!shouldLog(ctx)) {
            await next();
            return;
        }

        const startTime = Date.now();
        let status: AuditEvent['status'] = 'success';
        let error: AuditEvent['error'] | undefined;

        try {
            await next();
        } catch (err: any) {
            status = 'failure';
            error = {
                code: err.code || 'UNKNOWN_ERROR',
                message: err.message,
                stack: err.stack,
            };
            throw err;
        } finally {
            const action = ctx.procedure?.type || ctx.method || 'unknown';
            const actor = extractActor(ctx);
            const resource = extractResource ? extractResource(ctx) : undefined;
            const metadata = {
                ...extractMetadata?.(ctx),
                duration: Date.now() - startTime,
                path: ctx.path || ctx.url,
            };

            await logger.log(action, actor, status, resource, metadata, error);
        }
    };
}
