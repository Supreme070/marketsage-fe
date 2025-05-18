"use client";

import React, { useState } from "react";
import { Search, Bell, User, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/context/notification-context";

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

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case "success": return "bg-green-500";
      case "warning": return "bg-amber-500";
      case "error": return "bg-red-500";
      default: return "bg-blue-500";
    }
  };

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

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-full hover:bg-secondary/10 relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4">
              <h4 className="font-medium text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="h-auto py-1 text-xs">
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
                  {notifications.slice(0, 5).map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 relative ${!notification.read ? 'bg-muted/30' : ''}`}
                    >
                      <a 
                        href={notification.link || "#"} 
                        className="block"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex gap-2">
                          <div className={`h-2 w-2 mt-1.5 rounded-full flex-shrink-0 ${getTypeColor(notification.type)}`} />
                          <div>
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
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
                <a href="/dashboard/notifications">View all notifications</a>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

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
