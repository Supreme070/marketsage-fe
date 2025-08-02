"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/hooks/use-role";
import type { ReactNode } from "react";

export function hasRequiredRole(userRole: string, allowedRoles: string[]) {
  if (!userRole || !allowedRoles || allowedRoles.length === 0) {
    return false;
  }

  // Convert to uppercase to match enum values
  const normalizedUserRole = userRole.toUpperCase();
  const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase());

  return normalizedAllowedRoles.includes(normalizedUserRole);
}

interface RoleBasedComponentProps {
  children: ReactNode;
  allowedRoles: (UserRole | string)[];
  fallback?: ReactNode;
}

/**
 * A component that renders its children only if the current user has one of the allowed roles.
 * Optionally displays a fallback component if the user doesn't have the required role.
 */
export function RoleBasedComponent({
  children,
  allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.USER],
  fallback = null,
}: RoleBasedComponentProps) {
  const { data: session, status } = useSession();

  // If the session is loading, don't render anything
  if (status === "loading") {
    return null;
  }

  // Get user role from session, default to USER if not present
  const userRole = session?.user?.role || "USER";

  // Convert enum values to strings
  const roleStrings = allowedRoles.map(role => String(role));

  // Check if the user has one of the allowed roles
  if (!hasRequiredRole(userRole, roleStrings)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * A component that renders its children only if the current user is a Super Admin.
 */
export function SuperAdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedComponent allowedRoles={[UserRole.SUPER_ADMIN]} fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
}

/**
 * A component that renders its children only if the current user is an Admin or Super Admin.
 */
export function AdminOrAbove({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedComponent allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]} fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
}

/**
 * A component that renders its children only if the current user is an IT Admin or Super Admin.
 */
export function ITAdminOrAbove({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedComponent allowedRoles={[UserRole.SUPER_ADMIN, UserRole.IT_ADMIN]} fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
}

/**
 * A component that renders its children for IT Admin and Super Admin, but not regular Admins.
 */
export function ITRoleOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedComponent allowedRoles={[UserRole.SUPER_ADMIN, UserRole.IT_ADMIN]} fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
}
