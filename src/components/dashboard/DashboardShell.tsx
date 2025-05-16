"use client";

import { ReactNode } from "react";

interface DashboardShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function DashboardShell({
  title,
  subtitle,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mt-8">
        {children}
      </div>
    </div>
  );
} 