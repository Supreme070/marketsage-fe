"use client";

import { Toaster } from "sonner";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/ui/header";
import AuthCheck from "@/components/auth/auth-check";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthCheck>
      <div className="flex min-h-screen bg-[#0F172A]">
        <Sidebar />
        <div className="flex-1 flex flex-col max-h-screen overflow-hidden bg-background">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </div>
    </AuthCheck>
  );
}
