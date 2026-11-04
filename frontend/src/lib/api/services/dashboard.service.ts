import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiResponse, DashboardStats } from '@/lib/types/api';
import type { Notification, AcademicPeriod, Course, CourseClass, Partner } from '@/lib/types';

export const dashboardService = {
  // Ambil agregasi metrik dashboard utama (Kepuasan mitra, publikasi, perjalanan dinas, RKA, RPS, aduan)
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return apiRequest<DashboardStats>(API_ENDPOINTS.DASHBOARD.STATS);
  },

  // Ambil daftar notifikasi pengguna
  getNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    return apiRequest<Notification[]>(API_ENDPOINTS.NOTIFICATIONS.LIST);
  },

  // Tandai notifikasi telah dibaca
  markNotificationRead: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {
      method: 'PATCH',
    });
  },

  // Ambil data referensi periode akademik
  getReferencePeriods: async (): Promise<ApiResponse<AcademicPeriod[]>> => {
    return apiRequest<AcademicPeriod[]>(API_ENDPOINTS.REF.ACADEMIC_PERIODS);
  },

  // Ambil data referensi mata kuliah
  getReferenceCourses: async (): Promise<ApiResponse<Course[]>> => {
    return apiRequest<Course[]>(API_ENDPOINTS.REF.COURSES);
  },

  // Ambil data referensi kelas mata kuliah
  getReferenceCourseClasses: async (courseId?: string): Promise<ApiResponse<CourseClass[]>> => {
    return apiRequest<CourseClass[]>(API_ENDPOINTS.REF.COURSE_CLASSES, {
      params: courseId ? { course_id: courseId } : undefined,
    });
  },

  // Ambil data referensi mitra institusi
  getReferencePartners: async (): Promise<ApiResponse<Partner[]>> => {
    return apiRequest<Partner[]>(API_ENDPOINTS.REF.PARTNERS);
  },
};

export default dashboardService;
