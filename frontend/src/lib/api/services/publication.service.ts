import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockPublications } from '@/lib/mock-data';
import type { ApiResponse, PublicationRecap } from '@/lib/types/api';
import type { Publication } from '@/lib/types';

export const publicationService = {
  // Ambil daftar publikasi ilmiah
  getPublications: async (params?: Record<string, unknown>): Promise<ApiResponse<Publication[]>> => {
    try {
      const res = await apiRequest<Publication[]>(API_ENDPOINTS.PUBLICATIONS.LIST, { params });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.PUBLICATIONS, res.data);
        return res;
      }
    } catch {
      // Fallback
    }
    const local = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    return { success: true, message: 'OK', data: local };
  },

  // Detail publikasi
  getPublicationById: async (id: string): Promise<ApiResponse<Publication>> => {
    try {
      const res = await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.DETAIL(id));
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    const found = list.find((p) => p.id === id) || mockPublications[0];
    return { success: true, message: 'OK', data: found };
  },

  // Buat usulan publikasi baru (persisten)
  createPublication: async (data: Partial<Publication>): Promise<ApiResponse<Publication>> => {
    const newPub: Publication = {
      id: data.id || `pub-${Date.now()}`,
      judul: data.judul || 'Judul Publikasi Baru',
      jenis: data.jenis || 'JURNAL',
      nama_target: data.nama_target || 'Target Publikasi',
      peringkat: data.peringkat || 'SINTA_2',
      status: data.status || 'DIAJUKAN',
      status_verifikasi: data.status_verifikasi || 'MENUNGGU',
      dicatat_oleh: data.dicatat_oleh || 'u-dosen',
      tahun: data.tahun || new Date().getFullYear(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      authors: data.authors || [],
      reviews: [],
      stage_logs: data.stage_logs || [],
      ...data,
    };

    storageSync.prepend(STORAGE_KEYS.PUBLICATIONS, newPub, mockPublications);

    try {
      const res = await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.CREATE, {
        method: 'POST',
        body: newPub,
      });
      if (res.data) return res;
    } catch {
      // Offline fallback
    }

    return { success: true, message: 'Usulan publikasi berhasil disimpan', data: newPub };
  },

  // Perbarui publikasi
  updatePublication: async (id: string, data: Partial<Publication>): Promise<ApiResponse<Publication>> => {
    storageSync.update(STORAGE_KEYS.PUBLICATIONS, id, data, mockPublications);
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.UPDATE(id), {
        method: 'PUT',
        body: data,
      });
    } catch {
      const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = list.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Diperbarui', data: updated };
    }
  },

  // Hapus publikasi draf
  deletePublication: async (id: string): Promise<ApiResponse<void>> => {
    storageSync.remove(STORAGE_KEYS.PUBLICATIONS, id, mockPublications);
    try {
      return await apiRequest<void>(API_ENDPOINTS.PUBLICATIONS.DELETE(id), {
        method: 'DELETE',
      });
    } catch {
      return { success: true, message: 'Dihapus', data: undefined };
    }
  },

  // Ajukan usulan publikasi untuk verifikasi
  submitPublication: async (id: string): Promise<ApiResponse<Publication>> => {
    storageSync.update(STORAGE_KEYS.PUBLICATIONS, id, { status: 'DIAJUKAN', status_verifikasi: 'MENUNGGU' }, mockPublications);
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.SUBMIT(id), {
        method: 'POST',
      });
    } catch {
      const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = list.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Diajukan', data: updated };
    }
  },

  // Verifikasi oleh Dosen Verifikator
  verifyPublication: async (id: string, data: { status: string; catatan?: string }): Promise<ApiResponse<Publication>> => {
    storageSync.update(STORAGE_KEYS.PUBLICATIONS, id, { status: data.status as any }, mockPublications);
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.VERIFY(id), {
        method: 'POST',
        body: data,
      });
    } catch {
      const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = list.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Diverifikasi', data: updated };
    }
  },

  // Tambah catatan review substansi oleh reviewer
  addReview: async (id: string, data: { reviewer_id: string; catatan: string; rekomendasi: string }): Promise<ApiResponse<Publication>> => {
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.REVIEWS(id), {
        method: 'POST',
        body: data,
      });
    } catch {
      const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = list.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Review disimpan', data: updated };
    }
  },

  // Rekapitulasi publikasi ilmiah prodi
  getRecap: async (): Promise<ApiResponse<PublicationRecap>> => {
    try {
      return await apiRequest<PublicationRecap>(API_ENDPOINTS.PUBLICATIONS.RECAP);
    } catch {
      return {
        success: true,
        message: 'OK',
        data: {
          total: 8,
          disetujui: 5,
          menunggu_verifikasi: 2,
          perlu_revisi: 1,
          ditolak: 0,
          kategori_distribusi: {
            JURNAL_INTERNASIONAL_BEREPUTASI: 3,
            JURNAL_NASIONAL_TERAKREDITASI: 3,
            PROSIDING_INTERNASIONAL: 2,
          },
        },
      };
    }
  },
};

export default publicationService;
