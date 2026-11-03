import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiResponse, RkaSerapan } from '@/lib/types/api';
import type { RkaDocument, RkaRealization } from '@/lib/types';

export const rkaService = {
  // Ambil daftar dokumen RKA prodi
  getRkaList: async (): Promise<ApiResponse<RkaDocument[]>> => {
    return apiRequest<RkaDocument[]>(API_ENDPOINTS.RKA.LIST);
  },

  // Detail dokumen RKA berdasarkan tahun anggaran
  getRkaByYear: async (tahun: string): Promise<ApiResponse<RkaDocument>> => {
    return apiRequest<RkaDocument>(API_ENDPOINTS.RKA.DETAIL(tahun));
  },

  // Buat dokumen RKA tahun baru
  createRka: async (data: Partial<RkaDocument>): Promise<ApiResponse<RkaDocument>> => {
    return apiRequest<RkaDocument>(API_ENDPOINTS.RKA.CREATE, {
      method: 'POST',
      body: data,
    });
  },

  // Perbarui dokumen / pos pagu RKA
  updateRka: async (tahun: string, data: Partial<RkaDocument>): Promise<ApiResponse<RkaDocument>> => {
    return apiRequest<RkaDocument>(API_ENDPOINTS.RKA.UPDATE(tahun), {
      method: 'PUT',
      body: data,
    });
  },

  // Catat transaksi realisasi anggaran terhadap pos RKA
  addRealization: async (tahun: string, data: Partial<RkaRealization>): Promise<ApiResponse<RkaRealization>> => {
    return apiRequest<RkaRealization>(API_ENDPOINTS.RKA.REALIZATIONS(tahun), {
      method: 'POST',
      body: data,
    });
  },

  // Hitung persentase dan analitika serapan pagu RKA otomatis
  getSerapan: async (tahun: string): Promise<ApiResponse<RkaSerapan>> => {
    return apiRequest<RkaSerapan>(API_ENDPOINTS.RKA.SERAPAN(tahun));
  },
};

export default rkaService;
