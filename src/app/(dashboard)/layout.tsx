"use client";

import { Toaster } from "sonner";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/ui/header";
import AuthCheck from "@/components/auth/auth-check";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme || "dark");
    }
  }, [theme, mounted]);

  const isLight = currentTheme === "light";

  return (
    <AuthCheck>
      <div className={cn(
        "flex min-h-screen",
        isLight ? "bg-gray-50" : "bg-background"
      )}>
        <Sidebar />
        <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
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
