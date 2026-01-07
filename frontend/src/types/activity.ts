export interface Activity {
  id: string;
  user_id?: string;
  activity_type: string;
  market_id?: string;
  meta_data?: Record<string, any>;
  created_at: string;
  user_display_name?: string;
  market_title?: string;
}

export interface ActivityListResponse {
  success: boolean;
  data: {
    activities: Activity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

