export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  meta_data?: Record<string, any>;
  created_at: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unread_count: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unread_count: number;
  };
}

