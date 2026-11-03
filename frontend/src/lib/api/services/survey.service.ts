import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
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
    return apiRequest<PartnerSurveyTemplate[]>(API_ENDPOINTS.SURVEYS.LIST, { params });
  },

  // Detail survei berdasarkan ID
  getSurveyById: async (id: string): Promise<ApiResponse<PartnerSurveyTemplate>> => {
    return apiRequest<PartnerSurveyTemplate>(API_ENDPOINTS.SURVEYS.DETAIL(id));
  },

  // Buat instrumen survei baru
  createSurvey: async (data: Partial<PartnerSurveyTemplate>): Promise<ApiResponse<PartnerSurveyTemplate>> => {
    return apiRequest<PartnerSurveyTemplate>(API_ENDPOINTS.SURVEYS.CREATE, {
      method: 'POST',
      body: data,
    });
  },

  // Perbarui survei
  updateSurvey: async (id: string, data: Partial<PartnerSurveyTemplate>): Promise<ApiResponse<PartnerSurveyTemplate>> => {
    return apiRequest<PartnerSurveyTemplate>(API_ENDPOINTS.SURVEYS.UPDATE(id), {
      method: 'PUT',
      body: data,
    });
  },

  // Hapus survei
  deleteSurvey: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(API_ENDPOINTS.SURVEYS.DELETE(id), {
      method: 'DELETE',
    });
  },

  // Buat dan kirim undangan survei ke mitra institusi
  createInvitation: async (data: Partial<PartnerSurveyInvitation>): Promise<ApiResponse<PartnerSurveyInvitation>> => {
    return apiRequest<PartnerSurveyInvitation>(API_ENDPOINTS.SURVEYS.INVITATIONS, {
      method: 'POST',
      body: data,
    });
  },

  // Ambil rekapitulasi skor kepuasan mitra
  getRecap: async (id: string): Promise<ApiResponse<SurveyRecap>> => {
    return apiRequest<SurveyRecap>(API_ENDPOINTS.SURVEYS.RECAP(id));
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
