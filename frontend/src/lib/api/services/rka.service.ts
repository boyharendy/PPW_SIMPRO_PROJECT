import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockBusinessTrips, mockRkaDocuments, mockRkaRealizations } from '@/lib/mock-data';
import {
  computeDocumentTotalPagu,
  enrichRkaDocument,
  getDocumentRealizations,
  reconcileTripsWithRealizations,
  validateRkaForApproval,
} from '@/lib/rka-utils';
import type { ApiResponse, RkaSerapan } from '@/lib/types/api';
import type {
  BusinessTrip,
  RkaActivity,
  RkaActivityExecutionStatus,
  RkaAuditEntry,
  RkaDocument,
  RkaRealization,
  RkaVersion,
} from '@/lib/types';

function loadDocs(): RkaDocument[] {
  return storageSync.get<RkaDocument[]>(STORAGE_KEYS.RKA_DOCUMENTS, mockRkaDocuments);
}

function saveDocs(docs: RkaDocument[]): void {
  storageSync.set(STORAGE_KEYS.RKA_DOCUMENTS, docs);
}

function loadTrips(): BusinessTrip[] {
  return storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
}

function loadAndReconcileRealizations(): RkaRealization[] {
  const existing = storageSync.get<RkaRealization[]>(STORAGE_KEYS.RKA_REALIZATIONS, mockRkaRealizations);
  const trips = loadTrips();
  const reconciled = reconcileTripsWithRealizations(trips, existing);
  if (reconciled.length !== existing.length) {
    storageSync.set(STORAGE_KEYS.RKA_REALIZATIONS, reconciled);
  }
  return reconciled;
}

function cloneActivities(activities: RkaActivity[] = []): RkaActivity[] {
  return JSON.parse(JSON.stringify(activities)) as RkaActivity[];
}

function appendAudit(
  doc: RkaDocument,
  entry: Omit<RkaAuditEntry, 'id' | 'waktu'>
): RkaAuditEntry[] {
  const next: RkaAuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    waktu: new Date().toISOString(),
    ...entry,
  };
  return [next, ...(doc.audit_logs || [])];
}

