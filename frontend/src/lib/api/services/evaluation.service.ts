import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiResponse, EvaluationRecap } from '@/lib/types/api';
import type { CourseEvaluation } from '@/lib/types';

export const evaluationService = {
  // Ambil daftar evaluasi perkuliahan
  getEvaluations: async (params?: Record<string, unknown>): Promise<ApiResponse<CourseEvaluation[]>> => {
    return apiRequest<CourseEvaluation[]>(API_ENDPOINTS.EVALUATIONS.LIST, { params });
  },

  // Ambil evaluasi berdasarkan ID kelas perkuliahan
  getEvaluationByClass: async (classId: string): Promise<ApiResponse<CourseEvaluation>> => {
    return apiRequest<CourseEvaluation>(API_ENDPOINTS.EVALUATIONS.BY_CLASS(classId));
  },

  // Simpan isian skor ketercapaian CPMK dan catatan refleksi
  saveEvaluation: async (data: Partial<CourseEvaluation>): Promise<ApiResponse<CourseEvaluation>> => {
    return apiRequest<CourseEvaluation>(API_ENDPOINTS.EVALUATIONS.SAVE, {
      method: 'POST',
      body: data,
    });
  },

  // Finalisasi & kirim laporan evaluasi perkuliahan ke GKM / Kaprodi
  submitEvaluation: async (classId: string): Promise<ApiResponse<CourseEvaluation>> => {
    return apiRequest<CourseEvaluation>(API_ENDPOINTS.EVALUATIONS.SUBMIT(classId), {
      method: 'POST',
    });
  },

  // Rekapitulasi agregasi skor CPMK dan kepatuhan pengisian dosen
  getRecap: async (): Promise<ApiResponse<EvaluationRecap>> => {
    return apiRequest<EvaluationRecap>(API_ENDPOINTS.EVALUATIONS.RECAP);
  },
};

export default evaluationService;
