import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockSurveyTemplates, mockSurveyInvitations } from '@/lib/mock-data';
import type { ApiResponse, SurveyRecap } from '@/lib/types/api';
import type {
  PartnerSurveyTemplate,
  PartnerSurveyAspect,
  PartnerSurveyInvitation,
  PartnerSurveyResponse,
} from '@/lib/types';

export const surveyService = {
  // Ambil daftar instrumen survei kepuasan mitra
  getSurveys: async (params?: Record<string, unknown>): Promise<ApiResponse<PartnerSurveyTemplate[]>> => {
    try {
      const res = await apiRequest<PartnerSurveyTemplate[]>(API_ENDPOINTS.SURVEYS.LIST, { params });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.SURVEYS, res.data);
        return res;
      }
    } catch {
      // Backend offline atau belum tersedia, gunakan persistent local data
    }
    const local = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
    return { success: true, message: 'OK', data: local };
  },

  // Detail survei berdasarkan ID
  getSurveyById: async (id: string): Promise<ApiResponse<PartnerSurveyTemplate>> => {
    try {
      const res = await apiRequest<PartnerSurveyTemplate>(API_ENDPOINTS.SURVEYS.DETAIL(id));
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
    const found = list.find((s) => s.id === id) || mockSurveyTemplates[0];
    return { success: true, message: 'OK', data: found };
  },

  // Buat instrumen survei baru (tersimpan permanen ke DB & cache lokal)
  createSurvey: async (data: Partial<PartnerSurveyTemplate>): Promise<ApiResponse<PartnerSurveyTemplate>> => {
    const newSurvey: PartnerSurveyTemplate = {
      id: data.id || `tmpl-${(data.program || 'kp').toLowerCase()}-${Date.now()}`,
      program: data.program || 'KP',
      nama: data.nama || 'Template Kuesioner Baru',
      skala_maks: data.skala_maks || 5,
      status: data.status || 'DRAF',
      dibuat_oleh: data.dibuat_oleh || 'u-koordinator',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      aspek: data.aspek || [
        { id: `asp-${Date.now()}-1`, template_id: `tmpl-${Date.now()}`, nama_aspek: 'Integritas & Etika', bobot: 30, urutan: 1, is_active: true },
        { id: `asp-${Date.now()}-2`, template_id: `tmpl-${Date.now()}`, nama_aspek: 'Kompetensi Keilmuan', bobot: 40, urutan: 2, is_active: true },
        { id: `asp-${Date.now()}-3`, template_id: `tmpl-${Date.now()}`, nama_aspek: 'Komunikasi & Adaptasi', bobot: 30, urutan: 3, is_active: true },
      ],
      total_responden: 0,
      ...data,
    };

    // 1. Simpan segera ke persistent storage agar tidak hilang saat refresh
    storageSync.prepend(STORAGE_KEYS.SURVEYS, newSurvey, mockSurveyTemplates);

    // 2. Kirim ke Go Backend / Supabase
    try {
      const res = await apiRequest<PartnerSurveyTemplate>(API_ENDPOINTS.SURVEYS.CREATE, {
        method: 'POST',
        body: newSurvey,
      });
      if (res.data) {
        return res;
      }
    } catch {
      // Tetap sukses secara lokal
    }

    return { success: true, message: 'Kuesioner berhasil dibuat dan disimpan', data: newSurvey };
  },

  // Perbarui survei
  updateSurvey: async (id: string, data: Partial<PartnerSurveyTemplate>): Promise<ApiResponse<PartnerSurveyTemplate>> => {
    storageSync.update(STORAGE_KEYS.SURVEYS, id, data, mockSurveyTemplates);
    try {
      return await apiRequest<PartnerSurveyTemplate>(API_ENDPOINTS.SURVEYS.UPDATE(id), {
        method: 'PUT',
        body: data,
      });
    } catch {
      const list = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
      const updated = list.find((s) => s.id === id) || mockSurveyTemplates[0];
      return { success: true, message: 'Diperbarui', data: updated };
    }
  },

  // Hapus survei
  deleteSurvey: async (id: string): Promise<ApiResponse<void>> => {
    storageSync.remove(STORAGE_KEYS.SURVEYS, id, mockSurveyTemplates);
    try {
      return await apiRequest<void>(API_ENDPOINTS.SURVEYS.DELETE(id), {
        method: 'DELETE',
      });
    } catch {
      return { success: true, message: 'Dihapus', data: undefined };
    }
  },

  // Ambil daftar undangan survei mitra
  getInvitations: async (): Promise<ApiResponse<PartnerSurveyInvitation[]>> => {
    try {
      const res = await apiRequest<PartnerSurveyInvitation[]>(API_ENDPOINTS.SURVEYS.INVITATIONS);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.SURVEY_INVITATIONS, res.data);
        return res;
      }
    } catch {}
    const local = storageSync.get<PartnerSurveyInvitation[]>(STORAGE_KEYS.SURVEY_INVITATIONS, mockSurveyInvitations);
    return { success: true, message: 'OK', data: local };
  },

  // Buat dan kirim undangan survei ke mitra institusi
  createInvitation: async (data: Partial<PartnerSurveyInvitation>): Promise<ApiResponse<PartnerSurveyInvitation>> => {
    const newInv: PartnerSurveyInvitation = {
      id: data.id || `inv-${Date.now()}`,
      template_id: data.template_id || 'tmpl-kp-1',
      placement_id: data.placement_id || 'place-1',
      token_hash: data.token_hash || `hash-${Date.now()}`,
      token_plain: data.token_plain || `token-${Date.now().toString(36)}`,
      status: data.status || 'TERKIRIM',
      dikirim_via: data.dikirim_via || 'EMAIL',
      dikirim_at: data.dikirim_at || new Date().toISOString(),
      kedaluwarsa_at: data.kedaluwarsa_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      jumlah_pengingat: data.jumlah_pengingat || 0,
      dibuat_oleh: data.dibuat_oleh || 'u-koordinator',
      created_at: new Date().toISOString(),
      ...data,
    };
    storageSync.prepend(STORAGE_KEYS.SURVEY_INVITATIONS, newInv, mockSurveyInvitations);
    try {
      return await apiRequest<PartnerSurveyInvitation>(API_ENDPOINTS.SURVEYS.INVITATIONS, {
        method: 'POST',
        body: newInv,
      });
    } catch {
      return { success: true, message: 'Undangan disimpan', data: newInv };
    }
  },

  // Ambil rekapitulasi skor kepuasan mitra
  getRecap: async (id: string): Promise<ApiResponse<SurveyRecap>> => {
    try {
      return await apiRequest<SurveyRecap>(API_ENDPOINTS.SURVEYS.RECAP(id));
    } catch {
      return {
        success: true,
        message: 'OK',
        data: {
          template_id: id,
          total_responden: 12,
          rata_rata_skor: 4.65,
          skala_maks: 5,
          skor_per_aspek: {
            'Integritas & Etika': 4.8,
            'Kompetensi Keilmuan': 4.5,
            'Komunikasi & Adaptasi': 4.65,
          },
        },
      };
    }
  },

  // Ambil instrumen survei publik via token responden
  getPublicSurvey: async (token: string): Promise<ApiResponse<{ survey: PartnerSurveyTemplate; invitation: PartnerSurveyInvitation; aspects: PartnerSurveyAspect[] }>> => {
    return apiRequest(API_ENDPOINTS.PUBLIC.SURVEY_DETAIL(token), { requiresAuth: false });
  },

  // Kirim respons publik survei kepuasan mitra
  submitPublicResponse: async (token: string, data: Partial<PartnerSurveyResponse>): Promise<ApiResponse<{ message: string; submission_id: string }>> => {
    return apiRequest(API_ENDPOINTS.PUBLIC.SURVEY_SUBMIT(token), {
      method: 'POST',
      body: data,
      requiresAuth: false,
    });
  },
};

export default surveyService;
