// ============================================================
// SIMPRO — Utility helpers
// ============================================================

import { type ClassValue, clsx } from 'clsx';

// Simple class merger (no twMerge needed since we use Tailwind)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format currency to IDR
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date to Indonesian locale
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Format date short
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

// Format datetime
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Status colors map
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    // Achievement / Funding
    DIAJUKAN: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    DISETUJUI: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    DITOLAK: 'bg-red-500/15 text-red-400 border-red-500/30',
    CAIR: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    // Registration
    BERJALAN: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    SELESAI: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    // TA
    PROPOSAL_DIAJUKAN: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    PROPOSAL_DITOLAK: 'bg-red-500/15 text-red-400 border-red-500/30',
    BIMBINGAN: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    SIAP_SIDANG: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    LULUS: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    // Inspection
    BELUM_DIPERIKSA: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    LENGKAP: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    TIDAK_LENGKAP: 'bg-red-500/15 text-red-400 border-red-500/30',
    PERLU_REVISI: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    // Survey
    DRAFT: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    DIBUKA: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    DITUTUP: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    // Tracer
    BELUM_DIISI: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    SUDAH_DIISI: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    // Asset
    BAIK: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    RUSAK: 'bg-red-500/15 text-red-400 border-red-500/30',
    DALAM_PERBAIKAN: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    DIHAPUSKAN: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    // Partner
    AKTIF: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    NONAKTIF: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    // Verification
    MENUNGGU: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    DIVERIFIKASI: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    // Defense
    DIJADWALKAN: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    LULUS_REVISI: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    TIDAK_LULUS: 'bg-red-500/15 text-red-400 border-red-500/30',
    DIBATALKAN: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    // Student
    CUTI: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    KELUAR: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
}

// Readable status labels
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DIAJUKAN: 'Diajukan',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
    CAIR: 'Cair',
    BERJALAN: 'Berjalan',
    SELESAI: 'Selesai',
    PROPOSAL_DIAJUKAN: 'Proposal Diajukan',
    PROPOSAL_DITOLAK: 'Proposal Ditolak',
    BIMBINGAN: 'Bimbingan',
    SIAP_SIDANG: 'Siap Sidang',
    LULUS: 'Lulus',
    BELUM_DIPERIKSA: 'Belum Diperiksa',
    LENGKAP: 'Lengkap',
    TIDAK_LENGKAP: 'Tidak Lengkap',
    PERLU_REVISI: 'Perlu Revisi',
    DRAFT: 'Draft',
    DIBUKA: 'Dibuka',
    DITUTUP: 'Ditutup',
    BELUM_DIISI: 'Belum Diisi',
    SUDAH_DIISI: 'Sudah Diisi',
    BAIK: 'Baik',
    RUSAK: 'Rusak',
    DALAM_PERBAIKAN: 'Dalam Perbaikan',
    DIHAPUSKAN: 'Dihapuskan',
    AKTIF: 'Aktif',
    NONAKTIF: 'Nonaktif',
    MENUNGGU: 'Menunggu',
    DIVERIFIKASI: 'Diverifikasi',
    DIJADWALKAN: 'Dijadwalkan',
    LULUS_REVISI: 'Lulus Revisi',
    TIDAK_LULUS: 'Tidak Lulus',
    DIBATALKAN: 'Dibatalkan',
    CUTI: 'Cuti',
    KELUAR: 'Keluar',
  };
  return map[status] || status;
}
