// ============================================================
// SIMPRO — Utility helpers (sesuai DESIGN.md Light Theme & PRD)
// ============================================================

import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format currency to IDR
export function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Format date to Indonesian locale (contoh: 15 November 2025)
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Format date short (contoh: 15 Nov 2025)
export function formatDateShort(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

// Format datetime (contoh: 15 Nov 2025, 14:30)
export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Generate random ticket code: ADU-XXXX-XXXX-XXXX
export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `ADU-${segment(4)}-${segment(4)}-${segment(4)}`;
}

// Hitung persentase serapan anggaran
export function calculateAbsorptionPercentage(realization: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(100, Math.round((realization / budget) * 100));
}

// Status colors map sesuai standar DESIGN.md (Light Mode Blue & White)
export function getStatusColor(status: string): string {
  const s = status.toUpperCase();

  // Emerald / Success
  if ([
    'DISETUJUI', 'TERBIT', 'SELESAI', 'AKTIF', 'LULUS', 'DISAHKAN', 
    'SESUAI', 'TERCAPAI', 'TERVERIFIKASI', 'TERLAKSANA', 'DIISI',
    'LAYAK_DIAJUKAN', 'DITERAPKAN', 'RINGAN'
  ].includes(s)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  // Amber / Warning / In Progress
  if ([
    'DIAJUKAN', 'MENUNGGU', 'DALAM_REVIEW', 'BERJALAN', 'DILAPORKAN',
    'DIREVIEW', 'SEBAGIAN', 'PERLU_PERBAIKAN', 'PERLU_REVISI', 'TERKIRIM',
    'DITUGASKAN', 'DITERUSKAN', 'DIVERIFIKASI', 'DITINDAKLANJUTI', 'DITINJAU', 'SEDANG', 'DALAM_PROSES', 'SEGERA_KEDALUWARSA'
  ].includes(s)) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  // Rose / Red / Danger
  if ([
    'DITOLAK', 'TIDAK_SESUAI', 'TIDAK_LULUS', 'RUSAK', 'TIDAK_TERCAPAI',
    'KEDALUWARSA', 'DIESKALASI', 'TIDAK_DITERAPKAN', 'VOID', 'OVER_REALISASI', 'BERAT', 'DICABUT'
  ].includes(s)) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  // Blue / Info
  if ([
    'REVIEW_INTERNAL', 'DITERIMA', 'PROPOSAL_DIAJUKAN', 'BIMBINGAN',
    'SIAP_SIDANG', 'DIJADWALKAN', 'DOK_AKTIF', 'DISETUJUI_PEMBINA', 'PROPOSAL_DISETUJUI', 'LPJ_DIAJUKAN'
  ].includes(s)) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }

  // Purple / Violet / Closed / Archival
  if ([
    'DITUTUP', 'DIGANTIKAN', 'ARSIP', 'DIBATALKAN'
  ].includes(s)) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }

  // Slate / Neutral (Draft, Baru, Belum)
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

