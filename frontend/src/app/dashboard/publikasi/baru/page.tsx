'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Send, Plus, Trash2, Eye, ClipboardCheck } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useUser } from '@/lib/context';
import { publicationService } from '@/lib/api/services/publication.service';
import type { AuthorRole, AuthorType, PublicationRank, PublicationStatus, PublicationType } from '@/lib/types';

type Penulis = {
  user_id?: string;
  nama: string;
  tipe: AuthorType;
  peran: AuthorRole;
  urutan: number;
};

const DOSEN_LIST = [
  { id: 'u-dosen1', nama: 'Dr. Eng. Hendra Wijaya, M.Sc.' },
  { id: 'u-dosen2', nama: 'Dewi Lestari, M.T.' },
  { id: 'u-gkm', nama: 'Siti Rahmawati, M.Kom.' },
  { id: 'u-koordinator', nama: 'Ir. Agus Pratama, M.Kom.' },
];

const PERINGKAT_OPTIONS: Record<string, { value: PublicationRank; label: string }[]> = {
  JURNAL: [
    { value: 'SINTA_1', label: 'SINTA 1' },
    { value: 'SINTA_2', label: 'SINTA 2' },
    { value: 'SINTA_3', label: 'SINTA 3' },
    { value: 'SINTA_4', label: 'SINTA 4' },
    { value: 'SINTA_5', label: 'SINTA 5' },
    { value: 'SINTA_6', label: 'SINTA 6' },
    { value: 'SCOPUS_Q1', label: 'Scopus Q1' },
    { value: 'SCOPUS_Q2', label: 'Scopus Q2' },
    { value: 'SCOPUS_Q3', label: 'Scopus Q3' },
    { value: 'SCOPUS_Q4', label: 'Scopus Q4' },
    { value: 'WOS', label: 'WoS' },
    { value: 'NON_PERINGKAT', label: 'Non-peringkat' },
  ],
  PROSIDING: [
    { value: 'SCOPUS_Q1', label: 'Scopus Q1' },
    { value: 'SCOPUS_Q2', label: 'Scopus Q2' },
    { value: 'SCOPUS_Q3', label: 'Scopus Q3' },
    { value: 'SCOPUS_Q4', label: 'Scopus Q4' },
    { value: 'NON_PERINGKAT', label: 'Non-peringkat' },
  ],
  BUKU: [{ value: 'NON_PERINGKAT', label: 'Non-peringkat' }],
  HKI: [{ value: 'NON_PERINGKAT', label: 'Non-peringkat' }],
};

const PERAN_LABELS: Record<AuthorRole, string> = {
  PENULIS_PERTAMA: 'Penulis Pertama',
  KORESPONDENSI: 'Korespondensi',
  ANGGOTA: 'Anggota / Pendamping',
  PEMBIMBING: 'Pembimbing',
};

const TIPE_LABELS: Record<AuthorType, string> = {
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
  EKSTERNAL: 'Eksternal',
};

