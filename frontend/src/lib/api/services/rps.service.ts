import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiResponse, RpsRecap } from '@/lib/types/api';
import type { RpsSubmission, RpsReview } from '@/lib/types';

export const rpsService = {
  // Ambil daftar pengajuan RPS mata kuliah
  getSubmissions: async (params?: Record<string, unknown>): Promise<ApiResponse<RpsSubmission[]>> => {
    return apiRequest<RpsSubmission[]>(API_ENDPOINTS.RPS.LIST, { params });
  },

  // Detail pengajuan RPS
  getSubmissionById: async (id: string): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.DETAIL(id));
  },

  // Buat draf pengajuan RPS baru oleh dosen pengampu
  createSubmission: async (data: Partial<RpsSubmission>): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.CREATE, {
      method: 'POST',
      body: data,
    });
  },

  // Ajukan dokumen RPS ke GKM / Reviewer
  submitForReview: async (id: string): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.SUBMIT(id), {
      method: 'POST',
    });
  },

  // Simpan hasil review kepatuhan rubrik mutu oleh GKM
  reviewSubmission: async (id: string, data: Partial<RpsReview>): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.REVIEW(id), {
      method: 'POST',
      body: data,
    });
  },

  // Pengesahan dokumen RPS final oleh Kaprodi
  ratifySubmission: async (id: string): Promise<ApiResponse<RpsSubmission>> => {
    return apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.RATIFY(id), {
      method: 'POST',
    });
  },

  // Rekapitulasi kepatuhan dan status pengesahan RPS semester aktif
  getRecap: async (): Promise<ApiResponse<RpsRecap>> => {
    return apiRequest<RpsRecap>(API_ENDPOINTS.RPS.RECAP);
  },
};

export default rpsService;