export const rkaService = {
  /**
   * Ambil daftar dokumen RKA prodi dengan total pagu & realisasi terhitung otomatis (NF-07).
   */
  getRkaList: async (): Promise<ApiResponse<RkaDocument[]>> => {
    try {
      const res = await apiRequest<RkaDocument[]>(API_ENDPOINTS.RKA.LIST);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        storageSync.set(STORAGE_KEYS.RKA_DOCUMENTS, res.data);
      }
    } catch {
      // Offline / dev fallback
    }
    const docs = loadDocs();
    const trips = loadTrips();
    const realizations = loadAndReconcileRealizations();
    const enriched = docs
      .map((d) => enrichRkaDocument(d, realizations, trips))
      .sort((a, b) => Number(b.tahun_anggaran) - Number(a.tahun_anggaran));
    return { success: true, message: 'OK', data: enriched };
  },

  /**
   * Ambil detail dokumen RKA berdasarkan tahun anggaran (termasuk versi & realisasi Modul 9).
   */
  getRkaByYear: async (tahun: string | number): Promise<ApiResponse<RkaDocument | null>> => {
    try {
      const res = await apiRequest<RkaDocument>(API_ENDPOINTS.RKA.DETAIL(String(tahun)));
      if (res.data && res.data.tahun_anggaran) {
        const docs = loadDocs();
        const exists = docs.some((d) => Number(d.tahun_anggaran) === Number(tahun));
        if (!exists) {
          saveDocs([res.data, ...docs]);
        }
      }
    } catch {
      // Offline / dev fallback
    }
    const docs = loadDocs();
    const trips = loadTrips();
    const realizations = loadAndReconcileRealizations();
    const found = docs.find((d) => Number(d.tahun_anggaran) === Number(tahun) || d.id === String(tahun));
    if (!found) {
      return { success: false, message: `Dokumen RKA tahun ${tahun} tidak ditemukan`, data: null };
    }
    return { success: true, message: 'OK', data: enrichRkaDocument(found, realizations, trips) };
  },

  /**
   * Buat dokumen RKA tahun baru berstatus DRAF dengan versi awal v1 (FR-36, NF-01).
   */
  createRka: async (data: {
    tahun_anggaran: number;
    judul: string;
    dibuat_oleh?: string;
    actorName?: string;
  }): Promise<ApiResponse<RkaDocument>> => {
    const docs = loadDocs();
    const tahunNum = Number(data.tahun_anggaran);
    if (!tahunNum || tahunNum < 2000 || tahunNum > 2100) {
      return { success: false, message: 'Tahun anggaran tidak valid.', data: null as unknown as RkaDocument };
    }
    if (docs.some((d) => Number(d.tahun_anggaran) === tahunNum)) {
      return {
        success: false,
        message: `Dokumen RKA untuk Tahun Anggaran ${tahunNum} sudah ada.`,
        data: null as unknown as RkaDocument,
      };
    }

    const now = new Date().toISOString();
    const docId = `rka-${tahunNum}`;
    const v1Id = `${docId}-v1`;
    const initialVersion: RkaVersion = {
      id: v1Id,
      rka_id: docId,
      nomor_versi: 1,
      status: 'DRAF',
      total_anggaran: 0,
      draft_payload: { activities: [] },
      alasan_revisi: 'Penyusunan awal RKA tahun anggaran baru',
      row_version: 1,
      dibuat_oleh: data.dibuat_oleh || 'u-kaprodi',
      created_at: now,
    };

    const newDoc: RkaDocument = {
      id: docId,
      tahun_anggaran: tahunNum,
      judul: data.judul.trim(),
      status: 'DRAF',
      versi_kerja_id: v1Id,
      total_anggaran: 0,
      dibuat_oleh: data.dibuat_oleh || 'u-kaprodi',
      created_at: now,
      updated_at: now,
      activities: [],
      versions: [initialVersion],
      audit_logs: [
        {
          id: `aud-${Date.now()}`,
          waktu: now,
          aktor: data.actorName || 'Kaprodi',
          peran: 'KAPRODI',
          aksi: 'BUAT_RKA_DRAF',
          versi: 1,
          ringkasan: `Membuat dokumen RKA Tahun ${tahunNum} berstatus Draf (v1).`,
        },
      ],
    };

    saveDocs([newDoc, ...docs]);

    try {
      await apiRequest<RkaDocument>(API_ENDPOINTS.RKA.CREATE, {
        method: 'POST',
        body: newDoc,
      });
    } catch {
      // Offline fallback already persisted locally
    }
    return { success: true, message: 'Dokumen RKA Draf berhasil dibuat', data: newDoc };
  },

  /**
   * Simpan perubahan Daftar Butir Kegiatan & Pos Anggaran pada Draf atau Versi Kerja Revisi (NF-07).
   */
  saveDraftActivities: async (
    tahun: string | number,
    activities: RkaActivity[],
    options?: { alasanRevisi?: string; actorName?: string; summary?: string }
  ): Promise<ApiResponse<RkaDocument>> => {
    const docs = loadDocs();
    const idx = docs.findIndex((d) => Number(d.tahun_anggaran) === Number(tahun) || d.id === String(tahun));
    if (idx === -1) {
      return { success: false, message: 'Dokumen RKA tidak ditemukan', data: null as unknown as RkaDocument };
    }

    const doc = docs[idx];
    const now = new Date().toISOString();
    const cloned = cloneActivities(activities);
    const totalOtomatis = computeDocumentTotalPagu(cloned);

    const versions = [...(doc.versions || [])];
    const workingIdx = versions.findIndex(
      (v) => v.id === doc.versi_kerja_id || v.status === 'DRAF' || v.status === 'PERLU_REVISI'
    );

    if (doc.status === 'DRAF') {
      doc.activities = cloned;
      doc.total_anggaran = totalOtomatis;
      if (workingIdx >= 0) {
        versions[workingIdx] = {
          ...versions[workingIdx],
          total_anggaran: totalOtomatis,
          draft_payload: { activities: cloned },
          alasan_revisi: options?.alasanRevisi ?? versions[workingIdx].alasan_revisi,
          row_version: (versions[workingIdx].row_version || 1) + 1,
        };
      }
    } else if (doc.status === 'AKTIF' && workingIdx >= 0) {
      versions[workingIdx] = {
        ...versions[workingIdx],
        total_anggaran: totalOtomatis,
        draft_payload: { activities: cloned },
        alasan_revisi: options?.alasanRevisi ?? versions[workingIdx].alasan_revisi,
        row_version: (versions[workingIdx].row_version || 1) + 1,
      };
    } else {
      return {
        success: false,
        message: 'Dokumen sudah Aktif/Ditutup. Buat Revisi RKA terlebih dahulu untuk mengubah butir kegiatan.',
        data: doc,
      };
    }

    const updatedDoc: RkaDocument = {
      ...doc,
      versions,
      updated_at: now,
      audit_logs: appendAudit(doc, {
        aktor: options?.actorName || 'Kaprodi',
        peran: 'KAPRODI',
        aksi: 'SIMPAN_DRAF_KEGIATAN',
        versi: workingIdx >= 0 ? versions[workingIdx].nomor_versi : undefined,
        ringkasan:
          options?.summary ||
          `Memperbarui daftar butir kegiatan (${cloned.length} kegiatan, Total Pagu otomatis Rp ${totalOtomatis.toLocaleString('id-ID')}).`,
      }),
    };

    docs[idx] = updatedDoc;
    saveDocs(docs);

    try {
      await apiRequest<RkaDocument>(API_ENDPOINTS.RKA.UPDATE(String(tahun)), {
        method: 'PUT',
        body: updatedDoc,
      });
    } catch {
      // Fallback persisted
    }

    const enriched = enrichRkaDocument(updatedDoc, loadAndReconcileRealizations(), loadTrips());
    return { success: true, message: 'Draf butir kegiatan berhasil disimpan', data: enriched };
  },

  /**
   * Buka revisi baru dari RKA berstatus AKTIF; menyimpan snapshot versi aktif sebelumnya (read-only).
   */
  startRevision: async (
    tahun: string | number,
    alasanRevisi: string,
    actorId: string,
    actorName: string
  ): Promise<ApiResponse<RkaDocument>> => {
    const docs = loadDocs();
    const idx = docs.findIndex((d) => Number(d.tahun_anggaran) === Number(tahun) || d.id === String(tahun));
    if (idx === -1) {
      return { success: false, message: 'Dokumen RKA tidak ditemukan', data: null as unknown as RkaDocument };
    }

    const doc = docs[idx];
    if (doc.status !== 'AKTIF') {
      return { success: false, message: 'Revisi hanya dapat dibuat dari dokumen RKA berstatus Aktif.', data: doc };
    }
    if (!alasanRevisi.trim()) {
      return { success: false, message: 'Alasan revisi wajib diisi.', data: doc };
    }

    const existingWorking = (doc.versions || []).find(
      (v) => v.status === 'DRAF' || v.status === 'PERLU_REVISI'
    );
    if (existingWorking) {
      const updatedDoc = { ...doc, versi_kerja_id: existingWorking.id };
      docs[idx] = updatedDoc;
      saveDocs(docs);
      return {
        success: true,
        message: `Melanjutkan draf revisi v${existingWorking.nomor_versi}.`,
        data: enrichRkaDocument(updatedDoc, loadAndReconcileRealizations(), loadTrips()),
      };
    }

    const now = new Date().toISOString();
    const versions = [...(doc.versions || [])].map((v) => {
      if ((v.id === doc.versi_aktif_id || v.status === 'DISETUJUI') && !v.snapshot) {
        return {
          ...v,
          snapshot: {
            judul: doc.judul,
            total_anggaran: computeDocumentTotalPagu(doc.activities),
            activities: cloneActivities(doc.activities),
          },
        };
      }
      return v;
    });

    const maxVer = versions.reduce((m, v) => Math.max(m, v.nomor_versi), 0);
    const nextNomor = maxVer + 1;
    const newVerId = `${doc.id}-v${nextNomor}`;
    const clonedActs = cloneActivities(doc.activities);
    const totalPagu = computeDocumentTotalPagu(clonedActs);

    const newVersion: RkaVersion = {
      id: newVerId,
      rka_id: doc.id,
      nomor_versi: nextNomor,
      status: 'DRAF',
      total_anggaran: totalPagu,
      draft_payload: { activities: clonedActs },
      alasan_revisi: alasanRevisi.trim(),
      row_version: 1,
      dibuat_oleh: actorId,
      created_at: now,
    };

    const updatedDoc: RkaDocument = {
      ...doc,
      versi_kerja_id: newVerId,
      versions: [...versions, newVersion],
      updated_at: now,
      audit_logs: appendAudit(doc, {
        aktor: actorName,
        peran: 'KAPRODI',
        aksi: 'BUAT_REVISI',
        versi: nextNomor,
        ringkasan: `Membuka draf revisi v${nextNomor}. Alasan: ${alasanRevisi.trim()}`,
      }),
    };

    docs[idx] = updatedDoc;
    saveDocs(docs);

    return {
      success: true,
      message: `Draf Revisi v${nextNomor} berhasil dibuat.`,
      data: enrichRkaDocument(updatedDoc, loadAndReconcileRealizations(), loadTrips()),
    };
  },

  /**
   * Batalkan draf revisi yang belum disahkan tanpa mengubah versi aktif.
   */
  cancelRevision: async (
    tahun: string | number,
    actorName: string
  ): Promise<ApiResponse<RkaDocument>> => {
    const docs = loadDocs();
    const idx = docs.findIndex((d) => Number(d.tahun_anggaran) === Number(tahun) || d.id === String(tahun));
    if (idx === -1) {
      return { success: false, message: 'Dokumen RKA tidak ditemukan', data: null as unknown as RkaDocument };
    }

    const doc = docs[idx];
    const working = (doc.versions || []).find((v) => v.id === doc.versi_kerja_id && v.status === 'DRAF');
    if (!working || doc.status !== 'AKTIF') {
      return { success: false, message: 'Tidak ada draf revisi aktif untuk dibatalkan.', data: doc };
    }

    const versions = (doc.versions || []).filter((v) => v.id !== working.id);
    const updatedDoc: RkaDocument = {
      ...doc,
      versi_kerja_id: undefined,
      versions,
      updated_at: new Date().toISOString(),
      audit_logs: appendAudit(doc, {
        aktor: actorName,
        peran: 'KAPRODI',
        aksi: 'BATALKAN_REVISI',
        versi: working.nomor_versi,
        ringkasan: `Membatalkan draf revisi v${working.nomor_versi}; versi aktif tetap dipertahankan.`,
      }),
    };

    docs[idx] = updatedDoc;
    saveDocs(docs);
    return {
      success: true,
      message: `Draf revisi v${working.nomor_versi} dibatalkan.`,
      data: enrichRkaDocument(updatedDoc, loadAndReconcileRealizations(), loadTrips()),
    };
  },

  /**
   * Sahkan / Setujui RKA (Draf awal maupun Revisi) oleh Kaprodi setelah validasi NF-01 & NF-07.
   */
  approveRka: async (
    tahun: string | number,
    actorId: string,
    actorName: string,
    catatan?: string
  ): Promise<ApiResponse<RkaDocument>> => {
    const docs = loadDocs();
    const idx = docs.findIndex((d) => Number(d.tahun_anggaran) === Number(tahun) || d.id === String(tahun));
    if (idx === -1) {
      return { success: false, message: 'Dokumen RKA tidak ditemukan', data: null as unknown as RkaDocument };
    }

    const doc = docs[idx];
    const versions = [...(doc.versions || [])];
    const workingIdx = versions.findIndex(
      (v) => v.id === doc.versi_kerja_id || v.status === 'DRAF' || v.status === 'DIAJUKAN'
    );

    const targetActivities: RkaActivity[] =
      workingIdx >= 0 && versions[workingIdx].draft_payload?.activities
        ? cloneActivities(versions[workingIdx].draft_payload!.activities as RkaActivity[])
        : cloneActivities(doc.activities);

    const validation = validateRkaForApproval(targetActivities);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(' '),
        data: enrichRkaDocument(doc, loadAndReconcileRealizations(), loadTrips()),
      };
    }

    const now = new Date().toISOString();
    const totalPagu = computeDocumentTotalPagu(targetActivities);

    // Arsipkan versi aktif sebelumnya sebagai snapshot read-only
    const updatedVersions = versions.map((v) => {
      if (v.status === 'DISETUJUI') {
        return {
          ...v,
          status: 'DIGANTIKAN' as const,
          snapshot: v.snapshot || {
            judul: doc.judul,
            total_anggaran: computeDocumentTotalPagu(doc.activities),
            activities: cloneActivities(doc.activities),
          },
        };
      }
      return v;
    });

    let ratifiedVersion: RkaVersion;
    if (workingIdx >= 0) {
      ratifiedVersion = {
        ...updatedVersions[workingIdx],
        status: 'DISETUJUI',
        total_anggaran: totalPagu,
        ditinjau_oleh: actorId,
        ditinjau_at: now,
        catatan_peninjauan: catatan || 'Disetujui & disahkan oleh Kaprodi.',
        diterapkan_at: now,
        snapshot: {
          judul: doc.judul,
          total_anggaran: totalPagu,
          activities: cloneActivities(targetActivities),
        },
      };
      updatedVersions[workingIdx] = ratifiedVersion;
    } else {
      const nextNomor = updatedVersions.reduce((m, v) => Math.max(m, v.nomor_versi), 0) + 1;
      ratifiedVersion = {
        id: `${doc.id}-v${nextNomor}`,
        rka_id: doc.id,
        nomor_versi: nextNomor,
        status: 'DISETUJUI',
        total_anggaran: totalPagu,
        row_version: 1,
        dibuat_oleh: actorId,
        ditinjau_oleh: actorId,
        ditinjau_at: now,
        catatan_peninjauan: catatan || 'Disetujui & disahkan oleh Kaprodi.',
        diterapkan_at: now,
        created_at: now,
        snapshot: {
          judul: doc.judul,
          total_anggaran: totalPagu,
          activities: cloneActivities(targetActivities),
        },
      };
      updatedVersions.push(ratifiedVersion);
    }

    const isFirstApproval = doc.status === 'DRAF';
    const updatedDoc: RkaDocument = {
      ...doc,
      status: 'AKTIF',
      versi_aktif_id: ratifiedVersion.id,
      versi_kerja_id: undefined,
      total_anggaran: totalPagu,
      activities: targetActivities,
      versions: updatedVersions,
      disetujui_oleh: actorId,
      disetujui_at: now,
      updated_at: now,
      audit_logs: appendAudit(doc, {
        aktor: actorName,
        peran: 'KAPRODI',
        aksi: isFirstApproval ? 'PENGESAHAN_RKA' : 'PENGESAHAN_REVISI',
        versi: ratifiedVersion.nomor_versi,
        ringkasan: isFirstApproval
          ? `Mengesahkan RKA TA ${doc.tahun_anggaran} (v${ratifiedVersion.nomor_versi}) — Total Pagu Rp ${totalPagu.toLocaleString('id-ID')}.`
          : `Mengesahkan Revisi v${ratifiedVersion.nomor_versi} — Total Pagu Rp ${totalPagu.toLocaleString('id-ID')}. Versi sebelumnya diarsipkan read-only.`,
      }),
    };

    docs[idx] = updatedDoc;
    saveDocs(docs);

    try {
      await apiRequest(API_ENDPOINTS.RKA.UPDATE(String(tahun)), {
        method: 'PUT',
        body: updatedDoc,
      });
    } catch {
      // Fallback persisted
    }

    return {
      success: true,
      message: `RKA v${ratifiedVersion.nomor_versi} berhasil disetujui dan diaktifkan.`,
      data: enrichRkaDocument(updatedDoc, loadAndReconcileRealizations(), loadTrips()),
    };
  },

  /**
   * Ambil daftar transaksi realisasi untuk dokumen RKA tahun tertentu (termasuk sinkronisasi Modul 9).
   */
  getRealizationsByYear: async (tahun: string | number): Promise<ApiResponse<RkaRealization[]>> => {
    const docs = loadDocs();
    const doc = docs.find((d) => Number(d.tahun_anggaran) === Number(tahun) || d.id === String(tahun));
    if (!doc) {
      return { success: false, message: 'Dokumen RKA tidak ditemukan', data: [] };
    }
    const trips = loadTrips();
    const realizations = loadAndReconcileRealizations();
    return {
      success: true,
      message: 'OK',
      data: getDocumentRealizations(doc, realizations, trips),
    };
  },

  /**
   * Catat realisasi anggaran manual + perbarui status pelaksanaan kegiatan + unggah bukti (FR-37, NF-08).
   */
  addRealization: async (
    arg1: string | number | Partial<RkaRealization>,
    arg2?: Partial<RkaRealization> & {
      activity_id?: string;
      status_pelaksanaan?: RkaActivityExecutionStatus;
      actorName?: string;
      actorRole?: string;
    }
  ): Promise<ApiResponse<RkaRealization>> => {
    let tahun = '2025';
    let data: Partial<RkaRealization> & {
      activity_id?: string;
      status_pelaksanaan?: RkaActivityExecutionStatus;
      actorName?: string;
      actorRole?: string;
    } = {};

    if (typeof arg1 === 'object') {
      data = arg1;
    } else {
      tahun = String(arg1);
      data = arg2 || {};
    }

    const now = new Date().toISOString();
    const newReal: RkaRealization = {
      id: data.id || `real-${Date.now()}`,
      rka_budget_item_id: data.rka_budget_item_id || 'pos-101',
      tanggal_realisasi: data.tanggal_realisasi || now.split('T')[0],
      nominal_realisasi: Number(data.nominal_realisasi) || 0,
      uraian: data.uraian || 'Pengeluaran anggaran',
      sumber_pencatatan: data.sumber_pencatatan || 'MANUAL',
      nama_berkas_bukti: data.nama_berkas_bukti,
      mime_type_bukti: data.mime_type_bukti,
      ukuran_berkas_bukti: data.ukuran_berkas_bukti,
      data_url_bukti: data.data_url_bukti,
      status_pelaksanaan_saat_catat: data.status_pelaksanaan,
      status: data.status || 'AKTIF',
      dicatat_oleh: data.dicatat_oleh || 'u-admin',
      created_at: now,
    };

    const existing = loadAndReconcileRealizations();
    storageSync.set(STORAGE_KEYS.RKA_REALIZATIONS, [newReal, ...existing]);

    // Update status pelaksanaan kegiatan & audit log pada dokumen RKA terkait
    const docs = loadDocs();
    const docIdx = docs.findIndex((d) =>
      (d.activities || []).some((a) =>
        a.id === data.activity_id || (a.budget_items || []).some((b) => b.id === newReal.rka_budget_item_id)
      )
    );
    if (docIdx >= 0) {
      const doc = docs[docIdx];
      let targetActName = '';
      const updatedActivities = (doc.activities || []).map((act) => {
        const matchesAct =
          act.id === data.activity_id ||
          (act.budget_items || []).some((b) => b.id === newReal.rka_budget_item_id);
        if (!matchesAct) return act;
        targetActName = act.nama_kegiatan;
        if (!data.status_pelaksanaan) return act;
        return {
          ...act,
          status_pelaksanaan: data.status_pelaksanaan,
          tanggal_realisasi_mulai:
            act.tanggal_realisasi_mulai ||
            (data.status_pelaksanaan !== 'BELUM_DILAKSANAKAN' ? newReal.tanggal_realisasi : undefined),
          tanggal_realisasi_selesai:
            data.status_pelaksanaan === 'TERLAKSANA' ? newReal.tanggal_realisasi : act.tanggal_realisasi_selesai,
        };
      });

      docs[docIdx] = {
        ...doc,
        activities: updatedActivities,
        updated_at: now,
        audit_logs: appendAudit(doc, {
          aktor: data.actorName || 'Admin Prodi',
          peran: data.actorRole || 'ADMIN_PRODI',
          aksi: 'CATAT_REALISASI',
          ringkasan: `Mencatat realisasi Rp ${newReal.nominal_realisasi.toLocaleString('id-ID')} pada "${targetActName || newReal.rka_budget_item_id}" (${newReal.uraian}).`,
        }),
      };
      saveDocs(docs);
    }

    try {
      await apiRequest<RkaRealization>(API_ENDPOINTS.RKA.REALIZATIONS(tahun), {
        method: 'POST',
        body: {
          budget_item_id: newReal.rka_budget_item_id,
          tanggal_realisasi: newReal.tanggal_realisasi,
          nominal: newReal.nominal_realisasi,
          uraian: newReal.uraian,
          sumber_pencatatan: newReal.sumber_pencatatan,
          bukti_transaksi_url: newReal.nama_berkas_bukti,
        },
      });
    } catch {
      // Fallback persisted locally
    }

    return { success: true, message: 'Realisasi anggaran disimpan', data: newReal };
  },

  /**
   * Hitung persentase dan analitika serapan pagu RKA otomatis.
   */
  getSerapan: async (tahun: string): Promise<ApiResponse<RkaSerapan>> => {
    try {
      const res = await apiRequest<RkaSerapan>(API_ENDPOINTS.RKA.SERAPAN(tahun));
      if (res.data) return res;
    } catch {
      // Fallback computed locally
    }
    const detail = await rkaService.getRkaByYear(tahun);
    const doc = detail.data;
    const totalPagu = doc?.total_anggaran || 0;
    const totalRealisasi = doc?.total_realisasi || 0;
    return {
      success: true,
      message: 'OK',
      data: {
        tahun_anggaran: tahun,
        total_pagu: totalPagu,
        total_realisasi: totalRealisasi,
        persentase_serapan: doc?.persentase_serapan || 0,
        sisa_anggaran: totalPagu - totalRealisasi,
      },
    };
  },
};

export default rkaService;
