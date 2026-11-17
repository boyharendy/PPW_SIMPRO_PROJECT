'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Send, Plus, Trash2, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { useApp } from '@/lib/context';
import { mockData as defaultPubs, type Publikasi } from '../page';
import { MOCK_VERIF, type VerificationItem } from '../verifikasi/page';

type Penulis = {
  nama: string;
  tipe: 'dosen' | 'mahasiswa' | 'eksternal';
  peran: 'penulis_pertama' | 'korespondensi' | 'anggota' | 'pembimbing';
  urutan: number;
};

const PERINGKAT_OPTIONS: Record<string, string[]> = {
  JURNAL: ['SINTA 1', 'SINTA 2', 'SINTA 3', 'SINTA 4', 'SINTA 5', 'SINTA 6', 'Scopus Q1', 'Scopus Q2', 'Scopus Q3', 'Scopus Q4', 'WoS', 'Non-peringkat'],
  PROSIDING: ['Scopus Q1', 'Scopus Q2', 'Scopus Q3', 'Scopus Q4', 'Non-peringkat'],
  BUKU: ['Non-peringkat'],
  HKI: ['Non-peringkat'],
};

const PERAN_LABELS: Record<string, string> = {
  penulis_pertama: 'Penulis Pertama',
  korespondensi: 'Korespondensi',
  anggota: 'Anggota',
  pembimbing: 'Pembimbing',
};

const TIPE_LABELS: Record<string, string> = {
  dosen: 'Dosen',
  mahasiswa: 'Mahasiswa',
  eksternal: 'Eksternal',
};

const VERIFIKATOR_MAP: Record<string, string> = {
  DR001: 'Dr. Rina Fitriani, M.Kom.',
  DR002: 'Budi Hartono, M.Kom.',
  DR003: 'Dewi Kartika, M.Sc.',
};

