import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockComplaints } from '@/lib/mock-data';
import type { ApiResponse, ComplaintRecap } from '@/lib/types/api';
import type { Complaint, ComplaintDisposition, ComplaintStatus } from '@/lib/types';

export const complaintService = {
  // Ambil daftar aduan internal sesuai peran & izin sensitivitas
  getComplaints: async (params?: Record<string, unknown>): Promise<ApiResponse<Complaint[]>> => {
    try {
      const res = await apiRequest<Complaint[]>(API_ENDPOINTS.COMPLAINTS.LIST, { params });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.COMPLAINTS, res.data);
        return res;
      }
    } catch {
      // Fallback
    }
    const local = storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints);
    return { success: true, message: 'OK', data: local };
  },

  // Detail aduan berdasarkan ID
  getComplaintById: async (id: string): Promise<ApiResponse<Complaint>> => {
    try {
      const res = await apiRequest<Complaint>(API_ENDPOINTS.COMPLAINTS.DETAIL(id));
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints);
    const found = list.find((c) => c.id === id) || mockComplaints[0];
    return { success: true, message: 'OK', data: found };
  },

  // Update status aduan
  updateStatus: async (id: string, status: ComplaintStatus): Promise<ApiResponse<Complaint>> => {
    storageSync.update(STORAGE_KEYS.COMPLAINTS, id, { status }, mockComplaints);
    try {
      return await apiRequest<Complaint>(API_ENDPOINTS.COMPLAINTS.STATUS(id), {
        method: 'PATCH',
        body: { status },
      });
    } catch {
      const list = storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints);
      const updated = list.find((c) => c.id === id) || mockComplaints[0];
      return { success: true, message: 'Status diubah', data: updated };
    }
  },

  // Kirim pesan percakapan / klarifikasi internal
  addInternalMessage: async (id: string, pesan: string, isPetugas = true): Promise<ApiResponse<void>> => {
    try {
      return await apiRequest<void>(API_ENDPOINTS.COMPLAINTS.MESSAGES(id), {
        method: 'POST',
        body: { pesan, is_petugas: isPetugas },
      });
    } catch {
      return { success: true, message: 'Pesan dicatat', data: undefined };
    }
  },

  // Berikan disposisi penugasan aduan
  addDisposition: async (id: string, data: Partial<ComplaintDisposition>): Promise<ApiResponse<ComplaintDisposition>> => {
    try {
      return await apiRequest<ComplaintDisposition>(API_ENDPOINTS.COMPLAINTS.DISPOSITIONS(id), {
        method: 'POST',
        body: data,
      });
    } catch {
      const newDisp: ComplaintDisposition = {
        id: `disp-${Date.now()}`,
        complaint_id: id,
        penanggung_jawab_id: data.penanggung_jawab_id || 'u-petugas',
        didisposisi_oleh: data.didisposisi_oleh || 'u-pengelola',
        tenggat: data.tenggat || new Date().toISOString(),
        catatan: data.catatan || '',
        status: data.status || 'AKTIF',
        created_at: new Date().toISOString(),
      };
      return { success: true, message: 'Disposisi berhasil dibuat', data: newDisp };
    }
  },

  // Alias createDisposition
  createDisposition: async (id: string, data: { penanggung_jawab_id: string; catatan?: string; tenggat: string }): Promise<ApiResponse<ComplaintDisposition>> => {
    const newDisp: ComplaintDisposition = {
      id: `disp-${Date.now()}`,
      complaint_id: id,
      penanggung_jawab_id: data.penanggung_jawab_id,
      didisposisi_oleh: 'u-pengelola-aduan',
      tenggat: data.tenggat,
      catatan: data.catatan,
      status: 'AKTIF',
      created_at: new Date().toISOString(),
    };
    try {
      const res = await apiRequest<ComplaintDisposition>(API_ENDPOINTS.COMPLAINTS.DISPOSITIONS(id), {
        method: 'POST',
        body: data,
      });
      if (res.data) return res;
    } catch {}
    return { success: true, message: 'Disposisi berhasil dibuat', data: newDisp };
  },

  // Balas aduan
  replyComplaint: async (id: string, data: { isi: string; is_internal: boolean }): Promise<ApiResponse<void>> => {
    try {
      return await apiRequest<void>(API_ENDPOINTS.COMPLAINTS.MESSAGES(id), {
        method: 'POST',
        body: { pesan: data.isi, is_catatan_internal: data.is_internal },
      });
    } catch {
      return { success: true, message: 'Pesan dicatat', data: undefined };
    }
  },

  // Selesaikan aduan
  resolveComplaint: async (id: string, data: { solusi: string }): Promise<ApiResponse<void>> => {
    storageSync.update(STORAGE_KEYS.COMPLAINTS, id, { status: 'SELESAI', tanggal_selesai: new Date().toISOString().split('T')[0] }, mockComplaints);
    try {
      return await apiRequest<void>(API_ENDPOINTS.COMPLAINTS.UPDATE(id), {
        method: 'PUT',
        body: { status: 'SELESAI', solusi: data.solusi },
      });
    } catch {
      return { success: true, message: 'Aduan diselesaikan', data: undefined };
    }
  },

  // Buat aduan internal / dari user login
  createComplaint: async (data: Partial<Complaint>): Promise<ApiResponse<Complaint>> => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const ticketCode = data.kode_tiket || `ADU-${segment(4)}-${segment(4)}-${segment(4)}`;
    const newComp: Complaint = {
      id: data.id || `comp-${Date.now()}`,
      nomor_aduan: data.nomor_aduan || `ADU-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      kode_tiket: ticketCode,
      kode_tiket_hash: data.kode_tiket_hash || `hash_${ticketCode}`,
      kategori: data.kategori || 'FASILITAS',
      judul: data.judul || 'Aduan Baru',
      uraian: data.uraian || '',
      is_sensitif: Boolean(data.is_sensitif),
      status: data.status || 'DITERIMA',
      tanggal_diterima: data.tanggal_diterima || new Date().toISOString().split('T')[0],
      messages: data.messages || [],
      dispositions: data.dispositions || [],
      ...data,
    };

    storageSync.prepend(STORAGE_KEYS.COMPLAINTS, newComp, mockComplaints);

    try {
      const res = await apiRequest<Complaint>(API_ENDPOINTS.COMPLAINTS.CREATE, {
        method: 'POST',
        body: newComp,
      });
      if (res.data) return res;
    } catch {}

    return { success: true, message: 'Aduan berhasil disimpan', data: newComp };
  },

  // Ambil rekapitulasi statistik aduan
  getRecap: async (): Promise<ApiResponse<ComplaintRecap>> => {
    try {
      return await apiRequest<ComplaintRecap>(API_ENDPOINTS.COMPLAINTS.RECAP);
    } catch {
      return {
        success: true,
        message: 'OK',
        data: {
          total_aduan: 8,
          selesai: 5,
          dalam_proses: 3,
          melewati_sla: 1,
          status_distribusi: {
            DITERIMA: 1,
            DIDISPOSISIKAN: 1,
            DITINDAKLANJUTI: 1,
            SELESAI: 5,
          },
          kategori_distribusi: {
            AKADEMIK: 3,
            FASILITAS: 3,
            PERUNDUNGAN_KEKERASAN: 2,
          },
        },
      };
    }
  },

  // Kirim aduan publik mahasiswa (Anonim / Terbuka) - Tersimpan persisten
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
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const ticketCode = `ADU-${segment(4)}-${segment(4)}-${segment(4)}`;
    const newComplaint: Complaint = {
      id: `c-${Date.now()}`,
      nomor_aduan: `ADU/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
      kode_tiket: ticketCode,
      kode_tiket_hash: `hash_${ticketCode}`,
      judul: data.judul,
      uraian: data.deskripsi,
      kategori: data.kategori as any,
      is_sensitif: data.is_sensitif,
      status: 'DITERIMA',
      tanggal_diterima: new Date().toISOString().split('T')[0],
      messages: [],
      dispositions: [],
    };

    storageSync.prepend(STORAGE_KEYS.COMPLAINTS, newComplaint, mockComplaints);

    try {
      const res = await apiRequest<{ ticket: string; nomor: string; kode_tiket: string }>(
        API_ENDPOINTS.PUBLIC.COMPLAINT_CREATE,
        {
          method: 'POST',
          body: data,
          requiresAuth: false,
        }
      );
      if (res.data) return res;
    } catch {
      // Fallback
    }

    return {
      success: true,
      message: 'Aduan berhasil dikirim',
      data: {
        ticket: ticketCode,
        nomor: newComplaint.nomor_aduan,
        kode_tiket: ticketCode,
      },
    };
  },

  // Lacak aduan publik berdasarkan kode tiket rahasia
  getPublicComplaint: async (ticket: string): Promise<ApiResponse<Complaint>> => {
    try {
      const res = await apiRequest<Complaint>(API_ENDPOINTS.PUBLIC.COMPLAINT_DETAIL(ticket), {
        requiresAuth: false,
      });
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints);
    const found = list.find((c) => c.kode_tiket && c.kode_tiket.toUpperCase() === ticket.toUpperCase()) || list[0];
    return { success: true, message: 'OK', data: found };
  },

  // Tambah balasan pesan publik oleh pelapor via kode tiket
  addPublicMessage: async (ticket: string, pesan: string): Promise<ApiResponse<void>> => {
    try {
      return await apiRequest<void>(API_ENDPOINTS.PUBLIC.COMPLAINT_MESSAGE(ticket), {
        method: 'POST',
        body: { pesan },
        requiresAuth: false,
      });
    } catch {
      return { success: true, message: 'Pesan dikirim', data: undefined };
    }
  },
};

export default complaintService;
