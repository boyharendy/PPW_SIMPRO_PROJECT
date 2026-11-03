import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockBusinessTrips } from '@/lib/mock-data';
import type { ApiResponse, TripRecap } from '@/lib/types/api';
import type { BusinessTrip } from '@/lib/types';

export const tripService = {
  // Ambil daftar perjalanan dinas
  getTrips: async (params?: Record<string, unknown>): Promise<ApiResponse<BusinessTrip[]>> => {
    try {
      const res = await apiRequest<BusinessTrip[]>(API_ENDPOINTS.TRIPS.LIST, { params });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.TRIPS, res.data);
        return res;
      }
    } catch {
      // Fallback
    }
    const local = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
    return { success: true, message: 'OK', data: local };
  },

  // Detail perjalanan dinas
  getTripById: async (id: string): Promise<ApiResponse<BusinessTrip>> => {
    try {
      const res = await apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.DETAIL(id));
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
    const found = list.find((t) => t.id === id) || mockBusinessTrips[0];
    return { success: true, message: 'OK', data: found };
  },

  // Buat permohonan dinas baru (persisten)
  createTrip: async (data: Partial<BusinessTrip>): Promise<ApiResponse<BusinessTrip>> => {
    const newTrip: BusinessTrip = {
      id: data.id || `trip-${Date.now()}`,
      nomor_surat_tugas: data.nomor_surat_tugas || `ST/SIMPRO/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
      diajukan_oleh: data.diajukan_oleh || 'u-dosen',
      tujuan: data.tujuan || 'Kota Tujuan',
      maksud_kegiatan: data.maksud_kegiatan || 'Maksud Kegiatan Dinas',
      tanggal_berangkat: data.tanggal_berangkat || new Date().toISOString().split('T')[0],
      tanggal_kembali: data.tanggal_kembali || new Date().toISOString().split('T')[0],
      sumber_dana: data.sumber_dana || 'RKA_PRODI',
      rka_budget_item_id: data.rka_budget_item_id || 'pos-1',
      status: 'DIAJUKAN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participants: data.participants || [],
      costs: data.costs || [],
      ...data,
    };

    storageSync.prepend(STORAGE_KEYS.TRIPS, newTrip, mockBusinessTrips);

    try {
      const res = await apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.CREATE, {
        method: 'POST',
        body: newTrip,
      });
      if (res.data) return res;
    } catch {
      // Offline fallback
    }

    return { success: true, message: 'Permohonan perjalanan dinas berhasil disimpan', data: newTrip };
  },

  // Perbarui permohonan dinas
  updateTrip: async (id: string, data: Partial<BusinessTrip>): Promise<ApiResponse<BusinessTrip>> => {
    storageSync.update(STORAGE_KEYS.TRIPS, id, data, mockBusinessTrips);
    try {
      return await apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.UPDATE(id), {
        method: 'PUT',
        body: data,
      });
    } catch {
      const list = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
      const updated = list.find((t) => t.id === id) || mockBusinessTrips[0];
      return { success: true, message: 'Diperbarui', data: updated };
    }
  },

  // Hapus permohonan dinas draf
  deleteTrip: async (id: string): Promise<ApiResponse<void>> => {
    storageSync.remove(STORAGE_KEYS.TRIPS, id, mockBusinessTrips);
    try {
      return await apiRequest<void>(API_ENDPOINTS.TRIPS.DELETE(id), {
        method: 'DELETE',
      });
    } catch {
      return { success: true, message: 'Dihapus', data: undefined };
    }
  },

  // Ajukan usulan dinas ke Kaprodi
  submitTrip: async (id: string): Promise<ApiResponse<BusinessTrip>> => {
    storageSync.update(STORAGE_KEYS.TRIPS, id, { status: 'DIAJUKAN' }, mockBusinessTrips);
    try {
      return await apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.SUBMIT(id), {
        method: 'POST',
      });
    } catch {
      const list = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
      const updated = list.find((t) => t.id === id) || mockBusinessTrips[0];
      return { success: true, message: 'Diajukan', data: updated };
    }
  },

  // Keputusan persetujuan dinas oleh Kaprodi
  approveTrip: async (
    id: string,
    data: { status?: string; nomor_surat_tugas?: string; catatan?: string }
  ): Promise<ApiResponse<BusinessTrip>> => {
    const nextStatus = data.status || 'DISETUJUI';
    storageSync.update(STORAGE_KEYS.TRIPS, id, {
      status: nextStatus as any,
      nomor_surat_tugas: data.nomor_surat_tugas,
      catatan_keputusan: data.catatan,
      disetujui_at: nextStatus === 'DISETUJUI' ? new Date().toISOString() : undefined,
    }, mockBusinessTrips);

    try {
      return await apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.APPROVE(id), {
        method: 'POST',
        body: { status: nextStatus, ...data },
      });
    } catch {
      const list = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
      const updated = list.find((t) => t.id === id) || mockBusinessTrips[0];
      return { success: true, message: 'Keputusan disimpan', data: updated };
    }
  },

  // Tolak permohonan dinas
  rejectTrip: async (id: string, catatan?: string): Promise<ApiResponse<BusinessTrip>> => {
    storageSync.update(STORAGE_KEYS.TRIPS, id, { status: 'DITOLAK', catatan_keputusan: catatan }, mockBusinessTrips);
    try {
      return await apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.APPROVE(id), {
        method: 'POST',
        body: { status: 'DITOLAK', catatan },
      });
    } catch {
      const list = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
      const updated = list.find((t) => t.id === id) || mockBusinessTrips[0];
      return { success: true, message: 'Ditolak', data: updated };
    }
  },

  // Laporkan hasil riil dan bukti pengeluaran
  submitReport: async (
    id: string,
    data: {
      ringkasan?: string;
      ringkasan_hasil?: string;
      file_url?: string;
      biaya_realisasi?: number;
      realisasi_biaya?: number;
      catatan?: string;
    }
  ): Promise<ApiResponse<BusinessTrip>> => {
    const summary = data.ringkasan_hasil || data.ringkasan || '';
    storageSync.update(STORAGE_KEYS.TRIPS, id, { status: 'DILAPORKAN', laporan_hasil: summary }, mockBusinessTrips);
    try {
      return await apiRequest<BusinessTrip>(API_ENDPOINTS.TRIPS.REPORT(id), {
        method: 'POST',
        body: data,
      });
    } catch {
      const list = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
      const updated = list.find((t) => t.id === id) || mockBusinessTrips[0];
      return { success: true, message: 'Laporan disimpan', data: updated };
    }
  },

  // Rekapitulasi perjalanan dinas & serapan anggaran
  getRecap: async (): Promise<ApiResponse<TripRecap>> => {
    try {
      return await apiRequest<TripRecap>(API_ENDPOINTS.TRIPS.RECAP);
    } catch {
      return {
        success: true,
        message: 'OK',
        data: {
          total_perjalanan: 10,
          total_estimasi: 45000000,
          total_realisasi: 42300000,
          total_efisiensi: 2700000,
          status_distribusi: {
            DISETUJUI: 4,
            LAPORAN_TERVERIFIKASI: 4,
            DIAJUKAN: 2,
          },
        },
      };
    }
  },
};

export default tripService;