export default function Page() {
  const router = useRouter();
  const { user } = useApp();
  const [judul, setJudul] = useState('');
  const [jenis, setJenis] = useState<'JURNAL' | 'PROSIDING' | 'BUKU' | 'HKI'>('JURNAL');
  const [namaTarget, setNamaTarget] = useState('');
  const [peringkat, setPeringkat] = useState('');
  const [tahun, setTahun] = useState('2025');
  const [penulisList, setPenulisList] = useState<Penulis[]>([
    {
      nama: user.activeRole === 'MAHASISWA' ? user.nama_lengkap || 'Ahmad Mahasiswa' : '',
      tipe: user.activeRole === 'MAHASISWA' ? 'mahasiswa' : 'dosen',
      peran: 'penulis_pertama',
      urutan: 1,
    },
  ]);
  const [verifikator, setVerifikator] = useState('DR002');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasMahasiswa = penulisList.some((p) => p.tipe === 'mahasiswa');

  const handleAddPenulis = () => {
    setPenulisList((prev) => [
      ...prev,
      { nama: '', tipe: 'dosen', peran: 'anggota', urutan: prev.length + 1 },
    ]);
  };

  const handleRemovePenulis = (idx: number) => {
    setPenulisList((prev) => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, urutan: i + 1 })));
  };

  const updatePenulis = (idx: number, field: keyof Penulis, value: string) => {
    setPenulisList((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = (status: 'DRAF' | 'DIAJUKAN') => {
    setErrorMsg('');

    if (!judul.trim()) {
      setErrorMsg('Judul publikasi wajib diisi.');
      return;
    }

    const filledAuthors = penulisList.filter((p) => p.nama.trim().length > 0);
    if (filledAuthors.length === 0) {
      setErrorMsg('Minimal satu nama penulis wajib diisi.');
      return;
    }

    if (hasMahasiswa && status === 'DIAJUKAN' && !verifikator) {
      setErrorMsg('Publikasi yang melibatkan mahasiswa wajib memilih Dosen Verifikator.');
      return;
    }

    setIsSubmitting(true);

    const pubId = `PUB-${Date.now().toString().slice(-4)}`;
    const verifikatorLabel = VERIFIKATOR_MAP[verifikator] || verifikator || 'Budi Hartono, M.Kom.';
    const studentAuthor = penulisList.find((p) => p.tipe === 'mahasiswa') || penulisList[0];

    const newPub: Publikasi = {
      id: pubId,
      judul: judul.trim(),
      jenis,
      penulisUtama: filledAuthors[0].nama.trim(),
      peringkat: peringkat || 'Non-peringkat',
      tahun: parseInt(tahun, 10) || 2025,
      status,
      target: namaTarget.trim() || undefined,
      status_verifikasi: hasMahasiswa ? (status === 'DIAJUKAN' ? 'MENUNGGU' : 'DRAF') : 'TIDAK_PERLU',
      verifikator: hasMahasiswa ? verifikatorLabel : undefined,
    };

    // Prepend to publications in storageSync
    storageSync.prepend(STORAGE_KEYS.PUBLICATIONS, newPub, defaultPubs);

    // If submitted with Mahasiswa author, insert into verification queue
    if (hasMahasiswa && status === 'DIAJUKAN') {
      const cleanFileName = judul.trim().replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      const newVerif: VerificationItem = {
        id: `ver-${Date.now()}`,
        publication_id: newPub.id,
        judul: newPub.judul,
        jenis: newPub.jenis,
        mahasiswa: studentAuthor.nama.trim() || user.nama_lengkap || 'Mahasiswa',
        nim: '1201220055',
        tahap: 'DIAJUKAN',
        bukti: `Bukti_Submit_${cleanFileName}.pdf`,
        tanggal: new Date().toISOString().split('T')[0],
        status: 'MENUNGGU',
        verifikator: verifikatorLabel,
      };

      storageSync.prepend(STORAGE_KEYS.PUBLICATION_VERIFICATIONS, newVerif, MOCK_VERIF);
    }

    router.push('/dashboard/publikasi');
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pencatatan Publikasi Baru"
        description="Isi detail publikasi dan daftar penulis"
      />

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Utama */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Informasi Publikasi</h2>

        <div>
          <label className={labelCls}>Judul Publikasi</label>
          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className={inputCls}
            placeholder="Masukkan judul publikasi"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Jenis Publikasi</label>
            <select
              value={jenis}
              onChange={(e) => {
                setJenis(e.target.value as any);
                setPeringkat('');
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
            <input
              value={namaTarget}
              onChange={(e) => setNamaTarget(e.target.value)}
              className={inputCls}
              placeholder="cth: IEEE Access, ICAICTA 2025"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Peringkat</label>
            <select
              value={peringkat}
              onChange={(e) => setPeringkat(e.target.value)}
              className={inputCls}
            >
              <option value="">— Pilih Peringkat —</option>
              {(PERINGKAT_OPTIONS[jenis] || []).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tahun</label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className={inputCls}
              min="2020"
              max="2030"
            />
          </div>
        </div>
      </div>

      {/* Daftar Penulis */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Daftar Penulis</h2>
          <button
            type="button"
            onClick={handleAddPenulis}
            className="bg-white text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
          >
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
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-40">Peran</th>
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Nama penulis"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={p.tipe}
                      onChange={(e) => updatePenulis(idx, 'tipe', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm cursor-pointer"
                    >
                      {Object.entries(TIPE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={p.peran}
                      onChange={(e) => updatePenulis(idx, 'peran', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm cursor-pointer"
                    >
                      {Object.entries(PERAN_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {penulisList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePenulis(idx)}
                        className="text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
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

      {/* Verifikator (conditional) */}
      {hasMahasiswa && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Dosen Verifikator</h2>
          <p className="text-xs text-slate-500">Publikasi melibatkan mahasiswa — pilih dosen verifikator.</p>
          <select
            value={verifikator}
            onChange={(e) => setVerifikator(e.target.value)}
            className={inputCls}
          >
            <option value="">— Pilih Dosen Verifikator —</option>
            <option value="DR001">Dr. Rina Fitriani, M.Kom.</option>
            <option value="DR002">Budi Hartono, M.Kom.</option>
            <option value="DR003">Dewi Kartika, M.Sc.</option>
          </select>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit('DRAF')}
          className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save size={14} /> Simpan Draf
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit('DIAJUKAN')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Send size={14} /> {isSubmitting ? 'Mengajukan...' : 'Ajukan'}
        </button>
      </div>
    </div>
  );
}
