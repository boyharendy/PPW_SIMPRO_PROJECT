import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiResponse, PublicationRecap } from '@/lib/types/api';
import type { Publication } from '@/lib/types';

export const publicationService = {
  // Ambil daftar publikasi ilmiah
  getPublications: async (params?: Record<string, unknown>): Promise<ApiResponse<Publication[]>> => {
    return apiRequest<Publication[]>(API_ENDPOINTS.PUBLICATIONS.LIST, { params });
  },

  // Detail publikasi
  getPublicationById: async (id: string): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.DETAIL(id));
  },

  // Buat usulan publikasi baru
  createPublication: async (data: Partial<Publication>): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.CREATE, {
      method: 'POST',
      body: data,
    });
  },

  // Perbarui publikasi
  updatePublication: async (id: string, data: Partial<Publication>): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.UPDATE(id), {
      method: 'PUT',
      body: data,
    });
  },

  // Hapus publikasi draf
  deletePublication: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(API_ENDPOINTS.PUBLICATIONS.DELETE(id), {
      method: 'DELETE',
    });
  },

  // Ajukan usulan publikasi untuk verifikasi
  submitPublication: async (id: string): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.SUBMIT(id), {
      method: 'POST',
    });
  },

  // Verifikasi oleh Dosen Verifikator (SETUJU / REVISI / TOLAK)
  verifyPublication: async (id: string, data: { status: string; catatan?: string }): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.VERIFY(id), {
      method: 'POST',
      body: data,
    });
  },

  // Tambah catatan review substansi oleh reviewer
  addReview: async (id: string, data: { reviewer_id: string; catatan: string; rekomendasi: string }): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.REVIEWS(id), {
      method: 'POST',
      body: data,
    });
  },

  // Rekapitulasi publikasi ilmiah prodi
  getRecap: async (): Promise<ApiResponse<PublicationRecap>> => {
    return apiRequest<PublicationRecap>(API_ENDPOINTS.PUBLICATIONS.RECAP);
  },
};

export default publicationService;
