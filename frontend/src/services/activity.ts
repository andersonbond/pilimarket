import api from './api';
import { ActivityListResponse } from '../types/activity';

export const activityService = {
  /**
   * Get user's activity feed
   */
  getUserFeed: async (
    page: number = 1,
    limit: number = 20,
    type?: string,
    marketId?: string
  ): Promise<ActivityListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (type) {
      params.append('type', type);
    }
    if (marketId) {
      params.append('market_id', marketId);
    }
    const response = await api.get(`/activity/feed?${params.toString()}`);
    return response.data;
  },

  /**
   * Get global activity feed
   */
  getGlobalFeed: async (
    page: number = 1,
    limit: number = 50,
    type?: string,
    category?: string
  ): Promise<ActivityListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (type) {
      params.append('type', type);
    }
    if (category) {
      params.append('category', category);
    }
    const response = await api.get(`/activity/global?${params.toString()}`);
    return response.data;
  },
};

