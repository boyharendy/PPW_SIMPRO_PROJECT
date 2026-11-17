'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { formatRupiah } from '@/lib/utils';
import { AlertTriangle, Save, Send } from 'lucide-react';

const DOSEN_LIST = [
  'Dr. Budi Santoso, M.Kom.',
  'Siti Aminah, S.Kom., M.T.',
  'Rudi Hermawan, S.T., M.Cs.',
  'Dewi Lestari, S.Kom., M.Eng.',
];

const SUMBER_DANA = [
  { value: 'RKA_PRODI', label: 'RKA Prodi' },
  { value: 'FAKULTAS', label: 'Fakultas' },
  { value: 'HIBAH', label: 'Hibah' },
  { value: 'MANDIRI', label: 'Mandiri' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const POS_RKA = [
  { value: 'PERJALANAN_DINAS_SEMINAR', label: 'Perjalanan Dinas – Seminar/Konferensi' },
  { value: 'PERJALANAN_DINAS_WORKSHOP', label: 'Perjalanan Dinas – Workshop/Pelatihan' },
  { value: 'PERJALANAN_DINAS_BENCHMARKING', label: 'Perjalanan Dinas – Benchmarking' },
];

const SISA_ANGGARAN = 15_000_000;

export default function Page() {
  const router = useRouter();

  const [pelaksana, setPelaksana] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [maksud, setMaksud] = useState('');
  const [tglBerangkat, setTglBerangkat] = useState('');
  const [tglKembali, setTglKembali] = useState('');
  const [sumberDana, setSumberDana] = useState('');
  const [posRka, setPosRka] = useState('');

  const [biaya, setBiaya] = useState({
    transportasi: 0,
    akomodasi: 0,
    uangHarian: 0,
    lainnya: 0,
  });

  const totalBiaya = useMemo(
    () => biaya.transportasi + biaya.akomodasi + biaya.uangHarian + biaya.lainnya,
    [biaya],
  );

  const showPosRka = sumberDana === 'RKA_PRODI';
  const overBudget = showPosRka && totalBiaya > SISA_ANGGARAN;

  const today = new Date();
  const departDate = tglBerangkat ? new Date(tglBerangkat) : null;
  const tooSoon = departDate
    ? (departDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) < 3
    : false;

  const updateBiaya = (key: keyof typeof biaya) => (val: number) => {
    setBiaya((prev) => ({ ...prev, [key]: val }));
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Pengajuan Perjalanan Dinas"
        description="Isi formulir untuk mengajukan perjalanan dinas baru"
      />

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Informasi Perjalanan</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pelaksana</label>
            <select value={pelaksana} onChange={(e) => setPelaksana(e.target.value)} className={inputCls}>
              <option value="">Pilih pelaksana</option>
              {DOSEN_LIST.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tujuan</label>
            <input value={tujuan} onChange={(e) => setTujuan(e.target.value)} placeholder="Kota / Instansi tujuan" className={inputCls} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Maksud Kegiatan</label>
            <textarea value={maksud} onChange={(e) => setMaksud(e.target.value)} rows={3} placeholder="Jelaskan maksud perjalanan dinas…" className={inputCls + ' resize-none'} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal Berangkat</label>
            <input type="date" value={tglBerangkat} onChange={(e) => setTglBerangkat(e.target.value)} className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal Kembali</label>
            <input type="date" value={tglKembali} onChange={(e) => setTglKembali(e.target.value)} className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sumber Dana</label>
            <select value={sumberDana} onChange={(e) => setSumberDana(e.target.value)} className={inputCls}>
              <option value="">Pilih sumber dana</option>
              {SUMBER_DANA.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {showPosRka && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pos RKA</label>
              <select value={posRka} onChange={(e) => setPosRka(e.target.value)} className={inputCls}>
                <option value="">Pilih pos RKA</option>
                {POS_RKA.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Estimasi Biaya */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Estimasi Biaya</h2>

        {[
          { label: 'Transportasi', key: 'transportasi' as const },
          { label: 'Akomodasi', key: 'akomodasi' as const },
          { label: 'Uang Harian', key: 'uangHarian' as const },
          { label: 'Lain-lain', key: 'lainnya' as const },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-4">
            <span className="text-sm text-slate-700 w-32 shrink-0">{item.label}</span>
            <CurrencyInput value={biaya[item.key]} onChange={updateBiaya(item.key)} />
          </div>
        ))}

        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
          <span className="text-sm font-semibold text-slate-800 w-32 shrink-0">Total</span>
          <span className="text-lg font-bold text-slate-900">{formatRupiah(totalBiaya)}</span>
        </div>

        {showPosRka && (
          <p className="text-xs text-slate-500">
            Sisa anggaran pos RKA: <span className="font-semibold">{formatRupiah(SISA_ANGGARAN)}</span>
          </p>
        )}
      </div>

      {/* Warnings */}
      {(overBudget || tooSoon) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          {overBudget && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Total estimasi biaya <span className="font-semibold">melebihi sisa anggaran</span> pos RKA ({formatRupiah(SISA_ANGGARAN)}).
              </p>
            </div>
          )}
          {tooSoon && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Tanggal keberangkatan <span className="font-semibold">kurang dari 3 hari</span> dari sekarang.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <Save size={14} /> Simpan Draf
        </button>
        <button className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Send size={14} /> Ajukan
        </button>
      </div>
    </div>
  );
}
