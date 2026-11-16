// ============================================================
// SIMPRO - Golang Backend API Types & Envelopes
// ============================================================

import type { Role } from '@/lib/types';

/**
 * Standard Success Response envelope from Golang backend
 * Format matches Golang: gin.H{"success": true, "message": "...", "data": ...}
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Standard Error Response envelope from Golang backend
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[] | string>;
}

/**
 * Standard Pagination Metadata from Golang backend
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

/**
 * Standard Request Query Parameters for List/Paginated Endpoints
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Authentication tokens returned by Golang backend (JWT)
 */
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string; // usually 'Bearer'
  expires_in?: number; // seconds
}

/**
 * Authenticated User Profile from Golang backend
 */
export interface UserSession {
  id: string;
  nama_lengkap: string;
  email: string;
  username?: string;
  roles: Role[];
  active_role: Role;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Auth Login payload
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Auth Register payload
 */
export interface RegisterPayload {
  nama_lengkap: string;
  email: string;
  password: string;
}

/**
 * Auth Response after successful login/register
 */
export interface AuthResponse {
  user: UserSession;
  token?: string;
  refresh_token?: string;
  tokens?: AuthTokens;
}

// ============================================================
// Modul 7–13 Recap & Aggregation Types
// ============================================================

export interface SurveyRecap {
  template_id: string;
  total_responden: number;
  rata_rata_skor: number;
  skala_maks: number;
  skor_per_aspek: Record<string, number>;
}

export interface PublicationRecap {
  total: number;
  disetujui: number;
  menunggu_verifikasi: number;
  perlu_revisi: number;
  ditolak: number;
  kategori_distribusi: Record<string, number>;
}

export interface TripRecap {
  total_perjalanan: number;
  total_estimasi: number;
  total_realisasi: number;
  total_efisiensi: number;
  status_distribusi: Record<string, number>;
}

export interface RkaSerapan {
  tahun_anggaran: string;
  total_pagu: number;
  total_realisasi: number;
  persentase_serapan: number;
  sisa_anggaran: number;
}

export interface RpsRecap {
  total_rps: number;
  disahkan: number;
  direview: number;
  draf: number;
  persentase_kepatuhan: number;
}

export interface EvaluationRecap {
  total_evaluasi: number;
  selesai: number;
  draf: number;
  rata_rata_cpmk: number;
}

export interface ComplaintRecap {
  total_aduan: number;
  selesai: number;
  dalam_proses: number;
  melewati_sla: number;
  status_distribusi: Record<string, number>;
  kategori_distribusi: Record<string, number>;
}

export interface DashboardStats {
  kepuasan_mitra: { skor_rata_rata: number; total_responden: number };
  publikasi: { total: number; disetujui: number };
  perjalanan_dinas: { total: number; total_realisasi: number };
  rka: { tahun: string; total_pagu: number; realisasi: number; persentase_serapan: number };
  rps: { total: number; disahkan: number; persentase_kepatuhan: number };
  aduan: { total: number; belum_selesai: number };
}
