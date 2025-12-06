import React, { Suspense } from 'react';
import { useSession } from './context';

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(permission: string): boolean {
  const { user } = useSession();
  if (!user) return false;
  return user.permissions?.includes(permission) ?? false;
}

/**
 * Hook to check if the current user has a specific role
 */
export function useRole(role: string | string[]): boolean {
  const { user } = useSession();
  if (!user) return false;

  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

export interface ProtectProps {
  children: React.ReactNode;
  /**
   * Content to show if access is denied
   */
  fallback?: React.ReactNode;
  /**
   * Required permission
   */
  permission?: string;
  /**
   * Required role (or one of the roles)
   */
  role?: string | string[];
}

/**
 * Component to protect content based on permissions or roles
 */
export function Protect({ children, fallback = null, permission, role }: ProtectProps) {
  const { user, isLoading } = useSession();

  if (isLoading) return null;
  if (!user) return <>{fallback}</>;

  if (permission && !user.permissions?.includes(permission)) {
    return <>{fallback}</>;
  }

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * SessionGuard - Guards content based on authentication status
 */
export interface SessionGuardProps {
  children: React.ReactNode;
  /**
   * Required authentication status
   * - 'authenticated': User must be logged in
   * - 'unauthenticated': User must NOT be logged in
   */
  status: 'authenticated' | 'unauthenticated';
  /**
   * Content to show if guard fails
   */
  fallback?: React.ReactNode;
  /**
   * Loading content (shown while session is loading)
   */
  loading?: React.ReactNode;
}

export function SessionGuard({
  children,
  status,
  fallback = null,
  loading = null,
}: SessionGuardProps) {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) return <>{loading}</>;

  const shouldRender = status === 'authenticated' ? isAuthenticated : !isAuthenticated;

  return shouldRender ? <>{children}</> : <>{fallback}</>;
}

/**
 * RoleGate - Guards content based on user roles
 */
export interface RoleGateProps {
  children: React.ReactNode;
  /**
   * User must have at least one of these roles
   */
  anyOf?: string[];
  /**
   * User must have all of these roles
   */
  allOf?: string[];
  /**
   * Content to show if access is denied
   */
  onDeny?: React.ReactNode;
  /**
   * Loading content
   */
  loading?: React.ReactNode;
  /**
   * Enable Suspense boundary
   */
  suspense?: boolean;
}

export function RoleGate({
  children,
  anyOf,
  allOf,
  onDeny = null,
  loading = null,
  suspense = false,
}: RoleGateProps) {
  const { user, isLoading } = useSession();

  if (isLoading) return <>{loading}</>;
  if (!user) return <>{onDeny}</>;

  const userRole = user.role;

  // Check anyOf condition
  if (anyOf && anyOf.length > 0) {
    const hasAnyRole = anyOf.includes(userRole);
    if (!hasAnyRole) return <>{onDeny}</>;
  }

  // Check allOf condition (if user has multiple roles stored in array)
  if (allOf && allOf.length > 0) {
    const userRoles = Array.isArray(user.roles) ? user.roles : [userRole];
    const hasAllRoles = allOf.every((role) => userRoles.includes(role));
    if (!hasAllRoles) return <>{onDeny}</>;
  }

  const content = <>{children}</>;
  return suspense ? <Suspense fallback={loading}>{content}</Suspense> : content;
}

/**
 * PermissionGate - Guards content based on user permissions
 */
export interface PermissionGateProps {
  children: React.ReactNode;
  /**
   * User must have all of these permissions
   */
  allOf?: string[];
  /**
   * User must have at least one of these permissions
   */
  anyOf?: string[];
  /**
   * Content to show if access is denied
   */
  onDeny?: React.ReactNode;
  /**
   * Loading content
   */
  loading?: React.ReactNode;
  /**
   * Enable Suspense boundary
   */
  suspense?: boolean;
}

export function PermissionGate({
  children,
  allOf,
  anyOf,
  onDeny = null,
  loading = null,
  suspense = false,
}: PermissionGateProps) {
  const { user, isLoading } = useSession();

  if (isLoading) return <>{loading}</>;
  if (!user || !user.permissions) return <>{onDeny}</>;

  const userPermissions = user.permissions;

  // Check allOf condition
  if (allOf && allOf.length > 0) {
    const hasAllPermissions = allOf.every((perm) => userPermissions.includes(perm));
    if (!hasAllPermissions) return <>{onDeny}</>;
  }

  // Check anyOf condition
  if (anyOf && anyOf.length > 0) {
    const hasAnyPermission = anyOf.some((perm) => userPermissions.includes(perm));
    if (!hasAnyPermission) return <>{onDeny}</>;
  }

  const content = <>{children}</>;
  return suspense ? <Suspense fallback={loading}>{content}</Suspense> : content;
}
