import type React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, backHref, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div className="flex flex-col gap-1">
        {backHref && (
          <Link href={backHref} className="flex items-center text-sm text-muted-foreground mb-1 hover:text-primary transition">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        )}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex-shrink-0 mt-4 md:mt-0">{actions}</div>
      )}
    </div>
  );
} 