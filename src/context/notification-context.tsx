"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { NotificationType, NotificationCategory } from '@/lib/notification-service';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: NotificationType;
  category: NotificationCategory;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refreshNotifications: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const refreshNotifications = async () => {
    if (session?.user && status === 'authenticated') {
      setLoading(true);
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          // Convert string timestamps to Date objects
          const formattedData = data.map((notification: any) => ({
            ...notification,
            timestamp: new Date(notification.timestamp),
          }));
          setNotifications(formattedData);
        } else {
          console.error('Failed to fetch notifications:', res.status, res.statusText);
          // Set empty array to avoid issues
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Set empty array to avoid issues
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    } else {
      // If not authenticated, clear notifications
      setNotifications([]);
    }
  };
  
  useEffect(() => {
    if (status === 'authenticated') {
      refreshNotifications();
      
      // Set up polling for real-time updates
      const interval = setInterval(refreshNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      
      if (res.ok) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
      });
      
      if (res.ok) {
        // Update local state
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext); 