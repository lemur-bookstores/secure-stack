import { describe, it, expect, vi } from 'vitest';
import { RBACManager } from '../RBACManager';
import { RBACMiddleware } from '../middleware';
import { RBACConfig } from '../types';

describe('RBACMiddleware', () => {
    const config: RBACConfig = {
        roles: [
            { name: 'user', permissions: ['read'] },
            { name: 'admin', permissions: ['write'] }
        ],
        rules: [
            {
                roles: ['user'],
                resources: ['post'],
                actions: ['edit'],
                condition: (user, post) => user.id === post.authorId
            }
        ]
    };
    const manager = new RBACManager(config);

    const middleware = new RBACMiddleware({
        manager,
        userResolver: (ctx) => ctx.user,
        rolesResolver: (user) => user.roles
    });

    it('should allow access if user has permission', async () => {
        const ctx = { user: { id: '1', roles: ['user'] } };
        const next = vi.fn();

        await middleware.requirePermissions(['read'])(ctx, next);
        expect(next).toHaveBeenCalled();
    });

    it('should deny access if user lacks permission', async () => {
        const ctx = { user: { id: '1', roles: ['user'] } };
        const next = vi.fn();

        await expect(middleware.requirePermissions(['write'])(ctx, next)).rejects.toThrow('Access denied');
        expect(next).not.toHaveBeenCalled();
    });

    it('should allow access based on dynamic rule', async () => {
        const ctx = {
            user: { id: '1', roles: ['user'] },
            post: { authorId: '1' }
        };
        const next = vi.fn();

        await middleware.requireRule('post', 'edit', (c) => c.post)(ctx, next);
        expect(next).toHaveBeenCalled();
    });

    it('should deny access based on dynamic rule failure', async () => {
        const ctx = {
            user: { id: '2', roles: ['user'] },
            post: { authorId: '1' }
        };
        const next = vi.fn();

        await expect(middleware.requireRule('post', 'edit', (c) => c.post)(ctx, next)).rejects.toThrow('Access denied');
        expect(next).not.toHaveBeenCalled();
    });
});
