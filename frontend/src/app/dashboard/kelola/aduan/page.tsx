'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquareHeart,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Send,
  Calendar,
  X,
  Sparkles,
  ChevronRight,
  UserCheck,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ExportMenu } from '@/components/ui/ExportMenu';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockComplaints, mockProfiles } from '@/lib/mock-data';
import { complaintService } from '@/lib/api/services/complaint.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { formatDate } from '@/lib/utils';
import type { Complaint, ComplaintStatus } from '@/lib/types';

const SLA_TREND_DATA = [
  { bulan: 'Juni', Masuk: 4, Tuntas: 4 },
  { bulan: 'Juli', Masuk: 3, Tuntas: 3 },
  { bulan: 'Agustus', Masuk: 5, Tuntas: 4 },
  { bulan: 'September', Masuk: 6, Tuntas: 5 },
  { bulan: 'Oktober', Masuk: 4, Tuntas: 3 },
];

const SLA_SERIES: BarSeriesConfig[] = [
  { dataKey: 'Tuntas', fill: '#6EE7B7', name: 'Aduan Tuntas SLA' },
  { dataKey: 'Masuk', fill: '#818CF8', name: 'Total Aduan Masuk' },
];

export default function AntreanAduanPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    mockComplaints.filter((c) => !c.is_sensitif)
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA');
  const [kategoriFilter, setKategoriFilter] = useState<string>('SEMUA');

  useEffect(() => {
    const local = storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints);
    if (local && local.length > 0) {
      setComplaints(local.filter((c) => !c.is_sensitif));
    }

    let active = true;
    complaintService
      .getComplaints()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setComplaints(res.data.filter((c) => !c.is_sensitif));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Modal Disposisi Cepat
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [disposisiForm, setDisposisiForm] = useState({
    penanggung_jawab_id: 'u-admin',
    tenggat: '2025-10-25',
    catatan: '',
  });
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter complaints
  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'SEMUA' && c.status !== statusFilter) return false;
    if (kategoriFilter !== 'SEMUA' && c.kategori !== kategoriFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNo = c.nomor_aduan.toLowerCase().includes(q);
      const matchJudul = c.judul.toLowerCase().includes(q);
      const matchTiket = c.kode_tiket ? c.kode_tiket.toLowerCase().includes(q) : false;
      if (!matchNo && !matchJudul && !matchTiket) return false;
    }
    return true;
  });

  // Metrics
  const totalAktif = complaints.filter(
    (c) => c.status === 'DITERIMA' || c.status === 'DITINDAKLANJUTI'
  ).length;
  const belumDisposisi = complaints.filter(
    (c) => !c.dispositions || c.dispositions.length === 0
  ).length;
  const totalSelesai = complaints.filter((c) => c.status === 'SELESAI').length;

  const handleOpenDisposisi = (c: Complaint) => {
    setSelectedComplaint(c);
    setDisposisiForm({
      penanggung_jawab_id: 'u-admin',
      tenggat: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      catatan: '',
    });
  };

  const handleSimpanDisposisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const newDisposition = {
      id: `disp-${Date.now()}`,
      complaint_id: selectedComplaint.id,
      didisposisi_oleh: 'u-pengelola-aduan',
      penanggung_jawab_id: disposisiForm.penanggung_jawab_id,
      tenggat: disposisiForm.tenggat,
      catatan: disposisiForm.catatan,
      status: 'AKTIF' as const,
      created_at: new Date().toISOString(),
    };

    const updatedComplaints = complaints.map((item) => {
      if (item.id === selectedComplaint.id) {
        const updatedDispositions = [...(item.dispositions || []), newDisposition];
        return {
          ...item,
          status: 'DITINDAKLANJUTI' as ComplaintStatus,
          dispositions: updatedDispositions,
        };
      }
      return item;
    });

    setComplaints(updatedComplaints);
    storageSync.update(
      STORAGE_KEYS.COMPLAINTS,
      selectedComplaint.id,
      {
        status: 'DITINDAKLANJUTI',
        dispositions: [...(selectedComplaint.dispositions || []), newDisposition],
      },
      mockComplaints
    );

    try {
      await complaintService.createDisposition(selectedComplaint.id, {
        penanggung_jawab_id: disposisiForm.penanggung_jawab_id,
        catatan: disposisiForm.catatan,
        tenggat: disposisiForm.tenggat,
      });
    } catch {
      // Offline fallback
    }

    setSuccessToast(`Disposisi untuk aduan ${selectedComplaint.nomor_aduan} berhasil disimpan!`);
    setSelectedComplaint(null);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const statusTabs = [
    { key: 'SEMUA', label: 'Semua Aduan', count: complaints.length },
    { key: 'DITERIMA', label: 'Baru Masuk', count: complaints.filter((c) => c.status === 'DITERIMA').length },
    { key: 'DITINDAKLANJUTI', label: 'Ditindaklanjuti', count: complaints.filter((c) => c.status === 'DITINDAKLANJUTI').length },
    { key: 'SELESAI', label: 'Selesai', count: totalSelesai },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Antrean & Disposisi Aduan Mahasiswa Anonim"
        subtitle="Kelola, disposisi, dan tindak lanjuti laporan sarana, akademik, dan layanan administrasi secara terenkripsi."
        actions={<ExportMenu filename="antrean-aduan-mahasiswa" title="Ekspor Aduan" />}
      />

      {successToast && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main LoopAI Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Top KPI Row (3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Tiket Aduan Aktif"
              value={`${totalAktif} Tiket`}
              badgeText="SLA Terkendali"
              badgeTone="emerald"
              subtitle="Dalam proses penyelesaian"
            />
            <StatCard
              title="Belum Disposisi"
              value={`${belumDisposisi} Tiket`}
              badgeText={belumDisposisi > 0 ? 'Segera Tunjuk PIC' : 'Tuntas'}
              badgeTone={belumDisposisi > 0 ? 'amber' : 'emerald'}
              subtitle="Menunggu penugasan petugas"
            />
            <StatCard
              title="Telah Diselesaikan"
              value={`${totalSelesai} Tiket`}
              badgeText="100% Terbalas"
              badgeTone="indigo"
              subtitle="Dilengkapi rating kepuasan"
            />
          </div>

          {/* 2. Middle Analytics Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Analitik Penyelesaian &amp; SLA Aduan</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Perbandingan jumlah laporan masuk terhadap penyelesaian tepat waktu per bulan
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  5 Bulan Terakhir
                </span>
                <Link
                  href="/dashboard/kelola/aduan/rekap"
                  className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Analitik SLA →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Insight Box & CTA */}
              <div className="md:col-span-4 space-y-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Aduan Tuntas Tepat Waktu</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Total Laporan Masuk</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Jaminan Anonimitas NF-04</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Sistem <strong>tidak menyimpan</strong> NIM, nama, maupun IP pelapor. Komunikasi 2 arah dilakukan melalui kode tiket terenkripsi.
                  </p>
                </div>

                <Link
                  href="/dashboard/kelola/aduan/tugas-saya"
                  className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 text-white py-2.5 px-5 text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Buka Disposisi Saya</span>
                </Link>
              </div>

              {/* Right Chart Canvas */}
              <div className="md:col-span-8 h-64 w-full">
                <InteractiveBarChart
                  data={SLA_TREND_DATA}
                  xKey="bulan"
                  series={SLA_SERIES}
                  domain={[0, 8]}
                  ticks={[0, 2, 4, 6, 8]}
                  tooltipFormatter={(val) => `${val} Tiket`}
                  showLegend
                />
              </div>
            </div>
          </div>

          {/* 3. Bottom Manage Complaints Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Kelola Antrean Tiket Aduan</h2>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <select
                  value={kategoriFilter}
                  onChange={(e) => setKategoriFilter(e.target.value)}
                  aria-label="Filter kategori aduan"
                  className="select-field text-xs sm:text-sm py-1.5 w-44"
                >
                  <option value="SEMUA">Semua Kategori</option>
                  <option value="FASILITAS">Fasilitas &amp; Lab</option>
                  <option value="AKADEMIK">Akademik</option>
                  <option value="LAYANAN_ADMINISTRASI">Layanan Admin</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cari nomor atau judul..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* LoopAI Pill Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {statusTabs.map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50/60 text-slate-900 font-bold border border-indigo-900/25 shadow-2xs'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* LoopAI Avatar Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs sm:text-sm font-medium text-slate-400">
                    <th className="py-3 px-3 text-left">Nomor &amp; Tiket</th>
                    <th className="py-3 px-3 text-left">Pokok Aduan</th>
                    <th className="py-3 px-3 text-left">Penanggung Jawab</th>
                    <th className="py-3 px-3 text-left">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filtered.map((item, idx) => {
                    const lastDisp = item.dispositions?.[item.dispositions.length - 1];
                    const profile = lastDisp
                      ? mockProfiles.find((p) => p.id === lastDisp.penanggung_jawab_id)
                      : null;
                    const avatarColors = [
                      'bg-indigo-100 text-indigo-700',
                      'bg-emerald-100 text-emerald-700',
                      'bg-rose-100 text-rose-700',
                      'bg-sky-100 text-sky-700',
                    ];

                    return (
                      <tr key={item.id} className="hover:bg-indigo-50/25 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div
                                className={`w-10 h-10 rounded-full font-extrabold text-xs flex items-center justify-center ${
                                  avatarColors[idx % avatarColors.length]
                                }`}
                              >
                                #{idx + 1}
                              </div>
                              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                ✓
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{item.nomor_aduan}</p>
                              <p className="text-xs font-mono text-slate-400">
                                {formatDate(item.tanggal_diterima)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 max-w-xs">
                          <span className="inline-block rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-semibold mb-1">
                            {item.kategori.replace(/_/g, ' ')}
                          </span>
                          <p className="font-bold text-slate-900 text-sm line-clamp-1">
                            {item.judul}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1">{item.uraian}</p>
                        </td>
                        <td className="py-3.5 px-3">
                          {lastDisp ? (
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">
                                {profile?.nama_lengkap || 'Petugas Prodi'}
                              </p>
                              <p className="text-xs text-slate-400">
                                Tenggat: {formatDate(lastDisp.tenggat)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold italic text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              Belum didisposisi
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDisposisi(item)}
                              className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                              Disposisi
                            </button>
                            <Link
                              href={`/dashboard/kelola/aduan/${item.id}`}
                              className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                            >
                              <span>Detail</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Top Right Card: Priority Tasks Style */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Tiket Prioritas</h3>
              <Link
                href="/dashboard/kelola/aduan/tugas-saya"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Lihat semua
              </Link>
            </div>

            <div className="space-y-2">
              {complaints.slice(0, 4).map((comp, idx) => (
                <Link
                  key={comp.id}
                  href={`/dashboard/kelola/aduan/${comp.id}`}
                  className={`block rounded-2xl p-3.5 transition-all ${
                    idx === 0
                      ? 'bg-indigo-50/60 border border-indigo-100/80'
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent inline-block shrink-0" />
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {comp.nomor_aduan} &bull; {comp.kategori.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 pl-6">
                    <span>{formatDate(comp.tanggal_diterima)}</span>
                    <span>&bull;</span>
                    <span className="text-indigo-600 font-semibold">{comp.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 pl-6 line-clamp-1 font-medium">
                    {comp.judul}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Bottom Right Card: Smart Action Hub */}
          <div className="rounded-[22px] bg-gradient-to-b from-indigo-100/70 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="text-center space-y-1 pt-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Penanganan Aspirasi &amp; Tiket Anonim 👋
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pusat Kendali Aduan
              </h3>
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-2xs border border-indigo-100">
                <Sparkles className="w-3 h-3" />
                Enkripsi Tiket
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                Utas 2-Arah
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                FR-49 s/d FR-52
              </span>
            </div>

            {/* 2x2 Grid Action Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/kelola/aduan/tugas-saya"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Disposisi Saya
                </p>
              </Link>

              <Link
                href="/dashboard/kelola/aduan/sensitif"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Ruang Satgas
                </p>
              </Link>

              <Link
                href="/dashboard/kelola/aduan/rekap"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Rekap &amp; SLA
                </p>
              </Link>

              <Link
                href="/aduan/lacak"
                target="_blank"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Portal Pelacak
                </p>
              </Link>
            </div>

            <Link
              href="/dashboard/aduan"
              className="flex items-center justify-between bg-white rounded-full px-4 py-2.5 border border-slate-200/80 text-xs sm:text-sm text-slate-500 hover:border-indigo-300 transition-colors shadow-2xs"
            >
              <span>Formulir pengiriman aduan anonim...</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Disposisi Cepat */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Disposisi Aduan Mahasiswa</h3>
                <p className="text-xs text-slate-500">
                  {selectedComplaint.nomor_aduan} &bull; {selectedComplaint.judul}
                </p>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanDisposisi} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Penanggung Jawab Disposisi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={disposisiForm.penanggung_jawab_id}
                  onChange={(e) =>
                    setDisposisiForm({ ...disposisiForm, penanggung_jawab_id: e.target.value })
                  }
                  required
                  className="select-field text-sm rounded-xl"
                >
                  {mockProfiles
                    .filter((p) => p.tipe_pengguna === 'DOSEN' || p.tipe_pengguna === 'TENDIK')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama_lengkap} ({p.tipe_pengguna})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tenggat Waktu Penyelesaian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={disposisiForm.tenggat}
                  onChange={(e) =>
                    setDisposisiForm({ ...disposisiForm, tenggat: e.target.value })
                  }
                  required
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instruksi / Catatan Disposisi
                </label>
                <textarea
                  rows={3}
                  value={disposisiForm.catatan}
                  onChange={(e) =>
                    setDisposisiForm({ ...disposisiForm, catatan: e.target.value })
                  }
                  placeholder="Instruksi tindakan perbaikan yang perlu dilakukan oleh penanggung jawab..."
                  className="textarea-field text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="btn-secondary text-sm"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary text-sm">
                  <Send className="h-4 w-4" />
                  <span>Kirim Disposisi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