// Readable status labels dalam Bahasa Indonesia
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    // General
    DRAF: 'Draf',
    DIAJUKAN: 'Diajukan',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
    PERLU_REVISI: 'Perlu Revisi',
    SELESAI: 'Selesai',
    DIBATALKAN: 'Dibatalkan',
    AKTIF: 'Aktif',
    NONAKTIF: 'Nonaktif',
    ARSIP: 'Arsip',

    // Modul 7 - Kepuasan Mitra
    DIBUAT: 'Dibuat',
    TERKIRIM: 'Terkirim',
    DIISI: 'Sudah Diisi',
    KEDALUWARSA: 'Kedaluwarsa',
    TAUTAN_MITRA: 'Tautan Mitra',
    INPUT_KOORDINATOR: 'Input Koordinator',
    VOID: 'Dibatalkan (Void)',

    // Modul 8 - Publikasi
    REVIEW_INTERNAL: 'Review Internal',
    DALAM_REVIEW: 'Dalam Review',
    REVISI: 'Revisi',
    DITERIMA: 'Diterima (Accepted)',
    TERBIT: 'Terbit (Published)',
    TIDAK_PERLU: 'Tidak Perlu Verifikasi',
    MENUNGGU: 'Menunggu Verifikasi',
    TERVERIFIKASI: 'Terverifikasi',
    LAYAK_DIAJUKAN: 'Layak Diajukan',
    PERLU_PERBAIKAN: 'Perlu Perbaikan',

    // Modul 9 - Perjalanan Dinas
    DILAPORKAN: 'Dilaporkan',
    RKA_PRODI: 'RKA Prodi',
    FAKULTAS: 'Fakultas',
    HIBAH: 'Hibah',
    MANDIRI: 'Mandiri',
    TRANSPORTASI: 'Transportasi',
    AKOMODASI: 'Akomodasi',
    UANG_HARIAN: 'Uang Harian',
    LAINNYA: 'Lain-lain',

    // Modul 10 - RKA
    DITUTUP: 'Ditutup',
    DIGANTIKAN: 'Digantikan',
    BELUM_DILAKSANAKAN: 'Belum Dilaksanakan',
    BERJALAN: 'Sedang Berjalan',
    TERLAKSANA: 'Terlaksana',
    BELANJA_BARANG: 'Belanja Barang',
    BELANJA_JASA: 'Belanja Jasa',
    HONOR: 'Honorarium',
    PERJALANAN_DINAS: 'Perjalanan Dinas',

    // Modul 11 - Review RPS
    DIREVIEW: 'Sedang Direview',
    DISAHKAN: 'Disahkan',
    DITUGASKAN: 'Ditugaskan',
    SESUAI: 'Sesuai',
    TIDAK_SESUAI: 'Tidak Sesuai',
    KESELARASAN_CPL_CPMK: 'Keselarasan CPL-CPMK-Sub CPMK',
    BAHAN_KAJIAN: 'Bahan Kajian',
    METODE_PEMBELAJARAN: 'Metode Pembelajaran',
    BENTUK_BOBOT_PENILAIAN: 'Bentuk & Bobot Penilaian',
    REFERENSI: 'Referensi Pustaka',

    // Modul 12 - Evaluasi Perkuliahan
    DITINJAU: 'Telah Ditinjau',
    SEBAGIAN: 'Sebagian Sesuai',
    BARU: 'Baru',
    DITERUSKAN: 'Diteruskan ke RPS',
    DITERAPKAN: 'Diterapkan',
    TIDAK_DITERAPKAN: 'Tidak Diterapkan',

    // Modul 13 - Aduan
    DIVERIFIKASI: 'Diverifikasi',
    DITINDAKLANJUTI: 'Ditindaklanjuti',
    DIESKALASI: 'Dieskalasi',
    PELAPOR: 'Pelapor Anonim',
    PETUGAS: 'Petugas Prodi',
    AKADEMIK: 'Akademik',
    LAYANAN_ADMINISTRASI: 'Layanan Administrasi',
    FASILITAS: 'Fasilitas & Sarana',
    DOSEN_TENDIK: 'Dosen / Tenaga Kependidikan',
    PERUNDUNGAN_KEKERASAN: 'Perundungan / Kekerasan Seksual',
    // Modul 1-6
    BELUM: 'Belum Mengisi',
    RINGAN: 'Ringan',
    SEDANG: 'Sedang',
    BERAT: 'Berat',
    DICABUT: 'Dicabut',
    BELUM_DIMULAI: 'Belum Dimulai',
    DALAM_PROSES: 'Dalam Proses',
    DISETUJUI_PEMBINA: 'Disetujui Pembina',
    TERDAFTAR: 'Terdaftar',
    PROPOSAL_DISETUJUI: 'Proposal Disetujui',
    LPJ_DIAJUKAN: 'LPJ Diajukan',
    SEGERA_KEDALUWARSA: 'Segera Kedaluwarsa',
    BAHASA: 'Bahasa Asing',
    PROFESI_KOMPETENSI: 'Profesi / Kompetensi',
    AWAL_SEMESTER: 'Awal Semester',
    TENGAH_SEMESTER: 'Tengah Semester',
    AKHIR_SEMESTER: 'Akhir Semester',
    ASISTENSI_LAB: 'Asistensi Laboratorium',
    ADMINISTRASI_PRODI: 'Administrasi Prodi',
    KEPANITIAAN_ACARA: 'Kepanitiaan Acara',
    BANTUAN_RISET: 'Bantuan Riset Dosen',
    OLAHRAGA: 'Olahraga',
    SENI: 'Seni & Budaya',
    KEAGAMAAN: 'Keagamaan',
    PENALARAN: 'Penalaran & Riset',
    SOSIAL: 'Sosial & Lingkungan',
    KHUSUS: 'Khusus',
  };

  return map[status] || status;
}

/**
 * Salin teks ke papan klip secara aman dengan fallback untuk konteks non-HTTPS (mis. IP lokal)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || !text) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Abaikan error permission/insecure context dan lanjutkan ke fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Boolean(successful);
  } catch {
    return false;
  }
}
