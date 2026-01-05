export interface Market {
  id: string;
  title: string;
  slug: string;
  description?: string;
  rules?: string;
  image_url?: string;
  category: string;
  status: 'open' | 'suspended' | 'resolved' | 'cancelled';
  resolution_outcome?: string;
  resolution_time?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  meta_data?: Record<string, any>;
  max_points_per_user: number;
  outcomes: Outcome[];
  total_volume?: number;
  consensus?: Record<string, number>; // e.g., {"Yes": 65.5, "No": 34.5}
}

export interface Outcome {
  id: string;
  market_id: string;
  name: string;
  total_points: number;
  percentage?: number;
  created_at?: string;
}

export interface MarketListResponse {
  success: boolean;
  data: {
    markets: Market[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface MarketDetailResponse {
  success: boolean;
  data: {
    market: Market;
  };
}

