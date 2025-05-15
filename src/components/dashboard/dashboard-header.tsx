import { ReactNode } from 'react';

interface DashboardHeaderProps {
  heading: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export default function DashboardHeader({
  heading,
  description,
  icon,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          {icon && <span className="inline-flex">{icon}</span>}
          {heading}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
} 