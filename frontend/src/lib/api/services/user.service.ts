// ============================================================
// SIMPRO - User Service for Golang Backend
// ============================================================

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { ApiResponse, PaginationParams, UserSession } from '@/lib/types/api';

export const userService = {
  /**
   * Get list of users with pagination and search
   */
  async getUsers(params?: PaginationParams): Promise<ApiResponse<UserSession[]>> {
    return apiClient.get<UserSession[]>(API_ENDPOINTS.USERS.LIST, { params });
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<UserSession>> {
    return apiClient.get<UserSession>(API_ENDPOINTS.USERS.DETAIL(id));
  },

  /**
   * Update user details
   */
  async updateUser(id: string, data: Partial<UserSession>): Promise<ApiResponse<UserSession>> {
    return apiClient.put<UserSession>(API_ENDPOINTS.USERS.UPDATE(id), data);
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(API_ENDPOINTS.USERS.DELETE(id));
  },
};
