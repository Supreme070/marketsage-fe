import type React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Card className="w-full border border-dashed py-8">
      <CardContent className="flex flex-col items-center justify-center text-center p-6">
        {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
        <CardTitle className="text-xl font-semibold mb-2">{title}</CardTitle>
        {description && (
          <CardDescription className="max-w-md mb-6">
            {description}
          </CardDescription>
        )}
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  );
} 