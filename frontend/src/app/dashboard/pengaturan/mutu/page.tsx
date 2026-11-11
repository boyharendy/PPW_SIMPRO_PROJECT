'use client';

import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Shield, Clock, FileText, Database } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function Page() {
  const [saved, setSaved] = useState(false);

  // App settings state
  const [maxUploadMb, setMaxUploadMb] = useState(10);
  const [aduanMode, setAduanMode] = useState('DENGAN_LOGIN');
  const [tokenMitraExpiryHari, setTokenMitraExpiryHari] = useState(30);
  const [tripReportDeadlineDays, setTripReportDeadlineDays] = useState(7);
  const [rpsReviewDays, setRpsReviewDays] = useState(7);
  const [aduanTenggatHari, setAduanTenggatHari] = useState(7);
  const [aduanAutoTutupHari, setAduanAutoTutupHari] = useState(14);
  const [ambangCpmk, setAmbangCpmk] = useState(70);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Mutu & Dokumen"
        description="Konfigurasi standar mutu, batas nilai, siklus review, dan master data penjaminan mutu."
        actions={
          <button
            onClick={handleSave}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
          </button>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Pengaturan Berkas & Mode Aduan */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              1. Pengaturan Berkas & Sistem
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ukuran Maksimum Unggah Berkas (MB)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxUploadMb}
                onChange={(e) => setMaxUploadMb(Number(e.target.value))}
                className="input-field text-xs font-mono"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Membatasi berkas PDF, DOCX, XLSX, JPG, dan PNG yang diunggah.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mode Pelaporan Aduan Mahasiswa
              </label>
              <select
                value={aduanMode}
                onChange={(e) => setAduanMode(e.target.value)}
                className="select-field text-xs"
              >
                <option value="DENGAN_LOGIN">DENGAN LOGIN (Permit Kriptografis Anonim 15 Menit)</option>
                <option value="TANPA_LOGIN_CAPTCHA">TANPA LOGIN (Verifikasi Captcha Publik)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Sesuai Keputusan Desain PRD D5.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Tenggat Waktu & Batas SLA */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              2. Batas Tenggat Waktu & SLA Siklus Operasional
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kedaluwarsa Tautan Kuesioner Mitra (Hari)
              </label>
              <input
                type="number"
                min={1}
                value={tokenMitraExpiryHari}
                onChange={(e) => setTokenMitraExpiryHari(Number(e.target.value))}
                className="input-field text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tenggat Laporan Perjalanan Dinas (Hari)
              </label>
              <input
                type="number"
                min={1}
                value={tripReportDeadlineDays}
                onChange={(e) => setTripReportDeadlineDays(Number(e.target.value))}
                className="input-field text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tenggat Waktu Review RPS (Hari)
              </label>
              <input
                type="number"
                min={1}
                value={rpsReviewDays}
                onChange={(e) => setRpsReviewDays(Number(e.target.value))}
                className="input-field text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                SLA Disposisi Aduan (Hari)
              </label>
              <input
                type="number"
                min={1}
                value={aduanTenggatHari}
                onChange={(e) => setAduanTenggatHari(Number(e.target.value))}
                className="input-field text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tutup Otomatis Aduan Selesai (Hari)
              </label>
              <input
                type="number"
                min={1}
                value={aduanAutoTutupHari}
                onChange={(e) => setAduanAutoTutupHari(Number(e.target.value))}
                className="input-field text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ambang Minimal Kelulusan CPMK (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={ambangCpmk}
                onChange={(e) => setAmbangCpmk(Number(e.target.value))}
                className="input-field text-xs font-mono"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5">
            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? 'Tersimpan!' : 'Simpan Semua Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
