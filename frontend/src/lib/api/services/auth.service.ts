// ============================================================
// SIMPRO - Auth Service for Golang Backend
// ============================================================

import { apiClient, tokenStorage } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  AuthResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UserSession,
} from '@/lib/types/api';
import type { Role } from '@/lib/types';

export const authService = {
  /**
   * Login user with email and password
   */
  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, payload, {
      requiresAuth: false,
    });

    if (res.data?.tokens?.access_token) {
      tokenStorage.setAccessToken(res.data.tokens.access_token);
      if (res.data.tokens.refresh_token) {
        tokenStorage.setRefreshToken(res.data.tokens.refresh_token);
      }
    }

    return res;
  },

  /**
   * Register a new user
   */
  async register(payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, payload, {
      requiresAuth: false,
    });

    if (res.data?.tokens?.access_token) {
      tokenStorage.setAccessToken(res.data.tokens.access_token);
      if (res.data.tokens.refresh_token) {
        tokenStorage.setRefreshToken(res.data.tokens.refresh_token);
      }
    }

    return res;
  },

  /**
   * Fetch current authenticated user session
   */
  async getMe(): Promise<ApiResponse<UserSession>> {
    return apiClient.get<UserSession>(API_ENDPOINTS.AUTH.ME);
  },

  /**
   * Switch user active role
   */
  async switchRole(role: Role): Promise<ApiResponse<UserSession>> {
    return apiClient.post<UserSession>(API_ENDPOINTS.AUTH.SWITCH_ROLE, { role });
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const refreshToken = tokenStorage.getRefreshToken();
    const res = await apiClient.post<AuthTokens>(API_ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken,
    }, { requiresAuth: false });

    if (res.data?.access_token) {
      tokenStorage.setAccessToken(res.data.access_token);
    }

    return res;
  },

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Ignore network error on logout
    } finally {
      tokenStorage.clearTokens();
    }
  },
};
