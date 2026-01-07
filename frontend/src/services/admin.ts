import api from './api';

export interface AdminStats {
  total_users: number;
  total_markets: number;
  total_forecasts: number;
  total_purchases: number;
  total_revenue_cents: number;
  active_users_30d: number;
  flagged_items_count: number;
  suspended_markets_count: number;
  banned_users_count: number;
  frozen_accounts_count: number;
}

export interface FlaggedItem {
  id: string;
  type: string;
  reason?: string;
  item_id: string;
  flagged_at: string;
  flagged_by?: string;
  status: string;
  meta_data?: Record<string, any>;
}

export interface UserManagement {
  id: string;
  email: string;
  display_name: string;
  contact_number: string;
  chips: number;
  reputation: number;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  is_banned: boolean;
  chips_frozen: boolean;
  created_at: string;
  last_login?: string;
  total_forecasts: number;
  total_purchases: number;
}

export interface MarketManagement {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  created_by?: string;
  created_at: string;
  end_date?: string;
  total_forecasts: number;
  total_points: number;
  is_flagged: boolean;
}

export interface PurchaseMonitoring {
  id: string;
  user_id: string;
  user_email?: string;
  user_display_name?: string;
  amount_cents: number;
  chips_added: number;
  provider: string;
  provider_tx_id?: string;
  status: string;
  created_at: string;
}

export const getAdminStats = async (): Promise<{ success: boolean; data: AdminStats }> => {
  const response = await api.get('/api/v1/admin/stats');
  return response.data;
};

export const getFlaggedItems = async (
  page: number = 1,
  limit: number = 20,
  itemType?: string
): Promise<{ success: boolean; data: { items: FlaggedItem[]; pagination: any } }> => {
  const response = await api.get('/api/v1/admin/flagged', {
    params: { page, limit, item_type: itemType },
  });
  return response.data;
};

export const flagItem = async (
  itemType: string,
  itemId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/api/v1/admin/flag', {
    item_type: itemType,
    item_id: itemId,
    reason,
  });
  return response.data;
};

export const unflagItem = async (
  itemType: string,
  itemId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/api/v1/admin/unflag', {
    item_type: itemType,
    item_id: itemId,
  });
  return response.data;
};

export const suspendMarket = async (
  marketId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/v1/admin/markets/${marketId}/suspend`, { reason });
  return response.data;
};

export const unsuspendMarket = async (
  marketId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/v1/admin/markets/${marketId}/unsuspend`);
  return response.data;
};

export const banUser = async (
  userId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/v1/admin/users/${userId}/ban`, { reason });
  return response.data;
};

export const unbanUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/v1/admin/users/${userId}/unban`);
  return response.data;
};

export const freezeChips = async (
  userId: string,
  freeze: boolean,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/v1/admin/users/${userId}/freeze-chips`, {
    freeze,
    reason,
  });
  return response.data;
};

export const getUsers = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  statusFilter?: string
): Promise<{ success: boolean; data: { users: UserManagement[]; pagination: any } }> => {
  const response = await api.get('/api/v1/admin/users', {
    params: { page, limit, search, status_filter: statusFilter },
  });
  return response.data;
};

export const getMarkets = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  statusFilter?: string,
  categoryFilter?: string
): Promise<{ success: boolean; data: { markets: MarketManagement[]; pagination: any } }> => {
  const response = await api.get('/api/v1/admin/markets', {
    params: { page, limit, search, status_filter: statusFilter, category_filter: categoryFilter },
  });
  return response.data;
};

export const getPurchases = async (
  page: number = 1,
  limit: number = 20,
  userId?: string,
  statusFilter?: string,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; data: { purchases: PurchaseMonitoring[]; pagination: any } }> => {
  const response = await api.get('/api/v1/admin/purchases', {
    params: { page, limit, user_id: userId, status_filter: statusFilter, start_date: startDate, end_date: endDate },
  });
  return response.data;
};

