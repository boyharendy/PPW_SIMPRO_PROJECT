import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiResponse, RpsRecap } from '@/lib/types/api';
import type { RpsSubmission, RpsReview } from '@/lib/types';

export const rpsService = {
  // Ambil daftar pengajuan RPS mata kuliah
  getSubmissions: async (params?: Record<string, unknown>): Promise<ApiResponse<RpsSubmission[]>> => {
    return apiRequest<RpsSubmission[]>(API_ENDPOINTS.RPS.LIST, { params });
  },

  getSubmissionById: async (id: string): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.DETAIL(id));
  },

  createSubmission: async (data: Partial<RpsSubmission>): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.CREATE, {
        method: 'POST',
        body: data,
      });
  },

  assignReviewer: async (id: string, reviewerId: string): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.DETAIL(id)+'/assign-reviewer', {
        method: 'POST',
        body: { reviewer_id: reviewerId },
      });
  },

  submitForReview: async (id: string): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.SUBMIT(id), {
        method: 'POST',
      });
  },

  reviewSubmission: async (id: string, data: Partial<RpsReview>): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.REVIEW(id), {
        method: 'POST',
        body: data,
      });
  },

  ratifySubmission: async (id: string): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.RATIFY(id), {
        method: 'POST',
      });
  },

  approveSubmission: async (id: string, catatan?: string): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.RATIFY(id), {
        method: 'POST',
        body: { catatan },
      });
  },

  getRecap: async (): Promise<ApiResponse<RpsRecap>> => {
    return apiRequest<RpsRecap>(API_ENDPOINTS.RPS.RECAP);
  },


};

export default rpsService;
