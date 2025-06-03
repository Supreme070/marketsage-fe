import type { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export default function DashboardShell({
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className={`flex-1 space-y-4 p-4 pt-6 md:p-8 ${className || ''}`}>
      {children}
    </div>
  );
} 