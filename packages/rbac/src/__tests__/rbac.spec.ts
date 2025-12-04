import { describe, it, expect } from 'vitest';
import { RBACManager } from '../RBACManager';
import { RBACConfig } from '../types';

describe('RBACManager', () => {
    const config: RBACConfig = {
        roles: [
            {
                name: 'user',
                permissions: ['read:profile', 'update:profile'],
            },
            {
                name: 'editor',
                permissions: ['create:post', 'update:post'],
                inherits: ['user'],
            },
            {
                name: 'admin',
                permissions: ['delete:post', 'manage:users'],
                inherits: ['editor'],
            },
        ],
    };

    const rbac = new RBACManager(config);

    it('should correctly check direct permissions', () => {
        expect(rbac.hasPermission('user', 'read:profile')).toBe(true);
        expect(rbac.hasPermission('user', 'delete:post')).toBe(false);
    });

    it('should correctly check inherited permissions', () => {
        expect(rbac.hasPermission('editor', 'read:profile')).toBe(true); // Inherited from user
        expect(rbac.hasPermission('editor', 'create:post')).toBe(true); // Direct
        expect(rbac.hasPermission('admin', 'read:profile')).toBe(true); // Inherited from editor -> user
    });

    it('should check for all permissions', () => {
        expect(rbac.hasAllPermissions('editor', ['read:profile', 'create:post'])).toBe(true);
        expect(rbac.hasAllPermissions('user', ['read:profile', 'create:post'])).toBe(false);
    });

    it('should check for any permission', () => {
        expect(rbac.hasAnyPermission('user', ['read:profile', 'delete:post'])).toBe(true);
        expect(rbac.hasAnyPermission('user', ['delete:post', 'manage:users'])).toBe(false);
    });

    it('should return all permissions for a role', () => {
        const permissions = rbac.getPermissions('editor');
        expect(permissions).toContain('read:profile');
        expect(permissions).toContain('update:profile');
        expect(permissions).toContain('create:post');
        expect(permissions).toContain('update:post');
        expect(permissions).not.toContain('delete:post');
    });

    it('should handle non-existent roles', () => {
        expect(rbac.hasPermission('guest', 'read:profile')).toBe(false);
        expect(rbac.getPermissions('guest')).toEqual([]);
    });

    it('should check dynamic rules', async () => {
        const configWithRules: RBACConfig = {
            roles: [
                { name: 'user', permissions: [] },
                { name: 'admin', permissions: [] }
            ],
            rules: [
                {
                    roles: ['user'],
                    resources: ['post'],
                    actions: ['update'],
                    condition: (user, post) => user.id === post.authorId
                }
            ]
        };
        const rbacWithRules = new RBACManager(configWithRules);

        const user1 = { id: '1' };
        const user2 = { id: '2' };
        const post = { authorId: '1', content: 'hello' };

        // User 1 is author
        expect(await rbacWithRules.checkAccess(user1, ['user'], 'post', 'update', post)).toBe(true);

        // User 2 is not author
        expect(await rbacWithRules.checkAccess(user2, ['user'], 'post', 'update', post)).toBe(false);

        // Wrong action
        expect(await rbacWithRules.checkAccess(user1, ['user'], 'post', 'delete', post)).toBe(false);

        // Wrong role
        expect(await rbacWithRules.checkAccess(user1, ['guest'], 'post', 'update', post)).toBe(false);
    });
});