export default function Page() {
  const router = useRouter();
  const { user, currentRole } = useUser();
  const isKaprodi = currentRole === 'KAPRODI';
  const isMahasiswaRole = currentRole === 'MAHASISWA';

  const [judul, setJudul] = useState('');
  const [jenis, setJenis] = useState<PublicationType>('JURNAL');
  const [namaTarget, setNamaTarget] = useState('');
  const [peringkat, setPeringkat] = useState<PublicationRank>('SINTA_2');
  const [tahun, setTahun] = useState('2025');
  const [penulisList, setPenulisList] = useState<Penulis[]>([
    {
      user_id: user.id,
      nama: '',
      tipe: isMahasiswaRole ? 'MAHASISWA' : 'DOSEN',
      peran: 'PENULIS_PERTAMA',
      urutan: 1,
    },
  ]);
  const [verifikator, setVerifikator] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [tenggatReview, setTenggatReview] = useState('2025-11-30');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const hasMahasiswa = isMahasiswaRole || penulisList.some((p) => p.tipe === 'MAHASISWA');
  const authorNames = new Set(penulisList.map((p) => p.nama.trim().toLowerCase()).filter(Boolean));
  const eligibleReviewers = DOSEN_LIST.filter((d) => !authorNames.has(d.nama.toLowerCase()));

  const handleAddPenulis = () => {
    setPenulisList((prev) => [
      ...prev,
      { nama: '', tipe: 'DOSEN', peran: 'ANGGOTA', urutan: prev.length + 1 },
    ]);
  };

  const handleRemovePenulis = (idx: number) => {
    setPenulisList((prev) =>
      prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, urutan: i + 1 }))
    );
  };

  const updatePenulis = (idx: number, field: keyof Penulis, value: string) => {
    setPenulisList((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = async (targetStatus: PublicationStatus) => {
    setErrorMsg('');
    if (!judul.trim()) {
      setErrorMsg('Judul publikasi wajib diisi.');
      return;
    }
    if (targetStatus === 'REVIEW_INTERNAL' && !reviewerId) {
      setErrorMsg('Pilih Dosen Reviewer Internal terlebih dahulu sebelum mengajukan Review Internal.');
      return;
    }
    if (hasMahasiswa && targetStatus !== 'DRAF' && !verifikator) {
      setErrorMsg('Pilih Dosen Verifikator (Dosen Pembimbing / Penulis Pendamping) terlebih dahulu.');
      return;
    }

    setIsSaving(true);
    try {
      const selectedVerif = DOSEN_LIST.find((d) => d.id === verifikator);
      const selectedRev = DOSEN_LIST.find((d) => d.id === reviewerId);
      const pubId = `pub-${Date.now()}`;
      const nowIso = new Date().toISOString();

      await publicationService.createPublication({
        id: pubId,
        judul: judul.trim(),
        jenis,
        nama_target: namaTarget.trim() || 'Target Publikasi',
        peringkat: peringkat || 'NON_PERINGKAT',
        status: targetStatus,
        tipe_pencatat: isMahasiswaRole ? 'MAHASISWA' : 'DOSEN',
        status_verifikasi: isMahasiswaRole || verifikator ? 'MENUNGGU' : 'TIDAK_PERLU',
        verifikator_id: selectedVerif?.id,
        verifikator_nama: selectedVerif ? `${selectedVerif.nama} (Pembimbing / Pendamping)` : undefined,
        tahun: Number(tahun) || new Date().getFullYear(),
        dicatat_oleh: user.id,
        authors: penulisList.map((p, idx) => ({
          id: `pa-${Date.now()}-${idx}`,
          user_id: p.user_id,
          nama_penulis: p.nama.trim() || user.nama_lengkap,
          tipe_penulis: p.tipe,
          peran: p.peran,
          urutan: p.urutan,
        })),
        reviews: selectedRev
          ? [
            {
              id: `rev-${Date.now()}`,
              publication_id: pubId,
              reviewer_id: selectedRev.id,
              reviewer_nama: selectedRev.nama,
              ditetapkan_oleh: user.id,
              status: 'DITUGASKAN',
              tenggat_review: tenggatReview,
              ditugaskan_at: nowIso,
            },
          ]
          : [],
        stage_logs: [
          {
            id: `psl-${Date.now()}`,
            publication_id: pubId,
            tahap: targetStatus,
            tanggal_tahap: nowIso.split('T')[0],
            catatan: `Pencatatan publikasi awal pada status ${targetStatus.replace(/_/g, ' ')}`,
            dicatat_oleh: user.id,
            status_verifikasi: isMahasiswaRole || verifikator ? 'MENUNGGU' : 'TIDAK_PERLU',
            created_at: nowIso,
          },
        ],
      });

      router.push('/dashboard/publikasi');
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

  if (isKaprodi) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pencatatan Publikasi Baru"
          description="Kaprodi hanya memantau data dan rekapitulasi publikasi program studi."
        />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-start gap-3">
          <Eye size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-800">Mode Pantau Kaprodi</h2>
            <p className="text-sm text-slate-600">
              Pada modul Publikasi, Kaprodi hanya bertugas memantau progres serta rekapitulasi publikasi.
              Pencatatan dan pembaruan status publikasi dilakukan langsung oleh Dosen atau Mahasiswa yang mem-publish karya.
            </p>
            <button
              onClick={() => router.push('/dashboard/publikasi')}
              className="btn-secondary text-xs px-4 py-2"
            >
              Kembali ke Daftar Publikasi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pencatatan Publikasi Baru"
        description="Isi detail publikasi, daftar penulis, serta review internal atau verifikator bila diperlukan"
      />

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Form Utama */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Informasi Publikasi</h2>
        <div>
          <label className={labelCls}>Judul Publikasi</label>
          <input value={judul} onChange={(e) => setJudul(e.target.value)} className={inputCls} placeholder="Masukkan judul publikasi" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Jenis Publikasi</label>
            <select
              value={jenis}
              onChange={(e) => {
                const nextJenis = e.target.value as PublicationType;
                setJenis(nextJenis);
                setPeringkat(PERINGKAT_OPTIONS[nextJenis][0].value);
              }}
              className={inputCls}
            >
              <option value="JURNAL">Jurnal</option>
              <option value="PROSIDING">Prosiding</option>
              <option value="BUKU">Buku</option>
              <option value="HKI">HKI</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Nama Target (Jurnal/Konferensi)</label>
            <input value={namaTarget} onChange={(e) => setNamaTarget(e.target.value)} className={inputCls} placeholder="cth: IEEE Access, ICAICTA 2025" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Peringkat</label>
            <select value={peringkat} onChange={(e) => setPeringkat(e.target.value as PublicationRank)} className={inputCls}>
              {(PERINGKAT_OPTIONS[jenis] || []).map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tahun</label>
            <input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} className={inputCls} min="2020" max="2030" />
          </div>
        </div>
      </div>

      {/* Daftar Penulis */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Daftar Penulis</h2>
          <button onClick={handleAddPenulis} type="button" className="bg-white text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors">
            <Plus size={14} /> Tambah Penulis
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-10">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Nama Penulis</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-36">Tipe</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-44">Peran</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {penulisList.map((p, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-slate-500 text-xs">{p.urutan}</td>
                  <td className="px-3 py-2">
                    <input value={p.nama} onChange={(e) => updatePenulis(idx, 'nama', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Nama penulis" />
                  </td>
                  <td className="px-3 py-2">
                    <select value={p.tipe} onChange={(e) => updatePenulis(idx, 'tipe', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
                      {Object.entries(TIPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select value={p.peran} onChange={(e) => updatePenulis(idx, 'peran', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
                      {Object.entries(PERAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {penulisList.length > 1 && (
                      <button type="button" onClick={() => handleRemovePenulis(idx)} className="text-rose-500 hover:text-rose-700 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Internal Opsional (FR-31) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Dosen Reviewer Internal (Opsional — FR-31)</h2>
        <p className="text-xs text-slate-500">
          Tetapkan dosen reviewer internal (bukan penulis naskah) untuk memberi catatan sebelum naskah diajukan ke penerbit.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className={inputCls}>
            <option value="">— Tanpa Reviewer Internal —</option>
            {eligibleReviewers.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
          <input type="date" value={tenggatReview} onChange={(e) => setTenggatReview(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Verifikator Mahasiswa (FR-31) */}
      {hasMahasiswa && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Dosen Verifikator (Dosen Pembimbing / Penulis Pendamping — FR-31)
          </h2>
          <p className="text-xs text-slate-500">
            Publikasi mahasiswa wajib diverifikasi oleh dosen pembimbing atau dosen penulis pendamping sebelum masuk rekap program studi.
          </p>
          <select value={verifikator} onChange={(e) => setVerifikator(e.target.value)} className={inputCls}>
            <option value="">— Pilih Dosen Pembimbing / Penulis Pendamping —</option>
            {DOSEN_LIST.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSubmit('DRAF')}
          className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <Save size={14} /> Simpan Draf
        </button>
        <button className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Send size={14} /> Ajukan
        </button>
      </div>
    </div>
  );
}
