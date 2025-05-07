"use client";

import { useSession } from "next-auth/react";
import type { PropsWithChildren } from "react";

type RoleGateProps = PropsWithChildren<{
  allowedRoles: string[];
  fallback?: React.ReactNode;
}>;

/**
 * A component that restricts access based on user roles.
 * Only renders its children if the current user has one of the allowed roles.
 */
export default function RoleGate({
  allowedRoles,
  children,
  fallback,
}: RoleGateProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "USER";

  if (!session?.user) {
    return fallback || null;
  }

  if (!allowedRoles.includes(userRole)) {
    return fallback || null;
  }

  return <>{children}</>;
}
