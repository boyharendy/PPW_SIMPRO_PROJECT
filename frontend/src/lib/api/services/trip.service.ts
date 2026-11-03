import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiResponse, TripRecap } from '@/lib/types/api';
import type { BusinessTrip } from '@/lib/types';

export const tripService = {
  // Ambil daftar perjalanan dinas
  getTrips: async (params?: Record<string, unknown>): Promise<ApiResponse<BusinessTrip[]>> => {
    return apiRequest<BusinessTrip[]>(API_ENDPOINTS.TRIPS.LIST, { params });
  },

  // Detail perjalanan dinas
  getTripById: async (id: string): Promise<ApiResponse<BusinessTrip>> => {
    return apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.DETAIL(id));
  },

  // Buat permohonan dinas baru
  createTrip: async (data: Partial<BusinessTrip>): Promise<ApiResponse<BusinessTrip>> => {
    return apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.CREATE, {
      method: 'POST',
      body: data,
    });
  },

  // Perbarui permohonan dinas
  updateTrip: async (id: string, data: Partial<BusinessTrip>): Promise<ApiResponse<BusinessTrip>> => {
    return apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.UPDATE(id), {
      method: 'PUT',
      body: data,
    });
  },

  // Hapus permohonan dinas draf
  deleteTrip: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(API_ENDPOINTS.TRIPS.DELETE(id), {
      method: 'DELETE',
    });
  },

  // Ajukan usulan dinas ke Kaprodi
  submitTrip: async (id: string): Promise<ApiResponse<BusinessTrip>> => {
    return apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.SUBMIT(id), {
      method: 'POST',
    });
  },

  // Keputusan persetujuan dinas oleh Kaprodi
  approveTrip: async (id: string, data: { status: string; catatan?: string }): Promise<ApiResponse<BusinessTrip>> => {
    return apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.APPROVE(id), {
      method: 'POST',
      body: data,
    });
  },

  // Laporkan hasil riil dan bukti pengeluaran
  submitReport: async (id: string, data: { ringkasan: string; file_url?: string; biaya_realisasi?: number }): Promise<ApiResponse<BusinessTrip>> => {
    return apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.REPORT(id), {
      method: 'POST',
      body: data,
    });
  },

  // Rekapitulasi perjalanan dinas & serapan anggaran
  getRecap: async (): Promise<ApiResponse<TripRecap>> => {
    return apiRequest<TripRecap>(API_ENDPOINTS.TRIPS.RECAP);
  },
};

export default tripService;
