"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { getAdminConfig, getAdminPermissions, isAuthorizedAdmin, type AdminPermissions } from "@/lib/admin-config";

interface AdminContextType {
  session: Session;
  isStaff: boolean;
  staffRole: 'ADMIN' | 'SUPER_ADMIN' | 'IT_ADMIN' | null;
  permissions: AdminPermissions;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: React.ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { data: session, status } = useSession();
  const [adminData, setAdminData] = useState<AdminContextType | null>(null);

  useEffect(() => {
    if (status === "loading" || !session) {
      setAdminData(null);
      return;
    }

    const userEmail = session.user?.email;
    const userRole = (session.user as any)?.role;
    
    // Check if user is authorized admin using centralized config
    const isStaff = userEmail && isAuthorizedAdmin(userEmail, userRole);

    if (!isStaff) {
      setAdminData(null);
      return;
    }

    // Determine staff role and permissions
    const staffRole: 'ADMIN' | 'SUPER_ADMIN' | 'IT_ADMIN' | null = 
      ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'].includes(userRole) ? userRole : 'ADMIN';

    // Get permissions based on role using centralized config
    const permissions = getAdminPermissions(staffRole);

    setAdminData({
      session,
      isStaff: true,
      staffRole,
      permissions,
    });
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!adminData && status !== "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">This area is restricted to MarketSage staff.</p>
          <a href="/admin-login" className="mt-4 inline-block text-blue-600 hover:text-blue-800 underline">
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={adminData}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}