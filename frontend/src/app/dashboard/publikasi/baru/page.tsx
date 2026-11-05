'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Send, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

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

export default function Page() {
  const router = useRouter();
  const [judul, setJudul] = useState('');
  const [jenis, setJenis] = useState('JURNAL');
  const [namaTarget, setNamaTarget] = useState('');
  const [peringkat, setPeringkat] = useState('');
  const [tahun, setTahun] = useState('2025');
  const [penulisList, setPenulisList] = useState<Penulis[]>([
    { nama: '', tipe: 'dosen', peran: 'penulis_pertama', urutan: 1 },
  ]);
  const [verifikator, setVerifikator] = useState('');

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

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pencatatan Publikasi Baru"
        description="Isi detail publikasi dan daftar penulis"
      />

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
            <select value={jenis} onChange={(e) => { setJenis(e.target.value); setPeringkat(''); }} className={inputCls}>
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
            <select value={peringkat} onChange={(e) => setPeringkat(e.target.value)} className={inputCls}>
              <option value="">— Pilih Peringkat —</option>
              {(PERINGKAT_OPTIONS[jenis] || []).map((p) => (
                <option key={p} value={p}>{p}</option>
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
          <button onClick={handleAddPenulis} className="bg-white text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors">
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
                      <button onClick={() => handleRemovePenulis(idx)} className="text-rose-500 hover:text-rose-700 transition-colors">
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
          <select value={verifikator} onChange={(e) => setVerifikator(e.target.value)} className={inputCls}>
            <option value="">— Pilih Dosen Verifikator —</option>
            <option value="DR001">Dr. Rina Fitriani, M.Kom.</option>
            <option value="DR002">Budi Hartono, M.Kom.</option>
            <option value="DR003">Dewi Kartika, M.Sc.</option>
          </select>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => router.back()} className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
          <Save size={14} /> Simpan Draf
        </button>
        <button className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Send size={14} /> Ajukan
        </button>
      </div>
    </div>
  );
}
