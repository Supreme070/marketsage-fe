"use client";

import { AdminProvider } from "@/components/admin/AdminProvider";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import { AdminNav } from "@/components/admin/AdminNav";
import "@/styles/admin.css";

// Admin layout - provides context for authenticated admin pages
// All admin pages are wrapped with AdminProvider and AdminThemeProvider

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminThemeProvider>
      <AdminProvider>
        <div className="admin-portal min-h-screen">
          <div className="admin-fade-in">
            <AdminNav />
            {children}
          </div>
        </div>
      </AdminProvider>
    </AdminThemeProvider>
  );
}