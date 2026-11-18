import { mockProfiles } from '@/lib/mock-data';
import type {
  BusinessTrip,
  RkaActivity,
  RkaBudgetCategory,
  RkaBudgetItem,
  RkaDocument,
  RkaQuarter,
  RkaRealization,
  RkaVersion,
  RkaVersionSnapshot,
} from '@/lib/types';
import { calculateAbsorptionPercentage, formatRupiah, getStatusLabel } from '@/lib/utils';

export const RKA_QUARTERS: RkaQuarter[] = ['TW1', 'TW2', 'TW3', 'TW4'];

export const RKA_CATEGORY_OPTIONS: { value: RkaBudgetCategory; label: string }[] = [
  { value: 'BELANJA_BARANG', label: 'Belanja Barang' },
  { value: 'PERJALANAN_DINAS', label: 'Perjalanan Dinas' },
  { value: 'BELANJA_JASA', label: 'Belanja Jasa' },
  { value: 'HONOR', label: 'Honorarium / Jasa' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export const RKA_SOURCE_OPTIONS = [
  { value: 'DANA_RUTIN_PRODI', label: 'Dana Rutin Prodi' },
  { value: 'RKAT', label: 'RKAT' },
  { value: 'HIBAH', label: 'Hibah' },
  { value: 'DANA_UNIVERSITAS', label: 'Dana Universitas' },
  { value: 'DANA_FAKULTAS', label: 'Dana Fakultas' },
  { value: 'PNBP', label: 'PNBP' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const;

export const ALLOWED_PROOF_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'] as const;
export const MAX_PROOF_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Hitung nominal pos anggaran dari volume * harga_satuan atau nominal langsung.
 */
export function computeBudgetItemNominal(item: Partial<RkaBudgetItem>): number {
  if (typeof item.nominal_anggaran === 'number' && !Number.isNaN(item.nominal_anggaran)) {
    return item.nominal_anggaran;
  }
  const vol = Number(item.volume) || 0;
  const price = Number(item.harga_satuan) || 0;
  return vol * price;
}

/**
 * Hitung total pagu dari seluruh pos anggaran aktif di dalam sebuah butir kegiatan.
 */
export function computeActivityTotal(activity: Partial<RkaActivity>): number {
  return (activity.budget_items || [])
    .filter((b) => b.is_active !== false)
    .reduce((sum, b) => sum + computeBudgetItemNominal(b), 0);
}

/**
 * Hitung total pagu dokumen RKA secara otomatis dari seluruh butir kegiatan (NF-07).
 */
export function computeDocumentTotalPagu(activities: Partial<RkaActivity>[] = []): number {
  return activities
    .filter((a) => a.is_active !== false)
    .reduce((sum, a) => sum + computeActivityTotal(a), 0);
}

/**
 * Resolusi nama Penanggung Jawab (PIC) kegiatan dari ID profil atau nama kustom.
 */
export function resolveActivityPicName(activity: Partial<RkaActivity>): string {
  if (activity.penanggung_jawab?.nama_lengkap) return activity.penanggung_jawab.nama_lengkap;
  if (activity.penanggung_jawab_nama?.trim()) return activity.penanggung_jawab_nama.trim();
  const profile = mockProfiles.find((p) => p.id === activity.penanggung_jawab_id);
  return profile?.nama_lengkap || activity.penanggung_jawab_id || '-';
}

/**
 * Konversi tanggal/jadwal kegiatan menjadi daftar triwulan (TW1–TW4).
 */
export function getActivityQuarters(activity: Partial<RkaActivity>): RkaQuarter[] {
  if (activity.jadwal_triwulan && activity.jadwal_triwulan.length > 0) {
    const unique = Array.from(new Set(activity.jadwal_triwulan));
    return unique.sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
  }

  const start = activity.jadwal_mulai ? new Date(activity.jadwal_mulai) : null;
  const end = activity.jadwal_selesai ? new Date(activity.jadwal_selesai) : null;
  if (!start || Number.isNaN(start.getTime())) return ['TW1'];

  const startQ = Math.floor(start.getMonth() / 3) + 1;
  const endQ = end && !Number.isNaN(end.getTime()) ? Math.floor(end.getMonth() / 3) + 1 : startQ;
  const minQ = Math.max(1, Math.min(startQ, endQ));
  const maxQ = Math.min(4, Math.max(startQ, endQ));
  const result: RkaQuarter[] = [];
  for (let q = minQ; q <= maxQ; q++) {
    result.push(`TW${q}` as RkaQuarter);
  }
  return result;
}

/**
 * Format label jadwal triwulan kegiatan (mis. "TW1 - TW2" atau "TW1").
 */
export function formatActivityQuarters(activity: Partial<RkaActivity>): string {
  const quarters = getActivityQuarters(activity);
  if (quarters.length === 0) return '-';
  if (quarters.length === 1) return quarters[0];
  const nums = quarters.map((q) => Number(q.slice(2)));
  const isContiguous = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  return isContiguous ? `${quarters[0]} - ${quarters[quarters.length - 1]}` : quarters.join(', ');
}

/**
 * Konversi rentang triwulan ke tanggal awal & akhir standar untuk tahun anggaran tertentu.
 */
export function quartersToDateRange(tahun: number, quarters: RkaQuarter[]): { start: string; end: string } {
  const sorted = [...quarters].sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
  const firstQ = sorted[0] ? Number(sorted[0].slice(2)) : 1;
  const lastQ = sorted[sorted.length - 1] ? Number(sorted[sorted.length - 1].slice(2)) : firstQ;

  const startMonth = String((firstQ - 1) * 3 + 1).padStart(2, '0');
  const endMonthNum = lastQ * 3;
  const endMonth = String(endMonthNum).padStart(2, '0');
  const lastDay = new Date(tahun, endMonthNum, 0).getDate();

  return {
    start: `${tahun}-${startMonth}-01`,
    end: `${tahun}-${endMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

/**
 * Ambil informasi tahun & triwulan berjalan berdasarkan tanggal sistem.
 */
export function getCurrentQuarterInfo(date: Date = new Date()): {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  quarterLabel: RkaQuarter;
} {
  const q = (Math.floor(date.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  return {
    year: date.getFullYear(),
    quarter: q,
    quarterLabel: `TW${q}` as RkaQuarter,
  };
}

/**
 * Ambil triwulan (TW1–TW4) dari tanggal realisasi.
 */
export function getQuarterFromDate(dateStr?: string): RkaQuarter {
  if (!dateStr) return 'TW1';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'TW1';
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `TW${Math.min(4, Math.max(1, q))}` as RkaQuarter;
}

/**
 * Validasi dokumen RKA sebelum disahkan oleh Kaprodi (FR-36, NF-01, NF-07).
 */
export function validateRkaForApproval(
  activities: Partial<RkaActivity>[] = []
): { valid: boolean; errors: string[] } {
  const active = activities.filter((a) => a.is_active !== false);
  const errors: string[] = [];

  if (active.length === 0) {
    errors.push('Minimal harus ada 1 butir kegiatan sebelum RKA disahkan.');
    return { valid: false, errors };
  }

  let hasPositiveBudget = false;

  active.forEach((act, idx) => {
    const label = act.kode_kegiatan || act.nama_kegiatan || `Kegiatan #${idx + 1}`;
    if (!act.nama_kegiatan?.trim()) {
      errors.push(`${label}: Nama kegiatan wajib diisi.`);
    }
    if (!act.indikator_kinerja?.trim()) {
      errors.push(`${label}: Indikator kinerja wajib diisi.`);
    }
    if (!act.penanggung_jawab_id?.trim() && !act.penanggung_jawab_nama?.trim()) {
      errors.push(`${label}: Penanggung jawab (PIC) wajib dipilih.`);
    }

    const items = (act.budget_items || []).filter((b) => b.is_active !== false);
    if (items.length === 0) {
      errors.push(`${label}: Wajib memiliki minimal 1 pos anggaran sebelum disahkan.`);
    } else {
      items.forEach((item, bIdx) => {
        const itemLabel = item.nama_pos || item.kode_pos || `Pos #${bIdx + 1}`;
        const rawNominal = item.nominal_anggaran;
        if (rawNominal === undefined || rawNominal === null || Number.isNaN(Number(rawNominal))) {
          errors.push(`${label} (${itemLabel}): Nominal pos anggaran wajib diisi.`);
        } else if (Number(rawNominal) < 0) {
          errors.push(`${label} (${itemLabel}): Nominal pos anggaran tidak boleh negatif (< 0).`);
        } else if (Number(rawNominal) > 0) {
          hasPositiveBudget = true;
        }
      });
    }
  });

  if (errors.length === 0 && !hasPositiveBudget) {
    errors.push('Total pagu RKA tidak boleh Rp 0. Minimal satu pos anggaran harus bernilai > 0.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Rekonsiliasi otomatis realisasi Perjalanan Dinas (Modul 9, status SELESAI & sumber RKA_PRODI)
 * agar langsung tercatat di daftar realisasi RKA tanpa input ganda (FR-34, FR-37).
 */
export function reconcileTripsWithRealizations(
  trips: BusinessTrip[],
  realizations: RkaRealization[]
): RkaRealization[] {
  const existingTripIds = new Set(
    realizations
      .filter((r) => r.status !== 'DIBATALKAN' && r.business_trip_id)
      .map((r) => r.business_trip_id as string)
  );

  const autoLinked: RkaRealization[] = [];

  for (const trip of trips) {
    if (
      trip.sumber_dana === 'RKA_PRODI' &&
      trip.status === 'SELESAI' &&
      trip.rka_budget_item_id &&
      !existingTripIds.has(trip.id)
    ) {
      const totalRealisasi = (trip.costs || []).reduce(
        (sum, c) => sum + (c.realisasi_biaya ?? c.estimasi_biaya ?? 0),
        0
      );
      const proofFiles = (trip.costs || [])
        .map((c) => c.nama_berkas_bukti?.trim())
        .filter((f): f is string => Boolean(f));

      autoLinked.push({
        id: `real-trip-${trip.id}`,
        rka_budget_item_id: trip.rka_budget_item_id,
        tanggal_realisasi:
          trip.dikonfirmasi_at?.split('T')[0] ||
          trip.laporan_dikirim_at?.split('T')[0] ||
          trip.tanggal_kembali ||
          new Date().toISOString().split('T')[0],
        nominal_realisasi: totalRealisasi,
        uraian: `Realisasi Perjalanan Dinas ${trip.nomor_surat_tugas ? `(${trip.nomor_surat_tugas}) ` : ''}ke ${trip.tujuan}: ${trip.maksud_kegiatan}`,
        sumber_pencatatan: 'PERJALANAN_DINAS',
        business_trip_id: trip.id,
        nama_berkas_bukti: proofFiles.length > 0 ? proofFiles.join(', ') : `LPJ_${trip.id}.pdf`,
        status: 'AKTIF',
        dicatat_oleh: trip.dikonfirmasi_oleh || 'u-admin',
        created_at: trip.dikonfirmasi_at || trip.updated_at || new Date().toISOString(),
      });
    }
  }

  return [...autoLinked, ...realizations];
}

/**
 * Perkaya dokumen RKA dengan kalkulasi otomatis Total Pagu (NF-07) & Realisasi Berjalan (FR-37).
 */
export function enrichRkaDocument(
  doc: RkaDocument,
  allRealizations: RkaRealization[],
  trips: BusinessTrip[] = []
): RkaDocument {
  const reconciled = reconcileTripsWithRealizations(trips, allRealizations);
  const activeRealizations = reconciled.filter((r) => r.status !== 'DIBATALKAN');

  const realizationByItem = new Map<string, number>();
  for (const r of activeRealizations) {
    realizationByItem.set(
      r.rka_budget_item_id,
      (realizationByItem.get(r.rka_budget_item_id) || 0) + (Number(r.nominal_realisasi) || 0)
    );
  }

  const enrichedActivities: RkaActivity[] = (doc.activities || []).map((act) => {
    const items: RkaBudgetItem[] = (act.budget_items || []).map((item) => {
      const nominal = computeBudgetItemNominal(item);
      const realisasi = realizationByItem.get(item.id) || 0;
      return {
        ...item,
        nominal_anggaran: nominal,
        realisasi_total: realisasi,
        sisa_anggaran: nominal - realisasi,
      };
    });

    const actTotal = computeActivityTotal({ ...act, budget_items: items });
    const actRealisasi = items.reduce((s, b) => s + (b.realisasi_total || 0), 0);

    return {
      ...act,
      jadwal_triwulan: getActivityQuarters(act),
      budget_items: items,
      total_anggaran: actTotal,
      total_realisasi: actRealisasi,
    };
  });

  const totalAnggaran = computeDocumentTotalPagu(enrichedActivities);
  const totalRealisasi = enrichedActivities
    .filter((a) => a.is_active !== false)
    .reduce((s, a) => s + (a.total_realisasi || 0), 0);

  return {
    ...doc,
    activities: enrichedActivities,
    total_anggaran: totalAnggaran,
    total_realisasi: totalRealisasi,
    persentase_serapan: calculateAbsorptionPercentage(totalRealisasi, totalAnggaran),
  };
}

/**
 * Ambil seluruh transaksi realisasi yang terkait dengan dokumen RKA tertentu.
 */
export function getDocumentRealizations(
  doc: RkaDocument,
  allRealizations: RkaRealization[],
  trips: BusinessTrip[] = []
): RkaRealization[] {
  const reconciled = reconcileTripsWithRealizations(trips, allRealizations);
  const itemMap = new Map<string, { item: RkaBudgetItem; activity: RkaActivity }>();

  for (const act of doc.activities || []) {
    for (const item of act.budget_items || []) {
      itemMap.set(item.id, { item, activity: act });
    }
  }

  return reconciled
    .filter((r) => r.status !== 'DIBATALKAN' && itemMap.has(r.rka_budget_item_id))
    .map((r) => {
      const ref = itemMap.get(r.rka_budget_item_id)!;
      return {
        ...r,
        budget_item: ref.item,
      };
    })
    .sort((a, b) => b.tanggal_realisasi.localeCompare(a.tanggal_realisasi));
}

export interface ActivityMonitoringStatus {
  isOverBudget: boolean;
  isUnexecutedOverdue: boolean;
  isInProgressOverdue: boolean;
  percentage: number;
  statusLabel: string;
  scheduleBadgeText: string | null;
  scheduleBadgeTone: 'rose' | 'amber' | 'emerald' | 'slate';
}

/**
 * Evaluasi status pelaksanaan & penanda jadwal FR-38 berdasarkan triwulan berjalan.
 */
export function evaluateActivityMonitoring(
  activity: RkaActivity,
  rkaYear: number,
  referenceYear: number,
  referenceQuarter: 1 | 2 | 3 | 4
): ActivityMonitoringStatus {
  const pagu = computeActivityTotal(activity);
  const realisasi = activity.total_realisasi ?? (activity.budget_items || []).reduce((s, b) => s + (b.realisasi_total || 0), 0);
  const percentage = calculateAbsorptionPercentage(realisasi, pagu);
  const isOverBudget = pagu > 0 ? realisasi > pagu : realisasi > 0;

  const quarters = getActivityQuarters(activity).map((q) => Number(q.slice(2)));
  const firstQuarter = quarters.length > 0 ? Math.min(...quarters) : 1;
  const lastQuarter = quarters.length > 0 ? Math.max(...quarters) : 4;

  const isPastStartQuarter =
    rkaYear < referenceYear || (rkaYear === referenceYear && firstQuarter < referenceQuarter);
  const isPastEndQuarter =
    rkaYear < referenceYear || (rkaYear === referenceYear && lastQuarter < referenceQuarter);

  const execStatus = activity.status_pelaksanaan;
  const isUnexecutedOverdue = execStatus === 'BELUM_DILAKSANAKAN' && isPastStartQuarter;
  const isInProgressOverdue = execStatus === 'BERJALAN' && isPastEndQuarter;

  let scheduleBadgeText: string | null = null;
  let scheduleBadgeTone: 'rose' | 'amber' | 'emerald' | 'slate' = 'emerald';

  if (isUnexecutedOverdue) {
    scheduleBadgeText = 'Belum Terlaksana (Melewati Jadwal)';
    scheduleBadgeTone = 'rose';
  } else if (isInProgressOverdue) {
    scheduleBadgeText = 'Berjalan (Melewati Jadwal)';
    scheduleBadgeTone = 'amber';
  } else if (execStatus === 'TERLAKSANA') {
    scheduleBadgeText = 'Selesai';
    scheduleBadgeTone = 'emerald';
  } else if (execStatus === 'BERJALAN') {
    scheduleBadgeText = 'Sesuai Jadwal';
    scheduleBadgeTone = 'emerald';
  } else {
    scheduleBadgeText = 'Terjadwal';
    scheduleBadgeTone = 'slate';
  }

  return {
    isOverBudget,
    isUnexecutedOverdue,
    isInProgressOverdue,
    percentage,
    statusLabel: getStatusLabel(execStatus),
    scheduleBadgeText,
    scheduleBadgeTone,
  };
}

export interface VersionDiffEntry {
  tipe: 'TAMBAH' | 'UBAH' | 'HAPUS';
  kode: string;
  nama: string;
  kegiatanNama: string;
  sebelum: number;
  sesudah: number;
  selisih: number;
}

/**
 * Hitung perbandingan perubahan pos anggaran antara dua snapshot versi RKA (NF-09).
 */
export function computeRkaVersionDiff(
  baseSnapshot?: RkaVersionSnapshot,
  targetSnapshot?: RkaVersionSnapshot
): { entries: VersionDiffEntry[]; totalSebelum: number; totalSesudah: number; deltaTotal: number } {
  const flattenItems = (snap?: RkaVersionSnapshot) => {
    const map = new Map<string, { item: RkaBudgetItem; actName: string }>();
    for (const act of snap?.activities || []) {
      for (const item of act.budget_items || []) {
        const key = `${act.kode_kegiatan}::${item.kode_pos || item.id}`;
        map.set(key, { item, actName: `${act.kode_kegiatan} — ${act.nama_kegiatan}` });
      }
    }
    return map;
  };

  const baseMap = flattenItems(baseSnapshot);
  const targetMap = flattenItems(targetSnapshot);
  const entries: VersionDiffEntry[] = [];

  for (const [key, targetVal] of targetMap.entries()) {
    const baseVal = baseMap.get(key);
    const nominalSesudah = computeBudgetItemNominal(targetVal.item);
    if (!baseVal) {
      entries.push({
        tipe: 'TAMBAH',
        kode: targetVal.item.kode_pos,
        nama: targetVal.item.nama_pos,
        kegiatanNama: targetVal.actName,
        sebelum: 0,
        sesudah: nominalSesudah,
        selisih: nominalSesudah,
      });
    } else {
      const nominalSebelum = computeBudgetItemNominal(baseVal.item);
      if (nominalSebelum !== nominalSesudah || baseVal.item.nama_pos !== targetVal.item.nama_pos) {
        entries.push({
          tipe: 'UBAH',
          kode: targetVal.item.kode_pos,
          nama: targetVal.item.nama_pos,
          kegiatanNama: targetVal.actName,
          sebelum: nominalSebelum,
          sesudah: nominalSesudah,
          selisih: nominalSesudah - nominalSebelum,
        });
      }
      baseMap.delete(key);
    }
  }

  for (const [, baseVal] of baseMap.entries()) {
    const nominalSebelum = computeBudgetItemNominal(baseVal.item);
    entries.push({
      tipe: 'HAPUS',
      kode: baseVal.item.kode_pos,
      nama: baseVal.item.nama_pos,
      kegiatanNama: baseVal.actName,
      sebelum: nominalSebelum,
      sesudah: 0,
      selisih: -nominalSebelum,
    });
  }

  const totalSebelum = baseSnapshot?.total_anggaran ?? computeDocumentTotalPagu(baseSnapshot?.activities);
  const totalSesudah = targetSnapshot?.total_anggaran ?? computeDocumentTotalPagu(targetSnapshot?.activities);

  return {
    entries,
    totalSebelum,
    totalSesudah,
    deltaTotal: totalSesudah - totalSebelum,
  };
}

/**
 * Ambil snapshot kegiatan dari objek RkaVersion (baik dari snapshot resmi maupun draft_payload).
 */
export function getVersionSnapshot(doc: RkaDocument, version?: RkaVersion): RkaVersionSnapshot {
  if (!version) {
    return {
      judul: doc.judul,
      total_anggaran: computeDocumentTotalPagu(doc.activities),
      activities: doc.activities || [],
    };
  }
  if (version.snapshot) return version.snapshot;
  if (version.draft_payload?.activities) {
    const acts = version.draft_payload.activities as RkaActivity[];
    return {
      judul: doc.judul,
      total_anggaran: computeDocumentTotalPagu(acts),
      activities: acts,
    };
  }
  return {
    judul: doc.judul,
    total_anggaran: doc.total_anggaran,
    activities: doc.activities || [],
  };
}

/**
 * Ekspor laporan monitoring serapan 3 dimensi ke file Excel (.xls SpreadsheetML/HTML) sesuai NF-13.
 */
export function downloadSerapanExcel(params: {
  tahun: string;
  judul: string;
  activities: RkaActivity[];
  byCategory: Array<{ kategori: string; label: string; pagu: number; realisasi: number; sisa: number; pct: number }>;
  byQuarter: Array<{ tw: string; jumlahKegiatan: number; pagu: number; realisasi: number; pct: number }>;
}) {
  if (typeof window === 'undefined') return;
  const esc = (s: string | number) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const activityRows = params.activities
    .map((a) => {
      const pagu = computeActivityTotal(a);
      const real = a.total_realisasi || 0;
      const pct = calculateAbsorptionPercentage(real, pagu);
      return `<tr>
        <td>${esc(a.kode_kegiatan)}</td>
        <td>${esc(a.nama_kegiatan)}</td>
        <td>${esc(formatActivityQuarters(a))}</td>
        <td>${esc(resolveActivityPicName(a))}</td>
        <td>${esc(getStatusLabel(a.status_pelaksanaan))}</td>
        <td>${pagu}</td>
        <td>${real}</td>
        <td>${pagu - real}</td>
        <td>${pct}%</td>
      </tr>`;
    })
    .join('');

  const categoryRows = params.byCategory
    .map(
      (c) => `<tr>
        <td>${esc(c.label)}</td>
        <td>${c.pagu}</td>
        <td>${c.realisasi}</td>
        <td>${c.sisa}</td>
        <td>${c.pct}%</td>
      </tr>`
    )
    .join('');

  const quarterRows = params.byQuarter
    .map(
      (q) => `<tr>
        <td>${esc(q.tw)}</td>
        <td>${q.jumlahKegiatan}</td>
        <td>${q.pagu}</td>
        <td>${q.realisasi}</td>
        <td>${q.pct}%</td>
      </tr>`
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="utf-8" /></head>
    <body>
      <h2>Laporan Monitoring Serapan RKA ${esc(params.tahun)}</h2>
      <p>${esc(params.judul)} | Diekspor: ${esc(new Date().toLocaleString('id-ID'))}</p>
      <h3>1. Serapan Per Kegiatan</h3>
      <table border="1">
        <tr><th>Kode</th><th>Nama Kegiatan</th><th>Jadwal</th><th>PIC</th><th>Status</th><th>Pagu (Rp)</th><th>Realisasi (Rp)</th><th>Sisa (Rp)</th><th>Serapan</th></tr>
        ${activityRows}
      </table>
      <br/>
      <h3>2. Serapan Per Pos Anggaran</h3>
      <table border="1">
        <tr><th>Kategori Pos</th><th>Alokasi Pagu (Rp)</th><th>Realisasi (Rp)</th><th>Sisa (Rp)</th><th>Serapan</th></tr>
        ${categoryRows}
      </table>
      <br/>
      <h3>3. Serapan Per Triwulan</h3>
      <table border="1">
        <tr><th>Triwulan</th><th>Kegiatan Terjadwal</th><th>Pagu Terjadwal (Rp)</th><th>Realisasi Tercatat (Rp)</th><th>Serapan</th></tr>
        ${quarterRows}
      </table>
    </body>
    </html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `monitoring-serapan-rka-${params.tahun}-${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format ukuran file menjadi KB / MB untuk tampilan unggahan NF-08.
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validasi file bukti pengeluaran sesuai NF-08 (PDF, JPG, PNG, DOCX, XLSX).
 */
export function validateProofFile(file: File): { valid: boolean; error?: string } {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_PROOF_EXTENSIONS.includes(ext as (typeof ALLOWED_PROOF_EXTENSIONS)[number])) {
    return {
      valid: false,
      error: `Format berkas ".${ext}" tidak didukung. Gunakan PDF, JPG, PNG, DOCX, atau XLSX (NF-08).`,
    };
  }
  if (file.size > MAX_PROOF_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran berkas melebihi batas maksimum 10 MB.',
    };
  }
  return { valid: true };
}

export function formatSummaryCurrency(n: number): string {
  return formatRupiah(n);
}
