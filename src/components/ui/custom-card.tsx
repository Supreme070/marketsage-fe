import type React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CustomCardProps {
  children: React.ReactNode;
  className?: string;
}

export function CustomCard({ children, className }: CustomCardProps) {
  return (
    <Card className={cn("border border-border shadow-sm", className)}>
      {children}
    </Card>
  );
}

export function CustomCardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardHeader className={cn("p-4 pb-3", className)}>
      {children}
    </CardHeader>
  );
}

export function CustomCardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardTitle className={cn("text-lg font-semibold text-secondary dark:text-primary", className)}>
      {children}
    </CardTitle>
  );
}

export function CustomCardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardDescription className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </CardDescription>
  );
}

export function CustomCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardContent className={cn("p-4 pt-0", className)}>
      {children}
    </CardContent>
  );
}

export function CustomCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardFooter className={cn("p-4 pt-0", className)}>
      {children}
    </CardFooter>
  );
}
