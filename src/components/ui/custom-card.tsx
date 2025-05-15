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
import { type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

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
interface CustomCardMetricProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  trendType: "up" | "down" | "neutral";
  description: string;
  className?: string;
}

export function CustomCardMetric({
  icon,
  title,
  value,
  trend,
  trendType,
  description,
  className,
}: CustomCardMetricProps) {
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
    <Card className={cn(
      "overflow-hidden transition-all",
      isLight 
        ? "border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300/80" 
        : "border border-gray-800/60 bg-card/50 backdrop-blur-sm hover:bg-card/70",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full", 
            isLight ? "bg-primary/10" : "bg-primary/20"
          )}>
            {icon}
          </div>
          <div className={cn(
            "flex items-center rounded-full px-2 py-1 text-xs font-medium",
            trendType === "up" 
              ? "bg-green-500/10 text-green-500" 
              : trendType === "down" 
                ? "bg-red-500/10 text-red-500" 
                : "bg-gray-500/10 text-gray-500"
          )}>
            {trend}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

