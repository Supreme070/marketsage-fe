"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { NotificationType, NotificationCategory } from '@/lib/notification-service';

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
  
  // Ensure notifications is always an array - defensive programming
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const [loading, setLoading] = useState<boolean>(false);
  
  const refreshNotifications = async () => {
    // Only fetch notifications if user is authenticated
    if (session?.user && status === 'authenticated') {
      setLoading(true);
      try {
        const res = await fetch('/api/v2/notifications');
        if (res.ok) {
          const response = await res.json();
          
          // EXPLICIT DEBUGGING - LOG EVERYTHING ABOUT THE RESPONSE
          console.log('=== NOTIFICATIONS API RESPONSE DEBUG ===');
          console.log('Raw response:', response);
          console.log('Type:', typeof response);
          console.log('Is Array:', Array.isArray(response));
          console.log('Is Object:', response && typeof response === 'object');
          console.log('Keys:', response ? Object.keys(response) : 'null/undefined');
          console.log('Has success property:', response && 'success' in response);
          console.log('Has data property:', response && 'data' in response);
          console.log('Has notifications property:', response && 'notifications' in response);
          console.log('success value:', response?.success);
          console.log('data value:', response?.data);
          console.log('data type:', typeof response?.data);
          console.log('data isArray:', Array.isArray(response?.data));
          console.log('notifications value:', response?.notifications);
          console.log('notifications type:', typeof response?.notifications);
          console.log('notifications isArray:', Array.isArray(response?.notifications));
          console.log('=== END DEBUG ===');
          
          // Handle various backend response formats
          let notifications = [];
          
          // Case 1: { success: true, data: notifications, message: "..." }
          if (response && response.success && Array.isArray(response.data)) {
            notifications = response.data;
            console.log('Using Case 1: success + data array');
          }
          // Case 2: Response is directly an array
          else if (Array.isArray(response)) {
            notifications = response;
            console.log('Using Case 2: direct array');
          }
          // Case 3: { data: notifications } without success field
          else if (response && Array.isArray(response.data)) {
            notifications = response.data;
            console.log('Using Case 3: data array without success');
          }
          // Case 4: { notifications: [...] }
          else if (response && Array.isArray(response.notifications)) {
            notifications = response.notifications;
            console.log('Using Case 4: notifications array');
          }
          // Case 5: Empty or unexpected response
          else {
            console.warn('Unexpected notifications response format:', response);
            notifications = [];
          }
          
          console.log('Final notifications:', notifications);
          console.log('Notifications type:', typeof notifications);
          console.log('Notifications isArray:', Array.isArray(notifications));
          
          // Ensure notifications is always an array before processing
          if (!Array.isArray(notifications)) {
            console.error('Notifications is not an array:', notifications);
            notifications = [];
          }
          
          // Convert string timestamps to Date objects with additional safety checks
          const formattedData = notifications.map((notification: Record<string, unknown>) => {
            try {
              return {
                ...notification,
                timestamp: notification.timestamp ? new Date(notification.timestamp as string | number | Date) : new Date(),
                read: Boolean(notification.read),
                id: String(notification.id || ''),
                title: String(notification.title || ''),
                message: String(notification.message || ''),
                type: (notification.type as NotificationType) || 'info',
                category: (notification.category as NotificationCategory) || 'system',
              };
            } catch (error) {
              console.error('Error formatting notification:', error, notification);
              return {
                id: String(notification.id || ''),
                title: String(notification.title || 'Unknown'),
                message: String(notification.message || ''),
                timestamp: new Date(),
                read: false,
                type: 'info' as const,
                category: 'system' as const,
              };
            }
          });
          
          console.log('Formatted notifications:', formattedData);
          setNotifications(formattedData);
        } else {
          console.error('Failed to fetch notifications:', res.status, res.statusText);
          // Try to get error response body
          try {
            const errorData = await res.json();
            console.log('Error response data:', errorData);
          } catch (e) {
            console.log('Could not parse error response');
          }
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
    // Only refresh notifications if authenticated
    if (session?.user && status === 'authenticated') {
      refreshNotifications();
      
      // Set up polling for real-time updates
      const interval = setInterval(refreshNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    } else {
      // Clear notifications if not authenticated
      setNotifications([]);
    }
  }, [session, status]);
  
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/v2/notifications/${id}/read`, {
        method: 'POST',
      });
      
      if (res.ok) {
        // Update local state with safety checks
        setNotifications(prevNotifications => {
          if (!Array.isArray(prevNotifications)) {
            console.error('Previous notifications is not an array:', prevNotifications);
            return [];
          }
          return prevNotifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          );
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/v2/notifications/read', {
        method: 'POST',
      });
      
      if (res.ok) {
        // Update local state with safety checks
        setNotifications(prevNotifications => {
          if (!Array.isArray(prevNotifications)) {
            console.error('Previous notifications is not an array:', prevNotifications);
            return [];
          }
          return prevNotifications.map(n => ({ ...n, read: true }));
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const unreadCount = Array.isArray(safeNotifications) ? safeNotifications.filter(n => n && !n.read).length : 0;
  
  return (
    <NotificationContext.Provider value={{
      notifications: safeNotifications,
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