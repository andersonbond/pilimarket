export interface User {
  id: string;
  email: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  chips: number;
  reputation: number;
  badges: string[];
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  is_admin: boolean;
  is_banned?: boolean;
  chips_frozen?: boolean;
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  display_name: string;
  contact_number: string;
}

