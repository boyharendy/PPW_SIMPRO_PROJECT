import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockRpsSubmissions } from '@/lib/mock-data';
import type { ApiResponse, RpsRecap } from '@/lib/types/api';
import type { RpsSubmission, RpsReview } from '@/lib/types';

export const rpsService = {
  // Ambil daftar pengajuan RPS mata kuliah
  getSubmissions: async (params?: Record<string, unknown>): Promise<ApiResponse<RpsSubmission[]>> => {
    try {
      const res = await apiRequest<RpsSubmission[]>(API_ENDPOINTS.RPS.LIST, { params });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.RPS_SUBMISSIONS, res.data);
        return res;
      }
    } catch {
      // Fallback
    }
    const local = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
    return { success: true, message: 'OK', data: local };
  },

  // Detail pengajuan RPS
  getSubmissionById: async (id: string): Promise<ApiResponse<RpsSubmission>> => {
    try {
      const res = await apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.DETAIL(id));
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
    const found = list.find((s) => s.id === id) || mockRpsSubmissions[0];
    return { success: true, message: 'OK', data: found };
  },

  // Buat draf pengajuan RPS baru (persisten)
  createSubmission: async (data: Partial<RpsSubmission>): Promise<ApiResponse<RpsSubmission>> => {
    const newSub: RpsSubmission = {
      id: data.id || `rps-${Date.now()}`,
      course_id: data.course_id || 'course-1',
      academic_period_id: data.academic_period_id || 'period-2025-ganjil',
      dosen_pengampu_id: data.dosen_pengampu_id || 'u-dosen',
      status: 'DIAJUKAN',
      versi_terbaru: data.versi_terbaru || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      versions: data.versions || [],
      improvement_plans: data.improvement_plans || [],
      ...data,
    };
    storageSync.prepend(STORAGE_KEYS.RPS_SUBMISSIONS, newSub, mockRpsSubmissions);
    try {
      return await apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.CREATE, {
        method: 'POST',
        body: newSub,
      });
    } catch {
      return { success: true, message: 'Pengajuan RPS berhasil disimpan', data: newSub };
    }
  },

  // Tugaskan reviewer RPS
  assignReviewer: async (id: string, reviewerId: string): Promise<ApiResponse<RpsSubmission>> => {
    storageSync.update(STORAGE_KEYS.RPS_SUBMISSIONS, id, { status: 'DIREVIEW' }, mockRpsSubmissions);
    try {
      return await apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.SUBMIT(id), {
        method: 'POST',
        body: { reviewer_id: reviewerId },
      });
    } catch {
      const list = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
      const updated = list.find((s) => s.id === id) || mockRpsSubmissions[0];
      return { success: true, message: 'Reviewer ditugaskan', data: updated };
    }
  },

  // Ajukan dokumen RPS ke GKM
  submitForReview: async (id: string): Promise<ApiResponse<RpsSubmission>> => {
    storageSync.update(STORAGE_KEYS.RPS_SUBMISSIONS, id, { status: 'DIREVIEW' }, mockRpsSubmissions);
    try {
      return await apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.SUBMIT(id), {
        method: 'POST',
      });
    } catch {
      const list = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
      const updated = list.find((s) => s.id === id) || mockRpsSubmissions[0];
      return { success: true, message: 'RPS diajukan ke GKM', data: updated };
    }
  },

  // Simpan hasil review kepatuhan rubrik mutu oleh GKM
  reviewSubmission: async (id: string, data: Partial<RpsReview>): Promise<ApiResponse<RpsSubmission>> => {
    storageSync.update(STORAGE_KEYS.RPS_SUBMISSIONS, id, { status: data.rekomendasi as any }, mockRpsSubmissions);
    try {
      return await apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.REVIEW(id), {
        method: 'POST',
        body: data,
      });
    } catch {
      const list = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
      const updated = list.find((s) => s.id === id) || mockRpsSubmissions[0];
      return { success: true, message: 'Review disimpan', data: updated };
    }
  },

  // Pengesahan dokumen RPS final oleh Kaprodi
  ratifySubmission: async (id: string): Promise<ApiResponse<RpsSubmission>> => {
    storageSync.update(STORAGE_KEYS.RPS_SUBMISSIONS, id, { status: 'DISAHKAN' }, mockRpsSubmissions);
    try {
      return await apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.RATIFY(id), {
        method: 'POST',
      });
    } catch {
      const list = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
      const updated = list.find((s) => s.id === id) || mockRpsSubmissions[0];
      return { success: true, message: 'RPS disahkan oleh Kaprodi', data: updated };
    }
  },

  // Alias approveSubmission
  approveSubmission: async (id: string, catatan?: string): Promise<ApiResponse<RpsSubmission>> => {
    storageSync.update(STORAGE_KEYS.RPS_SUBMISSIONS, id, { status: 'DISAHKAN', catatan_pengesahan: catatan }, mockRpsSubmissions);
    try {
      return await apiRequest<RpsSubmission>(API_ENDPOINTS.RPS.RATIFY(id), {
        method: 'POST',
        body: { catatan },
      });
    } catch {
      const list = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
      const updated = list.find((s) => s.id === id) || mockRpsSubmissions[0];
      return { success: true, message: 'RPS disahkan', data: updated };
    }
  },

  // Rekapitulasi kepatuhan RPS
  getRecap: async (): Promise<ApiResponse<RpsRecap>> => {
    try {
      return await apiRequest<RpsRecap>(API_ENDPOINTS.RPS.RECAP);
    } catch {
      return {
        success: true,
        message: 'OK',
        data: {
          total_rps: 15,
          disahkan: 11,
          direview: 3,
          draf: 1,
          persentase_kepatuhan: 93,
        },
      };
    }
  },
};

export default rpsService;
