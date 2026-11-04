'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { useApp } from '@/lib/context';
import { mockProfiles, mockRkaDocuments, mockBusinessTrips } from '@/lib/mock-data';
import { tripService } from '@/lib/api/services/trip.service';
import type { BusinessTrip, TripFundingSource } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import { ArrowLeft, AlertTriangle, Send, Save, Info } from 'lucide-react';
import Link from 'next/link';

export default function PengajuanPerjalananPage() {
  const router = useRouter();
  const { user } = useApp();

  const [tujuan, setTujuan] = useState('');
  const [maksudKegiatan, setMaksudKegiatan] = useState('');
  const [tglBerangkat, setTglBerangkat] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [tglKembali, setTglKembali] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [sumberDana, setSumberDana] = useState<TripFundingSource>('RKA_PRODI');
  const [rkaBudgetItemId, setRkaBudgetItemId] = useState('pos-101');
  const [nomorSuratTugas, setNomorSuratTugas] = useState('');

  // 3 Komponen Wajib + Lainnya
  const [costTransport, setCostTransport] = useState(1500000);
  const [costAkomodasi, setCostAkomodasi] = useState(1000000);
  const [costUangHarian, setCostUangHarian] = useState(800000);
  const [costLainnya, setCostLainnya] = useState(0);
  const [keteranganLainnya, setKeteranganLainnya] = useState('');

  const totalEstimasi = costTransport + costAkomodasi + costUangHarian + costLainnya;

  // RKA Budget Checking
  const activeRka = mockRkaDocuments[0];
  const selectedBudgetItem = activeRka.activities?.[0]?.budget_items?.find(
    (b) => b.id === rkaBudgetItemId
  );
  const sisaAnggaran = selectedBudgetItem?.sisa_anggaran || 17500000;

  // Warning checks
  const daysDiff = Math.ceil(
    (new Date(tglBerangkat).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const isMendadak = daysDiff < 3;
  const isOverBudget = sumberDana === 'RKA_PRODI' && totalEstimasi > sisaAnggaran;

  const handleSubmit = async (statusTarget: 'DRAF' | 'DIAJUKAN') => {
    if (!tujuan.trim() || !maksudKegiatan.trim()) {
      alert('Tujuan dan maksud kegiatan wajib diisi.');
      return;
    }

    const newTrip: BusinessTrip = {
      id: `trip-${Date.now()}`,
      nomor_surat_tugas: nomorSuratTugas || undefined,
      diajukan_oleh: user.id,
      tujuan,
      maksud_kegiatan: maksudKegiatan,
      tanggal_berangkat: tglBerangkat,
      tanggal_kembali: tglKembali,
      sumber_dana: sumberDana,
      rka_budget_item_id: sumberDana === 'RKA_PRODI' ? rkaBudgetItemId : undefined,
      status: statusTarget,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pengaju: mockProfiles[3],
      participants: [
        {
          id: `tp-${Date.now()}`,
          trip_id: `trip-${Date.now()}`,
          user_id: user.id,
          peran: 'KETUA_ROMBONGAN',
          user: mockProfiles[3],
        },
      ],
      costs: [
        { id: `c-1`, trip_id: `trip-${Date.now()}`, komponen: 'TRANSPORTASI', estimasi_biaya: costTransport },
        { id: `c-2`, trip_id: `trip-${Date.now()}`, komponen: 'AKOMODASI', estimasi_biaya: costAkomodasi },
        { id: `c-3`, trip_id: `trip-${Date.now()}`, komponen: 'UANG_HARIAN', estimasi_biaya: costUangHarian },
        { id: `c-4`, trip_id: `trip-${Date.now()}`, komponen: 'LAINNYA', estimasi_biaya: costLainnya, keterangan: keteranganLainnya },
      ],
    };

    await tripService.createTrip(newTrip);
    router.push('/dashboard/perjalanan-dinas');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/perjalanan-dinas"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Perjalanan</span>
        </Link>
      </div>

      <PageHeader
        title="Formulir Pengajuan Perjalanan Dinas"
        description="Pengajuan estimasi kebutuhan perjalanan dinas dosen yang terhubung dengan pos anggaran RKA Prodi."
      />

      {/* Warnings Banner */}
      <div className="space-y-3">
        {isMendadak && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Peringatan Pengajuan Mendadak</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Pengajuan diajukan kurang dari 3 hari sebelum keberangkatan. Sistem akan menandai ini sebagai catatan khusus kepada Kaprodi.
              </p>
            </div>
          </div>
        )}

        {isOverBudget && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Estimasi Melebihi Sisa Pos Anggaran RKA</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Total estimasi ({formatRupiah(totalEstimasi)}) melebihi sisa pos anggaran aktif saat ini ({formatRupiah(sisaAnggaran)}).
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Info Kegiatan */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Rincian Kegiatan Perjalanan Dinas
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Kota / Lokasi Tujuan</label>
                <input
                  type="text"
                  required
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Contoh: Yogyakarta / Denpasar / Surabaya"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="label">Nomor Surat Tugas (Bila Ada)</label>
                <input
                  type="text"
                  value={nomorSuratTugas}
                  onChange={(e) => setNomorSuratTugas(e.target.value)}
                  placeholder="Contoh: ST/099/UNIV-SI/XI/2025"
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div>
              <label className="label">Maksud & Uraian Kegiatan</label>
              <textarea
                rows={2}
                required
                value={maksudKegiatan}
                onChange={(e) => setMaksudKegiatan(e.target.value)}
                placeholder="Jelaskan agenda resmi perjalanan dinas (konferensi, lokakarya, pendampingan, dsb.)..."
                className="textarea-field text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Tanggal Berangkat</label>
                <input
                  type="date"
                  required
                  value={tglBerangkat}
                  onChange={(e) => setTglBerangkat(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="label">Tanggal Kembali</label>
                <input
                  type="date"
                  required
                  value={tglKembali}
                  onChange={(e) => setTglKembali(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sumber Dana & Pemilih Pos RKA */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Sumber Dana & Alokasi Anggaran
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Sumber Dana</label>
              <select
                value={sumberDana}
                onChange={(e) => setSumberDana(e.target.value as TripFundingSource)}
                className="select-field text-xs"
              >
                <option value="RKA_PRODI">RKA Prodi SI</option>
                <option value="FAKULTAS">Fakultas</option>
                <option value="HIBAH">Hibah Penelitian / PkM</option>
                <option value="MANDIRI">Mandiri</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            {sumberDana === 'RKA_PRODI' && (
              <div>
                <label className="label">Pilih Pos Anggaran RKA Terkait</label>
                <select
                  value={rkaBudgetItemId}
                  onChange={(e) => setRkaBudgetItemId(e.target.value)}
                  className="select-field text-xs"
                >
                  <option value="pos-101">
                    5.2.2.01 - Biaya Perjalanan Dinas Dosen (Sisa: {formatRupiah(sisaAnggaran)})
                  </option>
                  <option value="pos-102">
                    5.2.2.02 - Registrasi Konferensi & Publikasi (Sisa: Rp 7.000.000)
                  </option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Estimasi Biaya Per Komponen */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Estimasi Rincian Biaya Per Komponen
              </h3>
              <p className="text-xs text-slate-500">
                Tiga komponen utama (Transportasi, Akomodasi, Uang Harian) wajib terisi (nilai minimal Rp 0)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Estimasi</span>
              <p className="text-base font-extrabold text-blue-700">{formatRupiah(totalEstimasi)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">1. Transportasi (Tiket KA/Pesawat/Lokal)</label>
              <CurrencyInput
                value={costTransport}
                onChange={setCostTransport}
                className="text-xs"
              />
            </div>

            <div>
              <label className="label">2. Akomodasi (Penginapan/Hotel)</label>
              <CurrencyInput
                value={costAkomodasi}
                onChange={setCostAkomodasi}
                className="text-xs"
              />
            </div>

            <div>
              <label className="label">3. Uang Harian (Per Diem)</label>
              <CurrencyInput
                value={costUangHarian}
                onChange={setCostUangHarian}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="label">4. Komponen Lain-lain (Opsional)</label>
              <CurrencyInput
                value={costLainnya}
                onChange={setCostLainnya}
                className="text-xs"
              />
            </div>

            {costLainnya > 0 && (
              <div>
                <label className="label">Keterangan Komponen Lainnya (Wajib)</label>
                <input
                  type="text"
                  required
                  value={keteranganLainnya}
                  onChange={(e) => setKeteranganLainnya(e.target.value)}
                  placeholder="Contoh: Biaya registrasi workshop / transport lokal taksi..."
                  className="input-field text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit('DRAF')}
            className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Simpan sebagai Draf</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('DIAJUKAN')}
            className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>Ajukan ke Kaprodi</span>
          </button>
        </div>
      </div>
    </div>
  );
}

