// ============================================================
// SIMPRO - Golang Backend API Types & Envelopes
// ============================================================

import type { Role } from '@/lib/types';

/**
 * Standard Success Response envelope from Golang backend
 * Format matches Golang: gin.H{"success": true, "message": "...", "data": ...}
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Standard Error Response envelope from Golang backend
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[] | string>;
}

/**
 * Standard Pagination Metadata from Golang backend
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

/**
 * Standard Request Query Parameters for List/Paginated Endpoints
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Authentication tokens returned by Golang backend (JWT)
 */
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string; // usually 'Bearer'
  expires_in?: number; // seconds
}

/**
 * Authenticated User Profile from Golang backend
 */
export interface UserSession {
  id: string;
  nama_lengkap: string;
  email: string;
  username?: string;
  roles: Role[];
  active_role: Role;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Auth Login payload
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Auth Register payload
 */
export interface RegisterPayload {
  nama_lengkap: string;
  email: string;
  password: string;
  roles?: Role[];
}

/**
 * Auth Response after successful login/register
 */
export interface AuthResponse {
  user: UserSession;
  tokens: AuthTokens;
}
