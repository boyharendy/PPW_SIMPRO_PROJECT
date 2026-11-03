'use client';

import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Percent,
  Clock,
  Shield,
  FileCheck,
  Building,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { mockAppSettings } from '@/lib/mock-data';

export default function PengaturanMutuPage() {
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    mockAppSettings.forEach((s) => {
      initial[s.key] = s.value;
    });
    return initial;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Parameter mutu dan ambang batas sistem berhasil disimpan ke database!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReset = () => {
    const defaultVals: Record<string, string> = {
      token_mitra_expiry_hari: '30',
      trip_report_deadline_days: '7',
      trip_min_lead_days: '3',
      trip_deviasi_ambang_persen: '10',
      rps_review_default_days: '7',
      publikasi_verifikasi_sla_hari: '7',
      aduan_mode: 'LOGIN_PERMIT',
      aduan_permit_ttl_menit: '15',
      aduan_autotutup_hari: '14',
    };
    setSettings(defaultVals);
    setToastMessage('Parameter dikembalikan ke nilai rekomendasi default.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Mutu &amp; Ambang Batas Sistem"
        subtitle="Konfigurasi parameter operasional prodi, Service Level Agreement (SLA), batas deviasi anggaran, dan keamanan aduan."
        badge={
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            Administrasi Prodi
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4 text-slate-500" />
              Reset Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </button>
          </div>
        }
      />

      {toastMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Modul 7: Parameter Survei Mitra */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Modul 7 — Survei Kepuasan Mitra Pengguna</h3>
              <p className="text-xs text-slate-500">Masa berlaku tautan instrumen dan pengiriman kuesioner</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Berlaku Token Tautan Survei
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={settings.token_mitra_expiry_hari || '30'}
                  onChange={(e) => handleChange('token_mitra_expiry_hari', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-14 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  Hari
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Setelah masa berlaku habis, token tidak dapat digunakan lagi oleh perwakilan instansi mitra.
              </p>
            </div>
          </div>
        </div>

        {/* Modul 9: Perjalanan Dinas & Deviasi SPJ */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Modul 9 — Tata Kelola Perjalanan Dinas Dosen &amp; Tendik</h3>
              <p className="text-xs text-slate-500">Batas pelaporan SPJ dan ambang deviasi estimasi biaya</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tenggat Pelaporan SPJ Pasca Dinas
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.trip_report_deadline_days || '7'}
                  onChange={(e) => handleChange('trip_report_deadline_days', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-14 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  Hari
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Batas pengunggahan kuitansi tiket, penginapan, dan uang harian setelah tanggal kembali.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Time Pengajuan Minimal
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={settings.trip_min_lead_days || '3'}
                  onChange={(e) => handleChange('trip_min_lead_days', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-14 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  Hari
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Peringatan kuning dimunculkan jika usulan diajukan kurang dari N hari sebelum jadwal pergi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ambang Batas Deviasi Biaya
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.trip_deviasi_ambang_persen || '10'}
                  onChange={(e) => handleChange('trip_deviasi_ambang_persen', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-14 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  %
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Kenaikan realisasi melebihi ambang ini mewajibkan kolom justifikasi tertulis sebelum disetujui.
              </p>
            </div>
          </div>
        </div>

        {/* Modul 11 & 8: Mutu Pembelajaran & Publikasi */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Modul 8 &amp; 11 — Publikasi Ilmiah &amp; Review RPS</h3>
              <p className="text-xs text-slate-500">Standar waktu layanan penelaahan kurikulum dan verifikasi karya</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SLA Review RPS Internal (GKM / Peer Dosen)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={settings.rps_review_default_days || '7'}
                  onChange={(e) => handleChange('rps_review_default_days', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-14 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  Hari
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Tenggat waktu default bagi reviewer untuk mengisi lembar checklist 5 komponen RPS.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SLA Verifikasi Publikasi Mahasiswa
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.publikasi_verifikasi_sla_hari || '7'}
                  onChange={(e) => handleChange('publikasi_verifikasi_sla_hari', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-14 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  Hari
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Pemberitahuan pengingat otomatis dikirim ke dosen pembimbing bila verifikasi belum dilakukan.
              </p>
            </div>
          </div>
        </div>

        {/* Modul 13: Keamanan Aduan Mahasiswa */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Modul 13 — Keamanan &amp; Anonimitas Aduan Mahasiswa</h3>
              <p className="text-xs text-slate-500">Mode penerbitan permit rahasia dan siklus hidup tiket</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Verifikasi Pelapor
              </label>
              <select
                value={settings.aduan_mode || 'LOGIN_PERMIT'}
                onChange={(e) => handleChange('aduan_mode', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="LOGIN_PERMIT">LOGIN_PERMIT (Otentikasi kampus dengan token anonim)</option>
                <option value="PUBLIK_CAPTCHA">PUBLIK_CAPTCHA (Form publik dengan verifikasi hCaptcha)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Mode LOGIN_PERMIT menjamin hanya civitas aktif yang melapor tanpa menyimpan identitas akun.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Berlaku Permit Anonim (TTL)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.aduan_permit_ttl_menit || '15'}
                  onChange={(e) => handleChange('aduan_permit_ttl_menit', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-14 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  Menit
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Permit satu-kali-pakai hangus bila form aduan tidak disubmit dalam durasi waktu ini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penutupan Otomatis Tiket Selesai
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={settings.aduan_autotutup_hari || '14'}
                  onChange={(e) => handleChange('aduan_autotutup_hari', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-14 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  Hari
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Aduan yang telah ditandai tuntas otomatis diarsipkan jika pelapor tidak menyanggah dalam N hari.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-xs"
          >
            <Save className="h-4 w-4" />
            Simpan Seluruh Parameter Mutu
          </button>
        </div>
      </form>
    </div>
  );
}

