"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Bell, Check, Filter, Search, 
  ArrowUpDown, CheckCheck, AlertTriangle, Info, CheckCircle 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNotifications } from "@/context/notification-context";

// This would come from an API in a real application
const SAMPLE_NOTIFICATIONS = [
  {
    id: "1",
    title: "A/B test completed",
    message: "Your 'Welcome Email Subject Line Test' has completed with a winner.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    type: "success",
    link: "/campaigns/ab-testing/email-subject-test-1",
    category: "campaigns"
  },
  {
    id: "2",
    title: "New campaign results",
    message: "Your latest email campaign has a 28% open rate so far.",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: false,
    type: "info",
    link: "/email/campaigns/autumn-campaign",
    category: "campaigns"
  },
  {
    id: "3",
    title: "Action needed",
    message: "Your WhatsApp API key will expire in 3 days. Please renew it.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    type: "warning",
    link: "/settings/api",
    category: "system"
  },
  {
    id: "4",
    title: "System notification",
    message: "Maintenance scheduled for this weekend. No downtime expected.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    type: "info",
    link: "/support",
    category: "system"
  },
  {
    id: "5",
    title: "New contact added",
    message: "Contact 'John Doe' was added to your database.",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    read: true,
    type: "success",
    link: "/contacts/view/123",
    category: "contacts"
  },

  {
    id: "7",
    title: "Segment updated",
    message: "Your 'High Value Customers' segment now has 24 contacts.",
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    read: true,
    type: "info",
    link: "/segments/high-value-customers",
    category: "segments"
  },
  {
    id: "8",
    title: "Workflow error",
    message: "Your 'Lead Nurturing' workflow has an error in the delay step.",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    read: true,
    type: "error",
    link: "/workflows/lead-nurturing",
    category: "workflows"
  }
];

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const filteredNotifications = notifications
    .filter(notification => {
      // Filter by type
      if (filter !== "all" && notification.type !== filter && notification.category !== filter) {
        return false;
      }
      
      // Filter by search
      if (search && !notification.title.toLowerCase().includes(search.toLowerCase()) && 
          !notification.message.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by date
      if (sortBy === "newest") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
    });
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            View and manage your notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllAsRead()} variant="outline" className="flex items-center gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-64 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">By Type</p>
                <div className="space-y-1">
                  <Button 
                    variant={filter === "all" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setFilter("all")}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    All Notifications
                  </Button>
                  <Button 
                    variant={filter === "info" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setFilter("info")}
                  >
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                    Information
                  </Button>
                  <Button 
                    variant={filter === "success" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setFilter("success")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Success
                  </Button>
                  <Button 
                    variant={filter === "warning" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setFilter("warning")}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    Warning
                  </Button>
                  <Button 
                    variant={filter === "error" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setFilter("error")}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Error
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">By Category</p>
                <div className="space-y-1">
                  <Button 
                    variant={filter === "campaigns" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setFilter("campaigns")}
                  >
                    Campaigns
                  </Button>
                  <Button 
                    variant={filter === "contacts" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setFilter("contacts")}
                  >
                    Contacts
                  </Button>
                  <Button 
                    variant={filter === "workflows" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setFilter("workflows")}
                  >
                    Workflows
                  </Button>
                  <Button 
                    variant={filter === "system" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setFilter("system")}
                  >
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>All Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-60">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search notifications..."
                      className="pl-8 h-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="read">Read</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <NotificationList 
                    notifications={filteredNotifications} 
                    markAsRead={markAsRead}
                    getTypeIcon={getTypeIcon}
                    loading={loading}
                  />
                </TabsContent>
                <TabsContent value="unread">
                  <NotificationList 
                    notifications={filteredNotifications.filter(n => !n.read)} 
                    markAsRead={markAsRead}
                    getTypeIcon={getTypeIcon}
                    loading={loading}
                  />
                </TabsContent>
                <TabsContent value="read">
                  <NotificationList 
                    notifications={filteredNotifications.filter(n => n.read)} 
                    markAsRead={markAsRead}
                    getTypeIcon={getTypeIcon}
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface NotificationListProps {
  notifications: any[];
  markAsRead: (id: string) => Promise<void>;
  getTypeIcon: (type: string) => React.ReactNode;
  loading: boolean;
}

function NotificationList({ notifications, markAsRead, getTypeIcon, loading }: NotificationListProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-lg font-medium">Loading notifications...</p>
      </div>
    );
  }
  
  if (notifications.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No notifications found</p>
        <p className="text-sm">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 divide-y">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`py-4 relative ${!notification.read ? 'bg-muted/30 rounded-md px-2' : ''}`}
        >
          <a 
            href={notification.link || "#"} 
            className="block"
            onClick={() => !notification.read && markAsRead(notification.id)}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                {getTypeIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                    {notification.category}
                  </span>
                  {!notification.read && (
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      Unread
                    </span>
                  )}
                </div>
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
  );
} 