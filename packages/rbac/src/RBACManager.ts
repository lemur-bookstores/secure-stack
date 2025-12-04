import { RBACConfig, Role, Permission, AccessRule } from './types';

export class RBACManager {
    private roles: Map<Role, Set<Permission>>;
    private inheritance: Map<Role, Role[]>;
    private rules: AccessRule[];

    constructor(config: RBACConfig) {
        this.roles = new Map();
        this.inheritance = new Map();
        this.rules = [];
        this.init(config);
    }

    private init(config: RBACConfig) {
        // First pass: Register permissions
        for (const roleDef of config.roles) {
            this.roles.set(roleDef.name, new Set(roleDef.permissions));
            if (roleDef.inherits) {
                this.inheritance.set(roleDef.name, roleDef.inherits);
            }
        }

        // Register rules
        if (config.rules) {
            this.rules = config.rules;
        }
    }

    /**
     * Checks access based on dynamic rules
     */
    public async checkAccess(
        user: any,
        userRoles: Role[],
        resourceType: string,
        action: string,
        resource: any
    ): Promise<boolean> {
        // Find matching rules
        const matchingRules = this.rules.filter(rule => {
            const roleMatch = rule.roles.some(r => userRoles.includes(r));
            const resourceMatch = rule.resources.includes(resourceType);
            const actionMatch = rule.actions.includes(action);
            return roleMatch && resourceMatch && actionMatch;
        });

        if (matchingRules.length === 0) {
            return false;
        }

        // Check conditions (OR logic - if any rule allows it, access is granted)
        for (const rule of matchingRules) {
            try {
                const allowed = await rule.condition(user, resource);
                if (allowed) return true;
            } catch (error) {
                console.error('RBAC Rule condition error:', error);
            }
        }

        return false;
    }

    /**
     * Checks if a role has a specific permission, considering inheritance
     */
    public hasPermission(role: Role, permission: Permission): boolean {
        if (!this.roles.has(role)) {
            return false;
        }

        // Check direct permissions
        if (this.roles.get(role)?.has(permission)) {
            return true;
        }

        // Check inherited permissions
        const inheritedRoles = this.inheritance.get(role);
        if (inheritedRoles) {
            for (const inheritedRole of inheritedRoles) {
                if (this.hasPermission(inheritedRole, permission)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Checks if a role has all specified permissions
     */
    public hasAllPermissions(role: Role, permissions: Permission[]): boolean {
        return permissions.every(p => this.hasPermission(role, p));
    }

    /**
     * Checks if a role has at least one of the specified permissions
     */
    public hasAnyPermission(role: Role, permissions: Permission[]): boolean {
        return permissions.some(p => this.hasPermission(role, p));
    }

    /**
     * Validates if a role exists
     */
    public roleExists(role: Role): boolean {
        return this.roles.has(role);
    }

    /**
     * Returns all permissions for a role (including inherited ones)
     */
    public getPermissions(role: Role): Permission[] {
        const permissions = new Set<Permission>();

        if (!this.roles.has(role)) {
            return [];
        }

        // Add direct permissions
        this.roles.get(role)?.forEach(p => permissions.add(p));

        // Add inherited permissions
        const inheritedRoles = this.inheritance.get(role);
        if (inheritedRoles) {
            for (const inheritedRole of inheritedRoles) {
                const inheritedPermissions = this.getPermissions(inheritedRole);
                inheritedPermissions.forEach(p => permissions.add(p));
            }
        }

        return Array.from(permissions);
    }
}
