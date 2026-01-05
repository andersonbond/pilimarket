export interface Purchase {
  id: string;
  user_id: string;
  amount_cents: number;
  chips_added: number;
  provider: 'test' | 'stripe' | 'gcash' | 'paymaya';
  provider_tx_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface PurchaseCreate {
  chips_added: number;
}

export interface PurchaseResponse {
  success: boolean;
  data: {
    purchase: Purchase;
    new_balance: number;
  };
  message: string;
}

export interface PurchaseListResponse {
  success: boolean;
  data: {
    purchases: Purchase[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

