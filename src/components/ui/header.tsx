"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/auth/user-avatar";
import { useTheme } from "next-themes";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);
  
  // Handle scroll effect for glass background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    setMounted(true);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme || "dark");
    }
  }, [theme, mounted]);

  const isLight = currentTheme === "light";

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? isLight 
          ? 'bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm' 
          : 'glass-nav border-b border-gray-800/60' 
        : 'bg-background'
    }`}>
      <div className="flex justify-between items-center px-4 md:px-6 h-16">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className={`pl-10 pr-4 w-full ${isLight ? 'bg-gray-100' : 'bg-muted'} border-0 rounded-md h-9`}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {/* Notification bell */}
          <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-foreground hover:bg-transparent">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 bg-primary rounded-full w-2 h-2" />
          </Button>

          {/* User profile */}
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
