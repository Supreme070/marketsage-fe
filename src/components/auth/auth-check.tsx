"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface AuthCheckProps {
  children: React.ReactNode;
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If the user is not logged in and the page is not a public route
    if (status === "unauthenticated" && !isPublicRoute(pathname)) {
      router.push("/login");
    }

    // If the user is logged in and trying to access auth pages
    if (status === "authenticated" && isAuthRoute(pathname)) {
      router.push("/dashboard");
    }
  }, [status, router, pathname]);

  // Check if the route is public
  const isPublicRoute = (path: string) => {
    const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
    return publicRoutes.some(route => path.startsWith(route));
  };

  // Check if the route is an auth route
  const isAuthRoute = (path: string) => {
    const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
    return authRoutes.some(route => path.startsWith(route));
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Protected routes
  if (!isPublicRoute(pathname) && status !== "authenticated") {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
