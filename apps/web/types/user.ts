export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  api_quota_used: number;
  api_quota_limit: number;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  plan: string;
  status: string;
  email_verified: boolean;
  api_quota_used: number;
  api_quota_limit: number;
  created_at: string;
  updated_at: string;
}