"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { hasRequiredRole } from "@/components/auth/role-based-component";

/**
 * Hook for checking user roles in functional components.
 * Returns an object with helper methods to check if the user has specific roles.
 */
export function useRole() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const userRole = session?.user?.role || "USER";

  /**
   * Check if the user has one of the specified roles
   */
  const hasRole = (allowedRoles: (UserRole | string)[]) => {
    if (isLoading) return false;
    const roleStrings = allowedRoles.map((role) => String(role));
    return hasRequiredRole(userRole, roleStrings);
  };

  /**
   * Check if the user is a Super Admin
   */
  const isSuperAdmin = () => {
    return hasRole([UserRole.SUPER_ADMIN]);
  };

  /**
   * Check if the user is an Admin (but not Super Admin)
   */
  const isAdmin = () => {
    return hasRole([UserRole.ADMIN]);
  };

  /**
   * Check if the user is an IT Admin
   */
  const isITAdmin = () => {
    return hasRole([UserRole.IT_ADMIN]);
  };

  /**
   * Check if the user is a regular user
   */
  const isUser = () => {
    return hasRole([UserRole.USER]);
  };

  /**
   * Check if the user is an Admin or Super Admin
   */
  const isAdminOrAbove = () => {
    return hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  };

  /**
   * Check if the user is an IT Admin or Super Admin
   */
  const isITAdminOrAbove = () => {
    return hasRole([UserRole.IT_ADMIN, UserRole.SUPER_ADMIN]);
  };

  /**
   * Check if the user has IT related roles (IT Admin or Super Admin)
   */
  const hasITRole = () => {
    return hasRole([UserRole.IT_ADMIN, UserRole.SUPER_ADMIN]);
  };

  /**
   * Get the user's current role
   */
  const getUserRole = () => userRole;

  return {
    isLoading,
    userRole,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isITAdmin,
    isUser,
    isAdminOrAbove,
    isITAdminOrAbove,
    hasITRole,
    getUserRole,
  };
}
