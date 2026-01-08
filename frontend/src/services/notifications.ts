import api from './api';
import { NotificationListResponse, UnreadCountResponse } from '../types/notification';

export const notificationService = {
  /**
   * Get user's notifications
   */
  getNotifications: async (
    unreadOnly: boolean = false,
    page: number = 1,
    limit: number = 20,
    type?: string
  ): Promise<NotificationListResponse> => {
    const params = new URLSearchParams({
      unread_only: unreadOnly.toString(),
      page: page.toString(),
      limit: limit.toString(),
    });
    if (type) {
      params.append('type', type);
    }
    const response = await api.get(`/api/v1/notifications?${params.toString()}`);
    return response.data;
  },

  /**
   * Get unread count only (lightweight)
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>('/api/v1/notifications/unread-count');
    return response.data.data.unread_count;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    await api.post(`/api/v1/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.post('/api/v1/notifications/read-all');
  },
};

