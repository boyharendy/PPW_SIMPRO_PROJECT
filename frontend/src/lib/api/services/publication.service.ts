import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiResponse, PublicationRecap } from '@/lib/types/api';
import type { Publication } from '@/lib/types';

type ServerPublication = Publication & {
  tipe: Publication['jenis'];
  nama_jurnal_konferensi: string;
  tahun_terbit: number;
  url_publikasi?: string;
  created_by: string;
};

function normalize(p: ServerPublication): Publication {
  return {
    ...p, jenis: p.tipe ?? p.jenis, nama_target: p.nama_jurnal_konferensi ?? p.nama_target,
    tahun: p.tahun_terbit ?? p.tahun, url: p.url_publikasi ?? p.url,
    dicatat_oleh: p.created_by ?? p.dicatat_oleh, authors: p.authors ?? [],
  };
}

export const publicationService = {
  // Ambil daftar publikasi ilmiah
  getPublications: async (params?: Record<string, unknown>): Promise<ApiResponse<Publication[]>> => {
    const result = await apiRequest<ServerPublication[]>(API_ENDPOINTS.PUBLICATIONS.LIST, { params });
    return { ...result, data: (result.data ?? []).map(normalize) };
  },

  getPublicationById: async (id: string): Promise<ApiResponse<Publication>> => {
    const result = await apiRequest<ServerPublication>(API_ENDPOINTS.PUBLICATIONS.DETAIL(id));
    return { ...result, data: normalize(result.data) };
  },

  createPublication: async (data: Partial<Publication>): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.CREATE, {
        method: 'POST',
        body: { ...data, tipe: data.jenis, nama_jurnal_konferensi: data.nama_target, tahun_terbit: data.tahun, url_publikasi: data.url },
      });
  },

  updatePublication: async (id: string, data: Partial<Publication>): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.UPDATE(id), {
        method: 'PUT',
        body: data,
      });
  },

  deletePublication: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(API_ENDPOINTS.PUBLICATIONS.DELETE(id), {
        method: 'DELETE',
      });
  },

  submitPublication: async (id: string): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.SUBMIT(id), {
        method: 'POST',
      });
  },

  updateStatus: async (
    id: string,
    data: { status: string; catatan?: string; bukti?: string }
  ): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.STATUS(id), {
        method: 'PATCH',
        body: data,
      });
  },

  verifyPublication: async (
    id: string,
    data: { status: string; catatan?: string; verifikator_nama?: string }
  ): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.VERIFY(id), {
        method: 'POST',
        body: data,
      });
  },

  assignReviewer: async (
    id: string,
    data: { reviewer_id: string; reviewer_nama?: string; tenggat_review?: string }
  ): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.REVIEWS(id), {
        method: 'POST',
        body: data,
      });
  },

  completeReview: async (
    reviewId: string,
    data: { rekomendasi: string; catatan: string }
  ): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.COMPLETE_REVIEW(reviewId), {
        method: 'POST',
        body: data,
      });
  },

  addReview: async (id: string, data: { reviewer_id: string; catatan: string; rekomendasi: string }): Promise<ApiResponse<Publication>> => {
    return apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.REVIEWS(id), {
        method: 'POST',
        body: data,
      });
  },

  getRecap: async (): Promise<ApiResponse<PublicationRecap>> => {
    return apiRequest<PublicationRecap>(API_ENDPOINTS.PUBLICATIONS.RECAP);
  },


};

export default publicationService;
