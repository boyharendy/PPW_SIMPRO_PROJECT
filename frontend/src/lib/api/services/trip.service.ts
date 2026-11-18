import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockBusinessTrips, mockRkaRealizations } from '@/lib/mock-data';
import type { ApiResponse, TripRecap } from '@/lib/types/api';
import type { BusinessTrip, BusinessTripCost, RkaRealization } from '@/lib/types';

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
    const nowIso = new Date().toISOString();
    const newTrip: BusinessTrip = {
      id: data.id || `trip-${Date.now()}`,
      nomor_surat_tugas: data.nomor_surat_tugas,
      diajukan_oleh: data.diajukan_oleh || 'u-dosen1',
      tujuan: data.tujuan || 'Kota Tujuan',
      maksud_kegiatan: data.maksud_kegiatan || 'Maksud Kegiatan Dinas',
      tanggal_berangkat: data.tanggal_berangkat || nowIso.split('T')[0],
      tanggal_kembali: data.tanggal_kembali || nowIso.split('T')[0],
      sumber_dana: data.sumber_dana || 'RKA_PRODI',
      rka_budget_item_id: data.rka_budget_item_id,
      status: data.status || 'DIAJUKAN',
      created_at: nowIso,
      updated_at: nowIso,
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
    data: { status?: BusinessTrip['status']; nomor_surat_tugas?: string; catatan?: string; disetujui_oleh?: string }
  ): Promise<ApiResponse<BusinessTrip>> => {
    const nextStatus: BusinessTrip['status'] = data.status || 'DISETUJUI';
    const nowIso = new Date().toISOString();
    const patch: Partial<BusinessTrip> = {
      status: nextStatus,
      catatan_keputusan: data.catatan,
      updated_at: nowIso,
    };

    if (data.disetujui_oleh) {
      patch.disetujui_oleh = data.disetujui_oleh;
    }
    if (nextStatus === 'DISETUJUI') {
      patch.disetujui_at = nowIso;
    }
    if (data.nomor_surat_tugas?.trim()) {
      patch.nomor_surat_tugas = data.nomor_surat_tugas.trim();
    }

    storageSync.update(STORAGE_KEYS.TRIPS, id, patch, mockBusinessTrips);

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

  // Laporkan hasil riil dan bukti pengeluaran (FR-34)
  submitReport: async (
    id: string,
    data: {
      ringkasan?: string;
      ringkasan_hasil?: string;
      file_url?: string;
      biaya_realisasi?: number;
      realisasi_biaya?: number;
      costs?: BusinessTripCost[];
      catatan?: string;
    }
  ): Promise<ApiResponse<BusinessTrip>> => {
    const nowIso = new Date().toISOString();
    const summary = data.ringkasan_hasil || data.ringkasan || '';
    const patch: Partial<BusinessTrip> = {
      status: 'DILAPORKAN',
      laporan_hasil: summary,
      laporan_dikirim_at: nowIso,
      is_belum_lengkap: false,
      updated_at: nowIso,
    };
    if (data.costs) {
      patch.costs = data.costs;
    }

    storageSync.update(STORAGE_KEYS.TRIPS, id, patch, mockBusinessTrips);
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

  // Konfirmasi kelengkapan bukti & laporan perjalanan oleh Admin Prodi (FR-34, FR-37)
  confirmCompleteness: async (
    id: string,
    data: { lengkap: boolean; catatan?: string; dikonfirmasi_oleh?: string }
  ): Promise<ApiResponse<BusinessTrip>> => {
    const nowIso = new Date().toISOString();
    const list = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
    const current = list.find((t) => t.id === id);

    const patch: Partial<BusinessTrip> = data.lengkap
      ? {
          status: 'SELESAI',
          dikonfirmasi_oleh: data.dikonfirmasi_oleh || 'u-admin',
          dikonfirmasi_at: nowIso,
          catatan_kelengkapan: data.catatan || 'Seluruh bukti dan laporan telah diverifikasi lengkap.',
          is_belum_lengkap: false,
          updated_at: nowIso,
        }
      : {
          status: 'DILAPORKAN',
          dikonfirmasi_oleh: data.dikonfirmasi_oleh || 'u-admin',
          catatan_kelengkapan: data.catatan,
          is_belum_lengkap: true,
          updated_at: nowIso,
        };

    storageSync.update(STORAGE_KEYS.TRIPS, id, patch, mockBusinessTrips);

    // Catat realisasi RKA otomatis jika sumber dana RKA_PRODI dan dinyatakan lengkap (FR-37)
    if (data.lengkap && current && current.sumber_dana === 'RKA_PRODI' && current.rka_budget_item_id) {
      const existingReals = storageSync.get<RkaRealization[]>(
        STORAGE_KEYS.RKA_REALIZATIONS,
        mockRkaRealizations
      );
      const alreadyRecorded = existingReals.some((r) => r.business_trip_id === current.id);
      if (!alreadyRecorded) {
        const totalRealisasi = (current.costs || []).reduce(
          (sum, c) => sum + (c.realisasi_biaya ?? c.estimasi_biaya ?? 0),
          0
        );
        const newRealization: RkaRealization = {
          id: `real-${Date.now()}`,
          rka_budget_item_id: current.rka_budget_item_id,
          tanggal_realisasi: nowIso.split('T')[0],
          nominal_realisasi: totalRealisasi,
          uraian: `Realisasi Perjalanan Dinas ke ${current.tujuan}`,
          sumber_pencatatan: 'PERJALANAN_DINAS',
          business_trip_id: current.id,
          status: 'AKTIF',
          dicatat_oleh: data.dikonfirmasi_oleh || 'u-admin',
          created_at: nowIso,
        };
        storageSync.prepend(STORAGE_KEYS.RKA_REALIZATIONS, newRealization, mockRkaRealizations);
      }
    }

    const updatedList = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
    const updated = updatedList.find((t) => t.id === id) || mockBusinessTrips[0];
    return {
      success: true,
      message: data.lengkap ? 'Kelengkapan berkas dikonfirmasi selesai' : 'Ditandai belum lengkap',
      data: updated,
    };
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
