import { AuthModule } from '@lemur-bookstores/auth';
import { MiddlewareFunction, SecureStackError, ErrorCode } from '@lemur-bookstores/core';

export interface AuthenticatedContext {
    user?: {
        userId: string;
        role?: string;
        [key: string]: any;
    };
    headers?: Record<string, string>;
}

export function createAuthMiddleware(auth: AuthModule): MiddlewareFunction {
    return async (ctx: any, next) => {
        const authHeader = ctx.headers?.['authorization'];

        if (!authHeader) {
            throw new SecureStackError({
                code: ErrorCode.UNAUTHORIZED,
                message: 'Missing authorization header'
            });
        }

        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !token) {
            throw new SecureStackError({
                code: ErrorCode.UNAUTHORIZED,
                message: 'Invalid authorization header format'
            });
        }

        try {
            const payload = auth.jwt.verifyToken(token);
            ctx.user = payload;
        } catch (error) {
            throw new SecureStackError({
                code: ErrorCode.UNAUTHORIZED,
                message: 'Invalid or expired token'
            });
        }

        await next();
    };
}

export function createRoleMiddleware(auth: AuthModule, requiredPermissions: string[]): MiddlewareFunction {
    return async (ctx: any, next) => {
        if (!ctx.user) {
            throw new SecureStackError({
                code: ErrorCode.UNAUTHORIZED,
                message: 'User not authenticated'
            });
        }

        if (!auth.rbac) {
            throw new SecureStackError({
                code: ErrorCode.INTERNAL_ERROR,
                message: 'RBAC is not configured on the server'
            });
        }

        const userRole = ctx.user.role;

        if (!userRole) {
            throw new SecureStackError({
                code: ErrorCode.FORBIDDEN,
                message: 'User has no role assigned'
            });
        }

        const hasPermission = auth.rbac.hasAllPermissions(userRole, requiredPermissions);

        if (!hasPermission) {
            throw new SecureStackError({
                code: ErrorCode.FORBIDDEN,
                message: 'Insufficient permissions'
            });
        }

        await next();
    };
}