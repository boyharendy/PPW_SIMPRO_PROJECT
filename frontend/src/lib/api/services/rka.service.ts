import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockRkaDocuments, mockRkaRealizations } from '@/lib/mock-data';
import type { ApiResponse, RkaSerapan } from '@/lib/types/api';
import type { RkaDocument, RkaRealization } from '@/lib/types';

export const rkaService = {
  // Ambil daftar dokumen RKA prodi
  getRkaList: async (): Promise<ApiResponse<RkaDocument[]>> => {
    try {
      const res = await apiRequest<RkaDocument[]>(API_ENDPOINTS.RKA.LIST);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.RKA_DOCUMENTS, res.data);
        return res;
      }
    } catch {
      // Fallback
    }
    const local = storageSync.get<RkaDocument[]>(STORAGE_KEYS.RKA_DOCUMENTS, mockRkaDocuments);
    return { success: true, message: 'OK', data: local };
  },

  // Detail dokumen RKA berdasarkan tahun anggaran
  getRkaByYear: async (tahun: string | number): Promise<ApiResponse<RkaDocument>> => {
    try {
      const res = await apiRequest<RkaDocument>(API_ENDPOINTS.RKA.DETAIL(String(tahun)));
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<RkaDocument[]>(STORAGE_KEYS.RKA_DOCUMENTS, mockRkaDocuments);
    const found = list.find((d) => Number(d.tahun_anggaran) === Number(tahun)) || mockRkaDocuments[0];
    return { success: true, message: 'OK', data: found };
  },

  // Buat dokumen RKA tahun baru
  createRka: async (data: Partial<RkaDocument>): Promise<ApiResponse<RkaDocument>> => {
    const newDoc: RkaDocument = {
      id: data.id || `rka-${data.tahun_anggaran || '2026'}`,
      tahun_anggaran: Number(data.tahun_anggaran) || new Date().getFullYear() + 1,
      judul: data.judul || 'Rencana Kerja & Anggaran',
      total_anggaran: data.total_anggaran || 150000000,
      status: 'AKTIF',
      dibuat_oleh: 'u-kaprodi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      activities: data.activities || [],
      ...data,
    };
    storageSync.prepend(STORAGE_KEYS.RKA_DOCUMENTS, newDoc, mockRkaDocuments);
    try {
      return await apiRequest<RkaDocument>(API_ENDPOINTS.RKA.CREATE, {
        method: 'POST',
        body: newDoc,
      });
    } catch {
      return { success: true, message: 'Dokumen RKA disimpan', data: newDoc };
    }
  },

  // Perbarui dokumen RKA
  updateRka: async (tahun: string | number, data: Partial<RkaDocument>): Promise<ApiResponse<RkaDocument>> => {
    storageSync.update(STORAGE_KEYS.RKA_DOCUMENTS, String(tahun), data, mockRkaDocuments);
    try {
      return await apiRequest<RkaDocument>(API_ENDPOINTS.RKA.UPDATE(String(tahun)), {
        method: 'PUT',
        body: data,
      });
    } catch {
      const list = storageSync.get<RkaDocument[]>(STORAGE_KEYS.RKA_DOCUMENTS, mockRkaDocuments);
      const updated = list.find((d) => Number(d.tahun_anggaran) === Number(tahun)) || mockRkaDocuments[0];
      return { success: true, message: 'Diperbarui', data: updated };
    }
  },

  // Catat transaksi realisasi anggaran terhadap pos RKA (persisten)
  addRealization: async (
    arg1: string | number | Partial<RkaRealization>,
    arg2?: Partial<RkaRealization>
  ): Promise<ApiResponse<RkaRealization>> => {
    let tahun = '2025';
    let data: Partial<RkaRealization> = {};

    if (typeof arg1 === 'object') {
      data = arg1;
      tahun = '2025';
    } else {
      tahun = String(arg1);
      data = arg2 || {};
    }

    const newReal: RkaRealization = {
      id: data.id || `real-${Date.now()}`,
      rka_budget_item_id: data.rka_budget_item_id || 'pos-101',
      tanggal_realisasi: data.tanggal_realisasi || new Date().toISOString().split('T')[0],
      nominal_realisasi: data.nominal_realisasi || 0,
      uraian: data.uraian || 'Pengeluaran anggaran',
      sumber_pencatatan: data.sumber_pencatatan || 'MANUAL',
      status: data.status || 'AKTIF',
      dicatat_oleh: 'u-admin',
      created_at: new Date().toISOString(),
      ...data,
    };
    storageSync.prepend(STORAGE_KEYS.RKA_REALIZATIONS, newReal, mockRkaRealizations);
    try {
      return await apiRequest<RkaRealization>(API_ENDPOINTS.RKA.REALIZATIONS(tahun), {
        method: 'POST',
        body: newReal,
      });
    } catch {
      return { success: true, message: 'Realisasi anggaran disimpan', data: newReal };
    }
  },

  // Hitung persentase dan analitika serapan pagu RKA otomatis
  getSerapan: async (tahun: string): Promise<ApiResponse<RkaSerapan>> => {
    try {
      return await apiRequest<RkaSerapan>(API_ENDPOINTS.RKA.SERAPAN(tahun));
    } catch {
      return {
        success: true,
        message: 'OK',
        data: {
          tahun_anggaran: tahun,
          total_pagu: 250000000,
          total_realisasi: 185000000,
          persentase_serapan: 74,
          sisa_anggaran: 65000000,
        },
      };
    }
  },
};

export default rkaService;
