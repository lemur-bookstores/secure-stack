import { RBACConfig, Role, Permission } from './types';

export class RBACManager {
    private roles: Map<Role, Set<Permission>>;
    private inheritance: Map<Role, Role[]>;

    constructor(config: RBACConfig) {
        this.roles = new Map();
        this.inheritance = new Map();
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
