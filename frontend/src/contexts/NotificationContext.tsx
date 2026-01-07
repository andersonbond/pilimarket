import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notifications';
import { Notification } from '../types/notification';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  refreshUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  /**
   * Refresh unread count (lightweight)
   */
  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Failed to fetch unread count:', err);
      // Don't set error for unread count failures (non-critical)
    }
  }, [user]);

  /**
   * Refresh notifications list
   */
  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await notificationService.getNotifications(false, 1, 20);
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to load notifications');
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Refresh to get updated count
      await refreshUnreadCount();
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      // Revert optimistic update on error
      await refreshNotifications();
    }
  }, [refreshUnreadCount, refreshNotifications]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      // Revert on error
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  /**
   * Set up polling for unread count
   * Polls every 30 seconds when tab is visible
   */
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // Initial load
    refreshUnreadCount();

    // Set up polling (only when tab is visible)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when tab is hidden
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } else {
        // Resume polling when tab is visible
        refreshUnreadCount();
        const interval = setInterval(() => {
          refreshUnreadCount();
        }, 30000); // 30 seconds
        setPollingInterval(interval);
      }
    };

    // Start polling
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // 30 seconds
    setPollingInterval(interval);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,
        error,
        refreshUnreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

