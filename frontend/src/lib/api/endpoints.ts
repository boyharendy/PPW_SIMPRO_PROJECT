// ============================================================
// SIMPRO - Centralized Backend API Endpoints (Golang)
// Modul 7–13 & Cross-Module Endpoints
// ============================================================

export const API_ENDPOINTS = {
  // Authentication & Session
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    SWITCH_ROLE: '/auth/switch-role',
  },

  // Users & Roles
  USERS: {
    LIST: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    ROLES: '/users/roles',
  },

  // Reference Data (Lintas Modul)
  REF: {
    ACADEMIC_PERIODS: '/ref/academic-periods',
    COURSES: '/ref/courses',
    COURSE_CLASSES: '/ref/course-classes',
    PARTNERS: '/ref/partners',
  },

  // Public Endpoints (Tanpa Auth)
  PUBLIC: {
    COMPLAINT_CREATE: '/public/complaints',
    COMPLAINT_DETAIL: (ticket: string) => `/public/complaints/${ticket}`,
    COMPLAINT_MESSAGE: (ticket: string) => `/public/complaints/${ticket}/messages`,
    SURVEY_DETAIL: (token: string) => `/public/surveys/${token}`,
    SURVEY_SUBMIT: (token: string) => `/public/surveys/${token}/submit`,
  },

  // Modul 7: Kepuasan Mitra
  SURVEYS: {
    LIST: '/surveys',
    CREATE: '/surveys',
    INVITATIONS: '/surveys/invitations',
    DETAIL: (id: string) => `/surveys/${id}`,
    UPDATE: (id: string) => `/surveys/${id}`,
    DELETE: (id: string) => `/surveys/${id}`,
    RECAP: (id: string) => `/surveys/${id}/recap`,
  },

  // Modul 8: Publikasi Ilmiah
  PUBLICATIONS: {
    LIST: '/publications',
    CREATE: '/publications',
    RECAP: '/publications/recap',
    DETAIL: (id: string) => `/publications/${id}`,
    UPDATE: (id: string) => `/publications/${id}`,
    DELETE: (id: string) => `/publications/${id}`,
    SUBMIT: (id: string) => `/publications/${id}/submit`,
    VERIFY: (id: string) => `/publications/${id}/verify`,
    REVIEWS: (id: string) => `/publications/${id}/reviews`,
  },

  // Modul 9: Perjalanan Dinas
  TRIPS: {
    LIST: '/trips',
    CREATE: '/trips',
    RECAP: '/trips/recap',
    DETAIL: (id: string) => `/trips/${id}`,
    UPDATE: (id: string) => `/trips/${id}`,
    DELETE: (id: string) => `/trips/${id}`,
    SUBMIT: (id: string) => `/trips/${id}/submit`,
    APPROVE: (id: string) => `/trips/${id}/approve`,
    REPORT: (id: string) => `/trips/${id}/report`,
  },

  // Modul 10: RKA Prodi
  RKA: {
    LIST: '/rka',
    CREATE: '/rka',
    DETAIL: (tahun: string) => `/rka/${tahun}`,
    UPDATE: (tahun: string) => `/rka/${tahun}`,
    REALIZATIONS: (tahun: string) => `/rka/${tahun}/realizations`,
    SERAPAN: (tahun: string) => `/rka/${tahun}/serapan`,
  },

  // Modul 11: Review RPS
  RPS: {
    LIST: '/rps',
    CREATE: '/rps',
    RECAP: '/rps/recap',
    DETAIL: (id: string) => `/rps/${id}`,
    SUBMIT: (id: string) => `/rps/${id}/submit`,
    REVIEW: (id: string) => `/rps/${id}/review`,
    RATIFY: (id: string) => `/rps/${id}/ratify`,
  },

  // Modul 12: Post Evaluasi Perkuliahan
  EVALUATIONS: {
    LIST: '/evaluations',
    SAVE: '/evaluations',
    RECAP: '/evaluations/recap',
    BY_CLASS: (classId: string) => `/evaluations/class/${classId}`,
    SUBMIT: (classId: string) => `/evaluations/class/${classId}/submit`,
  },

  // Modul 13: Layanan Aduan Mahasiswa
  COMPLAINTS: {
    LIST: '/complaints',
    CREATE: '/complaints',
    RECAP: '/complaints/recap',
    DETAIL: (id: string) => `/complaints/${id}`,
    UPDATE: (id: string) => `/complaints/${id}`,
    STATUS: (id: string) => `/complaints/${id}/status`,
    MESSAGES: (id: string) => `/complaints/${id}/messages`,
    DISPOSITIONS: (id: string) => `/complaints/${id}/dispositions`,
  },

  // Cross-Module: Dashboard & Notifikasi
  DASHBOARD: {
    STATS: '/dashboard/stats',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },

  // System & Health
  SYSTEM: {
    HEALTH: '/health',
  },
} as const;
