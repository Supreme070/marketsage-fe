"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search, MessageSquare, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/auth/user-avatar";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

// Sample notification data - in a real app this would come from an API
const SAMPLE_NOTIFICATIONS = [
  {
    id: "1",
    title: "A/B test completed",
    message: "Your 'Welcome Email Subject Line Test' has completed with a winner.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    type: "success",
    link: "/campaigns/ab-testing/email-subject-test-1"
  },
  {
    id: "2",
    title: "New campaign results",
    message: "Your latest email campaign has a 28% open rate so far.",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: false,
    type: "info",
    link: "/email/campaigns/autumn-campaign"
  },
  {
    id: "3",
    title: "Action needed",
    message: "Your WhatsApp API key will expire in 3 days. Please renew it.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    type: "warning",
    link: "/settings/api"
  },
  {
    id: "4",
    title: "System notification",
    message: "Maintenance scheduled for this weekend. No downtime expected.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    type: "info",
    link: "/support"
  }
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
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

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case "success": return "bg-green-500";
      case "warning": return "bg-amber-500";
      case "error": return "bg-red-500";
      default: return "bg-blue-500";
    }
  };

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
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-foreground hover:bg-transparent">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4">
                <h4 className="font-medium text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto py-1 text-xs">
                    Mark all as read
                  </Button>
                )}
              </div>
              <Separator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 hover:bg-muted/50 relative ${!notification.read ? 'bg-muted/30' : ''}`}
                      >
                        <a 
                          href={notification.link} 
                          className="block"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex gap-2">
                            <div className={`h-2 w-2 mt-1.5 rounded-full flex-shrink-0 ${getTypeColor(notification.type)}`} />
                            <div>
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </a>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2 h-6 w-6 p-0"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-3 w-3" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Separator />
              <div className="p-2">
                <Button variant="outline" className="w-full text-sm" size="sm" asChild>
                  <a href="/notifications">View all notifications</a>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User profile */}
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
