import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { BusinessTrip, BusinessTripCost, TripStatus } from '@/lib/types';
import type { TripRecap } from '@/lib/types/api';

const paths = API_ENDPOINTS.TRIPS;
type ServerCost = BusinessTripCost & { nominal_estimasi: number; nominal_realisasi: number; realisasi_diisi?: boolean };
type ServerTrip = Omit<BusinessTrip, 'status' | 'costs'> & {
  status: TripStatus | 'DRAFT' | 'DISETUJUI_KAPRODI' | 'LAPORAN_TERVERIFIKASI';
  costs?: ServerCost[];
  keperluan: string;
  members?: (BusinessTrip['participants'][number] & { peran_tugas: string })[];
  report?: { ringkasan_hasil?: string; submitted_at?: string };
};
function normalize(t: ServerTrip): BusinessTrip {
  const status = t.status === 'DRAFT' ? 'DRAF' : t.status === 'DISETUJUI_KAPRODI' ? 'DISETUJUI' :
    t.status === 'LAPORAN_TERVERIFIKASI' ? 'SELESAI' : t.status;
  const proofs = t.proofs ?? [];
  return {
    ...t, status, maksud_kegiatan: t.keperluan ?? t.maksud_kegiatan, proofs,
    laporan_hasil: t.report?.ringkasan_hasil, laporan_dikirim_at: t.report?.submitted_at,
    is_belum_lengkap: status === 'DISETUJUI' && Boolean(t.catatan_kelengkapan),
    participants: (t.members ?? []).map(m => ({ ...m, peran: m.peran_tugas === 'KETUA_ROMBONGAN' ? 'KETUA_ROMBONGAN' : 'ANGGOTA' })),
    costs: (t.costs ?? []).map(c => {
      const category = c.komponen === 'TRANSPORTASI' ? 'TIKET' : c.komponen === 'AKOMODASI' ? 'BUKTI_PENGINAPAN' : 'KUITANSI';
      return {
        ...c, estimasi_biaya: c.nominal_estimasi, realisasi_biaya: c.realisasi_diisi ? c.nominal_realisasi : undefined,
        nama_berkas_bukti: proofs.find(p => p.kategori === category)?.file_name,
      };
    }),
  };
}
async function detail(id: string) {
  const res = await apiClient.get<ServerTrip>(paths.DETAIL(id));
  return { ...res, data: normalize(res.data) };
}
function payload(data: Partial<BusinessTrip>) {
  return {
    tujuan: data.tujuan, tanggal_berangkat: data.tanggal_berangkat, tanggal_kembali: data.tanggal_kembali,
    sumber_dana: data.sumber_dana, rka_budget_item_id: data.rka_budget_item_id, keperluan: data.maksud_kegiatan,
    members: data.participants?.map(m => ({ user_id: m.user_id, peran_tugas: m.peran })),
    costs: data.costs?.map(c => ({ komponen: c.komponen, nominal_estimasi: c.estimasi_biaya, keterangan: c.keterangan })),
  };
}
export const tripService = {
  async getTrips(params?: Record<string, unknown>) {
    const res = await apiClient.get<ServerTrip[]>(paths.LIST, { params });
    return { ...res, data: (res.data ?? []).map(normalize) };
  },
  getTripById: detail,
  async createTrip(data: Partial<BusinessTrip>) {
    const res = await apiClient.post<ServerTrip>(paths.CREATE, payload(data));
    if (data.status === 'DIAJUKAN') await apiClient.post(paths.SUBMIT(res.data.id));
    return detail(res.data.id);
  },
  async updateTrip(id: string, data: Partial<BusinessTrip>) {
    await apiClient.put(paths.UPDATE(id), payload(data));
    if (data.status === 'DIAJUKAN') await apiClient.post(paths.SUBMIT(id));
    return detail(id);
  },
  deleteTrip: (id: string) => apiClient.delete<void>(paths.DELETE(id)),
  async submitTrip(id: string) {
    await apiClient.post(paths.SUBMIT(id));
    return detail(id);
  },
  async approveTrip(id: string, data: { status?: TripStatus; nomor_surat_tugas?: string; catatan?: string; disetujui_oleh?: string }) {
    await apiClient.post(paths.APPROVE(id), { status: data.status ?? 'DISETUJUI', nomor_surat_tugas: data.nomor_surat_tugas, catatan: data.catatan });
    return detail(id);
  },
  async rejectTrip(id: string, catatan?: string) {
    await apiClient.post(paths.APPROVE(id), { status: 'DITOLAK', catatan });
    return detail(id);
  },
  async submitReport(id: string, data: {
    ringkasan?: string; ringkasan_hasil?: string; file_url?: string; biaya_realisasi?: number;
    realisasi_biaya?: number; costs?: BusinessTripCost[]; catatan?: string;
  }) {
    await apiClient.post(paths.REPORT(id), {
      ringkasan_hasil: data.ringkasan_hasil || data.ringkasan, file_laporan_url: data.file_url,
      costs: data.costs?.map(c => ({ komponen: c.komponen, nominal_realisasi: c.realisasi_biaya, keterangan: c.keterangan })),
    });
    return detail(id);
  },
  async confirmCompleteness(id: string, data: { lengkap: boolean; catatan?: string; dikonfirmasi_oleh?: string }) {
    await apiClient.post(paths.DETAIL(id) + '/confirm', { lengkap: data.lengkap, catatan: data.catatan });
    return detail(id);
  },
  getRecap: () => apiClient.get<TripRecap>(paths.RECAP),
};
export default tripService;
