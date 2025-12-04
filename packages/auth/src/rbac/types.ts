export type Permission = string;
export type Role = string;

export interface RoleDefinition {
    name: Role;
    permissions: Permission[];
    inherits?: Role[];
}

export interface RBACConfig {
    roles: RoleDefinition[];
}
