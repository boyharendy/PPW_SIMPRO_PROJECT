import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockPublications } from '@/lib/mock-data';
import type { ApiResponse, PublicationRecap } from '@/lib/types/api';
import type { Publication } from '@/lib/types';

export const publicationService = {
  // Ambil daftar publikasi ilmiah
  getPublications: async (params?: Record<string, unknown>): Promise<ApiResponse<Publication[]>> => {
    try {
      const res = await apiRequest<Publication[]>(API_ENDPOINTS.PUBLICATIONS.LIST, { params });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.PUBLICATIONS, res.data);
        return res;
      }
    } catch {
      // Fallback
    }
    const local = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    return { success: true, message: 'OK', data: local };
  },

  // Detail publikasi
  getPublicationById: async (id: string): Promise<ApiResponse<Publication>> => {
    try {
      const res = await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.DETAIL(id));
      if (res.data) return res;
    } catch {
      // Fallback
    }
    const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    const found = list.find((p) => p.id === id) || mockPublications[0];
    return { success: true, message: 'OK', data: found };
  },

  // Buat usulan publikasi baru (persisten)
  createPublication: async (data: Partial<Publication>): Promise<ApiResponse<Publication>> => {
    const hasMhs = data.authors && data.authors.length > 0
      ? data.authors.some(a => a.tipe_penulis === 'MAHASISWA')
      : false;
    const needsVerif = Boolean(hasMhs || data.verifikator_id || data.verifikator);

    const newPub: Publication = {
      id: data.id || `pub-${Date.now()}`,
      judul: data.judul || 'Judul Publikasi Baru',
      jenis: data.jenis || 'JURNAL',
      nama_target: data.nama_target || 'Target Publikasi',
      peringkat: data.peringkat || 'SINTA_2',
      status: data.status || 'DIAJUKAN',
      status_verifikasi: data.status_verifikasi || (needsVerif ? 'MENUNGGU' : 'TIDAK_PERLU'),
      dicatat_oleh: data.dicatat_oleh || 'u-dosen',
      tahun: data.tahun || new Date().getFullYear(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      authors: data.authors || [],
      reviews: [],
      stage_logs: data.stage_logs || [],
      ...data,
    };

    storageSync.prepend(STORAGE_KEYS.PUBLICATIONS, newPub, mockPublications);

    try {
      const res = await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.CREATE, {
        method: 'POST',
        body: newPub,
      });
      if (res.data) return res;
    } catch {
      // Offline fallback
    }

    return { success: true, message: 'Usulan publikasi berhasil disimpan', data: newPub };
  },

  // Perbarui publikasi
  updatePublication: async (id: string, data: Partial<Publication>): Promise<ApiResponse<Publication>> => {
    storageSync.update(STORAGE_KEYS.PUBLICATIONS, id, data, mockPublications);
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.UPDATE(id), {
        method: 'PUT',
        body: data,
      });
    } catch {
      const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = list.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Diperbarui', data: updated };
    }
  },

  // Hapus publikasi draf
  deletePublication: async (id: string): Promise<ApiResponse<void>> => {
    storageSync.remove(STORAGE_KEYS.PUBLICATIONS, id, mockPublications);
    try {
      return await apiRequest<void>(API_ENDPOINTS.PUBLICATIONS.DELETE(id), {
        method: 'DELETE',
      });
    } catch {
      return { success: true, message: 'Dihapus', data: undefined };
    }
  },

  // Ajukan usulan publikasi untuk verifikasi
  submitPublication: async (id: string): Promise<ApiResponse<Publication>> => {
    const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    const existing = list.find((p) => p.id === id);
    const hasMhs = existing?.authors && existing.authors.length > 0
      ? existing.authors.some(a => a.tipe_penulis === 'MAHASISWA')
      : false;
    const needsVerif = Boolean(hasMhs || existing?.verifikator_id || existing?.verifikator);

    const statusVerif = needsVerif ? 'MENUNGGU' : 'TIDAK_PERLU';
    storageSync.update(STORAGE_KEYS.PUBLICATIONS, id, { status: 'DIAJUKAN', status_verifikasi: statusVerif }, mockPublications);
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.SUBMIT(id), {
        method: 'POST',
      });
    } catch {
      const updatedList = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = updatedList.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Diajukan', data: updated };
    }
  },

  // Update status tahapan publikasi oleh pihak yang mem-publish (Dosen / Mahasiswa)
  updateStatus: async (
    id: string,
    data: { status: string; catatan?: string; bukti?: string }
  ): Promise<ApiResponse<Publication>> => {
    const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    const current = list.find((p) => p.id === id);
    const newLog = {
      id: `psl-${Date.now()}`,
      publication_id: id,
      tahap: data.status as Publication['status'],
      tanggal_tahap: new Date().toISOString().split('T')[0],
      tautan_bukti: data.bukti,
      catatan: data.catatan,
      dicatat_oleh: current?.dicatat_oleh || 'u-dosen1',
      status_verifikasi: (current?.status_verifikasi === 'MENUNGGU' ? 'MENUNGGU' : 'TIDAK_PERLU') as Publication['status_verifikasi'],
      created_at: new Date().toISOString(),
    };
    storageSync.update(
      STORAGE_KEYS.PUBLICATIONS,
      id,
      {
        status: data.status as Publication['status'],
        updated_at: new Date().toISOString(),
        stage_logs: [newLog, ...(current?.stage_logs || [])],
      },
      mockPublications
    );
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.STATUS(id), {
        method: 'PATCH',
        body: data,
      });
    } catch {
      const updatedList = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = updatedList.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Status publikasi diperbarui', data: updated };
    }
  },

  // Verifikasi kelayakan masuk rekap oleh Dosen Pembimbing / Penulis Pendamping (FR-31)
  verifyPublication: async (
    id: string,
    data: { status: string; catatan?: string; verifikator_nama?: string }
  ): Promise<ApiResponse<Publication>> => {
    storageSync.update(
      STORAGE_KEYS.PUBLICATIONS,
      id,
      {
        status_verifikasi: data.status as Publication['status_verifikasi'],
        catatan_verifikasi: data.catatan,
        verifikator_nama: data.verifikator_nama,
        diverifikasi_at: new Date().toISOString(),
      },
      mockPublications
    );
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.VERIFY(id), {
        method: 'POST',
        body: data,
      });
    } catch {
      const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = list.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Diverifikasi', data: updated };
    }
  },

  // Tetapkan dosen reviewer internal sebelum naskah diajukan (FR-31)
  assignReviewer: async (
    id: string,
    data: { reviewer_id: string; reviewer_nama?: string; tenggat_review?: string }
  ): Promise<ApiResponse<Publication>> => {
    const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    const current = list.find((p) => p.id === id);
    const newReview = {
      id: `rev-${Date.now()}`,
      publication_id: id,
      reviewer_id: data.reviewer_id,
      reviewer_nama: data.reviewer_nama,
      ditetapkan_oleh: current?.dicatat_oleh || 'u-dosen1',
      status: 'DITUGASKAN' as const,
      tenggat_review: data.tenggat_review,
      ditugaskan_at: new Date().toISOString(),
    };
    const nextStatus = current?.status === 'DRAF' ? 'REVIEW_INTERNAL' : (current?.status || 'REVIEW_INTERNAL');
    storageSync.update(
      STORAGE_KEYS.PUBLICATIONS,
      id,
      {
        status: nextStatus as Publication['status'],
        reviews: [...(current?.reviews || []), newReview],
      },
      mockPublications
    );
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.REVIEWS(id), {
        method: 'POST',
        body: data,
      });
    } catch {
      const updatedList = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = updatedList.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Reviewer internal ditetapkan', data: updated };
    }
  },

  // Selesaikan review internal publikasi dengan rekomendasi dan catatan (FR-31)
  completeReview: async (
    reviewId: string,
    data: { rekomendasi: string; catatan: string }
  ): Promise<ApiResponse<Publication>> => {
    const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    let targetPub: Publication | undefined;
    for (const pub of list) {
      if (pub.reviews?.some((r) => r.id === reviewId)) {
        const updatedReviews = pub.reviews.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                status: 'SELESAI' as const,
                rekomendasi: data.rekomendasi as 'LAYAK_DIAJUKAN' | 'PERLU_PERBAIKAN',
                catatan_review: data.catatan,
                catatan: data.catatan,
                selesai_at: new Date().toISOString(),
              }
            : r
        );
        storageSync.update(STORAGE_KEYS.PUBLICATIONS, pub.id, { reviews: updatedReviews }, mockPublications);
        targetPub = { ...pub, reviews: updatedReviews };
        break;
      }
    }
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.COMPLETE_REVIEW(reviewId), {
        method: 'POST',
        body: data,
      });
    } catch {
      return {
        success: true,
        message: 'Review internal diselesaikan',
        data: targetPub || mockPublications[0],
      };
    }
  },

  // Tambah catatan review substansi oleh reviewer
  addReview: async (id: string, data: { reviewer_id: string; catatan: string; rekomendasi: string }): Promise<ApiResponse<Publication>> => {
    try {
      return await apiRequest<Publication>(API_ENDPOINTS.PUBLICATIONS.REVIEWS(id), {
        method: 'POST',
        body: data,
      });
    } catch {
      const list = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      const updated = list.find((p) => p.id === id) || mockPublications[0];
      return { success: true, message: 'Review disimpan', data: updated };
    }
  },

  // Rekapitulasi publikasi ilmiah prodi
  getRecap: async (): Promise<ApiResponse<PublicationRecap>> => {
    try {
      return await apiRequest<PublicationRecap>(API_ENDPOINTS.PUBLICATIONS.RECAP);
    } catch {
      return {
        success: true,
        message: 'OK',
        data: {
          total: 8,
          disetujui: 5,
          menunggu_verifikasi: 2,
          perlu_revisi: 1,
          ditolak: 0,
          kategori_distribusi: {
            JURNAL_INTERNASIONAL_BEREPUTASI: 3,
            JURNAL_NASIONAL_TERAKREDITASI: 3,
            PROSIDING_INTERNASIONAL: 2,
          },
        },
      };
    }
  },
};

export default publicationService;
