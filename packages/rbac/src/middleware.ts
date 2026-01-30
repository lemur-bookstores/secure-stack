import { MiddlewareFunction } from '@lemur-bookstores/secure-stack-core';
import { RBACManager } from './RBACManager';
import { Permission, Role } from './types';

export interface RBACMiddlewareOptions {
    manager: RBACManager;
    userResolver: (ctx: any) => any;
    rolesResolver: (user: any) => Role[];
}

export class RBACMiddleware {
    private manager: RBACManager;
    private userResolver: (ctx: any) => any;
    private rolesResolver: (user: any) => Role[];

    constructor(options: RBACMiddlewareOptions) {
        this.manager = options.manager;
        this.userResolver = options.userResolver;
        this.rolesResolver = options.rolesResolver;
    }

    /**
     * Middleware to require specific permissions
     */
    public requirePermissions(permissions: Permission[]): MiddlewareFunction {
        return async (ctx: any, next: () => Promise<void>) => {
            const user = this.userResolver(ctx);
            if (!user) {
                throw new Error('User not found in context');
            }

            const roles = this.rolesResolver(user);

            // Check if user has required permissions through any of their roles
            const hasAccess = permissions.every(permission =>
                roles.some(role => this.manager.hasPermission(role, permission))
            );

            if (!hasAccess) {
                throw new Error('Access denied: Insufficient permissions');
            }

            await next();
        };
    }

    /**
     * Middleware to require a specific role
     */
    public requireRole(role: Role): MiddlewareFunction {
        return async (ctx: any, next: () => Promise<void>) => {
            const user = this.userResolver(ctx);
            if (!user) {
                throw new Error('User not found in context');
            }

            const roles = this.rolesResolver(user);
            if (!roles.includes(role)) {
                throw new Error(`Access denied: User does not have role ${role}`);
            }

            await next();
        };
    }

    /**
     * Middleware for dynamic rules
     */
    public requireRule(resourceType: string, action: string, resourceResolver: (ctx: any) => any): MiddlewareFunction {
        return async (ctx: any, next: () => Promise<void>) => {
            const user = this.userResolver(ctx);
            if (!user) {
                throw new Error('User not found in context');
            }

            const roles = this.rolesResolver(user);
            const resource = resourceResolver(ctx);

            const allowed = await this.manager.checkAccess(user, roles, resourceType, action, resource);

            if (!allowed) {
                throw new Error('Access denied by RBAC rule');
            }

            await next();
        };
    }
}
