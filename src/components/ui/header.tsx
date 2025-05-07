"use client";

import React from "react";
import { Bell, Search, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/auth/user-avatar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full flex justify-between items-center px-6 h-16 border-b border-gray-800 bg-[#0F172A] text-white">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 pr-4 w-full bg-[#1E293B] border-0 text-white placeholder:text-gray-500 rounded-md h-9"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />

        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-transparent">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 bg-primary rounded-full w-2 h-2" />
        </Button>

        {/* User profile */}
        <UserAvatar />
      </div>
    </header>
  );
}
