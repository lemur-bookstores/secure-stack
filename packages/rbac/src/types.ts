export type Permission = string;
export type Role = string;

export interface RoleDefinition {
    name: Role;
    permissions: Permission[];
    inherits?: Role[];
}

export type Resource = any;
export type User = any;

export type RuleCondition = (user: User, resource: Resource) => boolean | Promise<boolean>;

export interface AccessRule {
    roles: Role[];
    resources: string[];
    actions: string[];
    condition: RuleCondition;
}

export interface RBACConfig {
    roles: RoleDefinition[];
    rules?: AccessRule[];
}
