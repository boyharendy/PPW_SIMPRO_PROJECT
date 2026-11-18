import type { BusinessTrip, RkaBudgetItem, RkaDocument } from '@/lib/types';
import { mockProfiles } from '@/lib/mock-data';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Hitung total estimasi biaya dari seluruh komponen biaya perjalanan dinas.
 */
export function getTripTotalEstimasi(trip: BusinessTrip): number {
  return (trip.costs || []).reduce((sum, c) => sum + (c.estimasi_biaya || 0), 0);
}

/**
 * Hitung total realisasi biaya perjalanan dinas.
 */
export function getTripTotalRealisasi(trip: BusinessTrip): number {
  return (trip.costs || []).reduce((sum, c) => sum + (c.realisasi_biaya || 0), 0);
}

/**
 * Ambil nama pelaksana utama (ketua rombongan atau pengaju) secara konsisten.
 */
export function getTripLeadName(trip: BusinessTrip): string {
  const lead = trip.participants?.find((p) => p.peran === 'KETUA_ROMBONGAN');
  if (lead?.user?.nama_lengkap) return lead.user.nama_lengkap;
  if (trip.pengaju?.nama_lengkap) return trip.pengaju.nama_lengkap;
  const profile = mockProfiles.find((u) => u.id === trip.diajukan_oleh);
  return profile?.nama_lengkap || trip.diajukan_oleh || '-';
}

/**
 * Ambil daftar peserta perjalanan dinas beserta perannya untuk tampilan UI.
 */
export function getTripParticipantsDisplay(
  trip: BusinessTrip
): Array<{ id: string; nama: string; peran: 'KETUA_ROMBONGAN' | 'ANGGOTA' }> {
  if (trip.participants && trip.participants.length > 0) {
    return trip.participants.map((p) => {
      const profile = p.user || mockProfiles.find((u) => u.id === p.user_id);
      return {
        id: p.id,
        nama: profile?.nama_lengkap || p.user_id,
        peran: p.peran,
      };
    });
  }
  return [
    {
      id: `lead-${trip.id}`,
      nama: getTripLeadName(trip),
      peran: 'KETUA_ROMBONGAN',
    },
  ];
}

/**
 * Temukan pos anggaran RKA yang tertaut ke perjalanan dinas.
 */
export function getTripBudgetItem(
  trip: BusinessTrip,
  rkaDocs: RkaDocument[]
): RkaBudgetItem | undefined {
  if (trip.budget_item) return trip.budget_item;
  if (!trip.rka_budget_item_id) return undefined;

  for (const doc of rkaDocs) {
    for (const act of doc.activities || []) {
      const found = act.budget_items?.find((b) => b.id === trip.rka_budget_item_id);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Evaluasi peringatan kebijakan pengajuan (keberangkatan mendadak & pagu pos RKA).
 */
export function getTripPolicyWarnings(
  trip: BusinessTrip,
  rkaDocs: RkaDocument[]
): string[] {
  const warnings: string[] = [];

  if (trip.status === 'DIAJUKAN' && trip.tanggal_berangkat) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const depart = new Date(trip.tanggal_berangkat);
    depart.setHours(0, 0, 0, 0);
    const diffDays = (depart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (!Number.isNaN(diffDays) && diffDays < 3) {
      warnings.push('Pengajuan mendadak (< 3 hari sebelum tanggal berangkat)');
    }
  }

  if (trip.sumber_dana === 'RKA_PRODI') {
    const budgetItem = getTripBudgetItem(trip, rkaDocs);
    const totalEstimasi = getTripTotalEstimasi(trip);
    if (budgetItem?.sisa_anggaran !== undefined && totalEstimasi > budgetItem.sisa_anggaran) {
      warnings.push('Total estimasi biaya melebihi sisa anggaran pos RKA');
    }
  }

  return warnings;
}

/**
 * Buat saran nomor surat tugas default berdasarkan tanggal keberangkatan dan ID usulan.
 */
export function suggestSuratTugasNumber(trip: BusinessTrip): string {
  if (trip.nomor_surat_tugas?.trim()) return trip.nomor_surat_tugas;
  const baseDate = trip.tanggal_berangkat ? new Date(trip.tanggal_berangkat) : new Date();
  const validDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const romanMonth = ROMAN_MONTHS[validDate.getMonth()] || 'XI';
  const year = validDate.getFullYear();
  const digits = trip.id.replace(/\D/g, '').padStart(2, '0').slice(-2) || '01';
  return `ST/09${digits}/UNIV-SI/${romanMonth}/${year}`;
}
