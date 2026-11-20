'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Send, Plus, Trash2, Eye, ClipboardCheck } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useUser } from '@/lib/context';
import { publicationService } from '@/lib/api/services/publication.service';
import {
  DOSEN_LIST,
  PERAN_LABELS,
  PERINGKAT_OPTIONS,
  TIPE_LABELS,
  type Penulis,
} from '@/components/publikasi/publicationFormConstants';
import type { AuthorRole, AuthorType, PublicationRank, PublicationStatus, PublicationType } from '@/lib/types';

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

      const actorDisplay = user.nama_lengkap || user.name || 'Pengguna';
      const verifStatus = hasMahasiswa ? 'MENUNGGU' : 'TIDAK_PERLU';

      await publicationService.createPublication({
        id: pubId,
        judul: judul.trim(),
        jenis,
        tipe_pencatat: isMahasiswaRole ? 'MAHASISWA' : 'DOSEN',
        nama_target: namaTarget.trim() || 'Target Publikasi',
        peringkat,
        tahun: parseInt(tahun, 10) || 2025,
        status: targetStatus,
        status_verifikasi: verifStatus,
        dicatat_oleh: user.id,
        verifikator_id: selectedVerif?.id,
        verifikator_nama: selectedVerif?.nama,
        authors: penulisList.map((p, i) => ({
          id: `auth-${pubId}-${i + 1}`,
          publication_id: pubId,
          user_id: p.user_id,
          nama_penulis: p.nama.trim() || `Penulis ${i + 1}`,
          tipe_penulis: p.tipe,
          peran: p.peran,
          urutan: p.urutan,
          persentase_kontribusi: Number((100 / penulisList.length).toFixed(2)),
        })),
        stage_logs: [
          {
            id: `stage-${pubId}-1`,
            publication_id: pubId,
            tahap: targetStatus,
            tanggal_tahap: nowIso.split('T')[0],
            status_verifikasi: verifStatus,
            dicatat_oleh: actorDisplay,
            catatan: targetStatus === 'DRAF' ? 'Pembuatan draf awal' : 'Pengajuan publikasi pertama kali',
            created_at: nowIso,
          },
        ],
        reviews: selectedRev
          ? [
              {
                id: `rev-${pubId}-1`,
                publication_id: pubId,
                reviewer_id: selectedRev.id,
                reviewer_nama: selectedRev.nama,
                ditetapkan_oleh: actorDisplay,
                tenggat_review: tenggatReview,
                ditugaskan_at: nowIso,
                status: 'DITUGASKAN',
              },
            ]
          : [],
      });

      router.push('/dashboard/publikasi');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan publikasi';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Pencatatan Publikasi Baru"
        description="Dosen atau mahasiswa mencatat publikasi karya ilmiah baru"
      />

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-xs font-bold underline">
            Tutup
          </button>
        </div>
      )}

      {/* Informasi Umum */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Informasi Publikasi</h2>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Judul Publikasi <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Masukkan judul artikel / naskah publikasi"
            className={inputCls}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Jenis Publikasi</label>
            <select
              value={jenis}
              onChange={(e) => {
                const j = e.target.value as PublicationType;
                setJenis(j);
                setPeringkat(PERINGKAT_OPTIONS[j][0].value);
              }}
              className={inputCls}
            >
              <option value="JURNAL">Jurnal</option>
              <option value="PROSIDING">Prosiding</option>
              <option value="BUKU">Buku</option>
              <option value="HKI">HKI / Paten</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nama Target (Jurnal / Konferensi)
            </label>
            <input
              type="text"
              value={namaTarget}
              onChange={(e) => setNamaTarget(e.target.value)}
              placeholder="Contoh: IEEE Access / JTIIK"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Peringkat / Indeks</label>
            <select
              value={peringkat}
              onChange={(e) => setPeringkat(e.target.value as PublicationRank)}
              className={inputCls}
            >
              {PERINGKAT_OPTIONS[jenis].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Tahun Publikasi</label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className={inputCls}
              min="2000"
              max="2035"
            />
          </div>
        </div>
      </div>

      {/* Daftar Penulis */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Daftar Penulis</h2>
            <p className="text-xs text-slate-500">
              Penulis urutan pertama ditetapkan sebagai Penulis Utama (Lead Author).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddPenulis}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
          >
            <Plus size={14} /> Tambah Penulis
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
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
                    <input
                      value={p.nama}
                      onChange={(e) => updatePenulis(idx, 'nama', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nama penulis"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={p.tipe}
                      onChange={(e) => updatePenulis(idx, 'tipe', e.target.value as AuthorType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    >
                      {Object.entries(TIPE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={p.peran}
                      onChange={(e) => updatePenulis(idx, 'peran', e.target.value as AuthorRole)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    >
                      {Object.entries(PERAN_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {penulisList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePenulis(idx)}
                        className="text-rose-500 hover:text-rose-700 transition-colors"
                      >
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

      {/* Review Internal Opsional */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Dosen Reviewer Internal (Opsional)</h2>
        <p className="text-xs text-slate-500">
          Tetapkan dosen reviewer internal (bukan penulis naskah) untuk memberi catatan sebelum naskah diajukan ke penerbit.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={reviewerId}
            onChange={(e) => setReviewerId(e.target.value)}
            className={inputCls}
          >
            <option value="">— Tanpa Reviewer Internal —</option>
            {eligibleReviewers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={tenggatReview}
            onChange={(e) => setTenggatReview(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Verifikator Mahasiswa */}
      {hasMahasiswa && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Dosen Verifikator (Dosen Pembimbing / Penulis Pendamping)
          </h2>
          <p className="text-xs text-slate-500">
            Publikasi mahasiswa wajib diverifikasi oleh dosen pembimbing atau dosen penulis pendamping sebelum masuk rekap program studi.
          </p>
          <select
            value={verifikator}
            onChange={(e) => setVerifikator(e.target.value)}
            className={inputCls}
          >
            <option value="">— Pilih Dosen Pembimbing / Penulis Pendamping —</option>
            {DOSEN_LIST.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
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
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSubmit('REVIEW_INTERNAL')}
          className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <ClipboardCheck size={14} /> Ajukan Review Internal
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSubmit('DIAJUKAN')}
          className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Send size={14} /> Ajukan Publikasi
        </button>
      </div>
    </div>
  );
}
