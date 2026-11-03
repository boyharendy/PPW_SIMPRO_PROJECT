import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiResponse, ComplaintRecap } from '@/lib/types/api';
import type { Complaint, ComplaintDisposition, ComplaintStatus } from '@/lib/types';

export const complaintService = {
  // Ambil daftar aduan internal sesuai peran & izin sensitivitas
  getComplaints: async (params?: Record<string, unknown>): Promise<ApiResponse<Complaint[]>> => {
    return apiRequest<Complaint[]>(API_ENDPOINTS.COMPLAINTS.LIST, { params });
  },

  // Detail aduan berdasarkan ID
  getComplaintById: async (id: string): Promise<ApiResponse<Complaint>> => {
    return apiRequest<Complaint>(API_ENDPOINTS.COMPLAINTS.DETAIL(id));
  },

  // Update status aduan
  updateStatus: async (id: string, status: ComplaintStatus): Promise<ApiResponse<Complaint>> => {
    return apiRequest<Complaint>(API_ENDPOINTS.COMPLAINTS.STATUS(id), {
      method: 'PATCH',
      body: { status },
    });
  },

  // Kirim pesan percakapan / klarifikasi internal
  addInternalMessage: async (id: string, pesan: string, isPetugas = true): Promise<ApiResponse<void>> => {
    return apiRequest<void>(API_ENDPOINTS.COMPLAINTS.MESSAGES(id), {
      method: 'POST',
      body: { pesan, is_petugas: isPetugas },
    });
  },

  // Berikan disposisi penugasan aduan kepada pejabat / dosen pembina
  addDisposition: async (id: string, data: Partial<ComplaintDisposition>): Promise<ApiResponse<ComplaintDisposition>> => {
    return apiRequest<ComplaintDisposition>(API_ENDPOINTS.COMPLAINTS.DISPOSITIONS(id), {
      method: 'POST',
      body: data,
    });
  },

  // Ambil rekapitulasi statistik aduan & kepatuhan SLA
  getRecap: async (): Promise<ApiResponse<ComplaintRecap>> => {
    return apiRequest<ComplaintRecap>(API_ENDPOINTS.COMPLAINTS.RECAP);
  },

  // Kirim aduan publik mahasiswa (Anonim / Terbuka)
  createPublicComplaint: async (data: {
    judul: string;
    deskripsi: string;
    kategori: string;
    is_anonim: boolean;
    is_sensitif: boolean;
    nim?: string;
    nama?: string;
    lampiran_url?: string;
  }): Promise<ApiResponse<{ ticket: string; nomor: string; kode_tiket: string }>> => {
    return apiRequest(API_ENDPOINTS.PUBLIC.COMPLAINT_CREATE, {
      method: 'POST',
      body: data,
      requiresAuth: false,
    });
  },

  // Lacak aduan publik berdasarkan kode tiket rahasia
  getPublicComplaint: async (ticket: string): Promise<ApiResponse<Complaint>> => {
    return apiRequest<Complaint>(API_ENDPOINTS.PUBLIC.COMPLAINT_DETAIL(ticket), {
      requiresAuth: false,
    });
  },

  // Tambah balasan pesan publik oleh pelapor via kode tiket
  addPublicMessage: async (ticket: string, pesan: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(API_ENDPOINTS.PUBLIC.COMPLAINT_MESSAGE(ticket), {
      method: 'POST',
      body: { pesan },
      requiresAuth: false,
    });
  },
};

export default complaintService;
