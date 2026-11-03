// ============================================================
// SIMPRO - Centralized Backend API Endpoints (Golang)
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

  // System & Health
  SYSTEM: {
    HEALTH: '/health',
    METRICS: '/system/metrics',
  },
} as const;
