"use client";

import React from "react";
import { Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={cn("h-14 flex items-center px-6 border-b border-border bg-background", className)}>
      <div className="flex-1">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 bg-secondary/10 border-secondary/20 h-9"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />

        <div className="relative">
          <button className="p-2 rounded-full hover:bg-secondary/10">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 bg-primary w-2 h-2 rounded-full"></span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-secondary h-8 w-8 rounded-full flex items-center justify-center text-white">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">User</span>
        </div>
      </div>
    </header>
  );
}
