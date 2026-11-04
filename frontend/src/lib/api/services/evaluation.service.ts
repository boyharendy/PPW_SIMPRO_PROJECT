import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockCourseEvaluations } from '@/lib/mock-data';
import type { ApiResponse, EvaluationRecap } from '@/lib/types/api';
import type { CourseEvaluation } from '@/lib/types';

export const evaluationService = {
  // Ambil daftar evaluasi perkuliahan
  getEvaluations: async (params?: Record<string, unknown>): Promise<ApiResponse<CourseEvaluation[]>> => {
    try {
      const res = await apiRequest<CourseEvaluation[]>(API_ENDPOINTS.EVALUATIONS.LIST, { params });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.EVALUATIONS, res.data);
        return res;
      }
    } catch {
      // Fallback
    }
    const local = storageSync.get<CourseEvaluation[]>(STORAGE_KEYS.EVALUATIONS, mockCourseEvaluations);
    return { success: true, message: 'OK', data: local };
  },

  // Ambil evaluasi berdasarkan ID kelas perkuliahan
  getEvaluationByClass: async (classId: string): Promise<ApiResponse<CourseEvaluation>> => {
    try {
      const res = await apiRequest<CourseEvaluation>(API_ENDPOINTS.EVALUATIONS.BY_CLASS(classId));
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<CourseEvaluation[]>(STORAGE_KEYS.EVALUATIONS, mockCourseEvaluations);
    const found = list.find((e) => e.course_class_id === classId) || mockCourseEvaluations[0];
    return { success: true, message: 'OK', data: found };
  },

  // Ambil evaluasi berdasarkan ID kelas atau ID evaluasi
  getEvaluationById: async (id: string): Promise<ApiResponse<CourseEvaluation>> => {
    try {
      const res = await apiRequest<CourseEvaluation>(API_ENDPOINTS.EVALUATIONS.BY_CLASS(id));
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<CourseEvaluation[]>(STORAGE_KEYS.EVALUATIONS, mockCourseEvaluations);
    const found = list.find((e) => e.course_class_id === id || e.id === id) || mockCourseEvaluations[0];
    return { success: true, message: 'OK', data: found };
  },

  // Simpan isian skor ketercapaian CPMK (persisten)
  saveEvaluation: async (data: Partial<CourseEvaluation>): Promise<ApiResponse<CourseEvaluation>> => {
    const newEval: CourseEvaluation = {
      id: data.id || `eval-${Date.now()}`,
      course_class_id: data.course_class_id || 'class-1',
      diisi_oleh: data.diisi_oleh || 'u-dosen',
      status: data.status || 'DRAF',
      kesesuaian_rps: data.kesesuaian_rps || 'SESUAI',
      penjelasan_kesesuaian: data.penjelasan_kesesuaian || '',
      kendala: data.kendala || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      grades: data.grades || [],
      cpmk_list: data.cpmk_list || [],
      improvement_plans: data.improvement_plans || [],
      ...data,
    };
    storageSync.prepend(STORAGE_KEYS.EVALUATIONS, newEval, mockCourseEvaluations);
    try {
      return await apiRequest<CourseEvaluation>(API_ENDPOINTS.EVALUATIONS.SAVE, {
        method: 'POST',
        body: newEval,
      });
    } catch {
      return { success: true, message: 'Evaluasi perkuliahan disimpan', data: newEval };
    }
  },

  // Finalisasi & kirim laporan evaluasi perkuliahan ke GKM / Kaprodi
  submitEvaluation: async (classId: string): Promise<ApiResponse<CourseEvaluation>> => {
    storageSync.update(STORAGE_KEYS.EVALUATIONS, classId, { status: 'DITINJAU' }, mockCourseEvaluations);
    try {
      return await apiRequest<CourseEvaluation>(API_ENDPOINTS.EVALUATIONS.SUBMIT(classId), {
        method: 'POST',
      });
    } catch {
      const list = storageSync.get<CourseEvaluation[]>(STORAGE_KEYS.EVALUATIONS, mockCourseEvaluations);
      const updated = list.find((e) => e.course_class_id === classId) || mockCourseEvaluations[0];
      return { success: true, message: 'Evaluasi diselesaikan', data: updated };
    }
  },

  // Rekapitulasi agregasi skor CPMK
  getRecap: async (): Promise<ApiResponse<EvaluationRecap>> => {
    try {
      return await apiRequest<EvaluationRecap>(API_ENDPOINTS.EVALUATIONS.RECAP);
    } catch {
      return {
        success: true,
        message: 'OK',
        data: {
          total_evaluasi: 12,
          selesai: 9,
          draf: 3,
          rata_rata_cpmk: 81.4,
        },
      };
    }
  },
};

export default evaluationService;
