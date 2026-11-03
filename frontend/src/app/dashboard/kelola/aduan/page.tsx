'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquareHeart,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Send,
  UserCheck,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { mockComplaints, mockProfiles } from '@/lib/mock-data';
import { complaintService } from '@/lib/api/services/complaint.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { formatDate } from '@/lib/utils';
import type { Complaint, ComplaintStatus } from '@/lib/types';

export default function AntreanAduanPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(() => mockComplaints.filter((c) => !c.is_sensitif));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA');
  const [kategoriFilter, setKategoriFilter] = useState<string>('SEMUA');

  useEffect(() => {
    // Sinkronisasi data lokal saat mount di client
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
    storageSync.update(STORAGE_KEYS.COMPLAINTS, selectedComplaint.id, {
      status: 'DITINDAKLANJUTI',
      dispositions: [...(selectedComplaint.dispositions || []), newDisposition],
    }, mockComplaints);

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

  const columns = [
    {
      key: 'nomor',
      header: 'Nomor & Tiket',
      render: (item: Complaint) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm">{item.nomor_aduan}</span>
          <div className="font-mono text-xs text-slate-500">{item.kode_tiket}</div>
        </div>
      ),
    },
    {
      key: 'tanggal',
      header: 'Tgl Masuk',
      render: (item: Complaint) => (
        <span className="text-xs text-slate-600">{formatDate(item.tanggal_diterima)}</span>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (item: Complaint) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          {item.kategori.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'judul',
      header: 'Judul Aduan',
      render: (item: Complaint) => (
        <div className="max-w-md">
          <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.judul}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{item.uraian}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Complaint) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'disposisi',
      header: 'Penanggung Jawab',
      render: (item: Complaint) => {
        const lastDisp = item.dispositions?.[item.dispositions.length - 1];
        if (!lastDisp) {
          return <span className="text-xs italic text-amber-600">Belum didisposisi</span>;
        }
        const profile = mockProfiles.find((p) => p.id === lastDisp.penanggung_jawab_id);
        return (
          <div className="text-xs">
            <span className="font-medium text-slate-800">{profile?.nama_lengkap || 'Petugas'}</span>
            <div className="text-slate-500 text-[11px]">Tenggat: {formatDate(lastDisp.tenggat)}</div>
          </div>
        );
      },
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (item: Complaint) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenDisposisi(item)}
            className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Disposisi
          </button>
          <Link
            href={`/dashboard/kelola/aduan/${item.id}`}
            className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
          >
            Detail
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Antrean Aduan Mahasiswa"
        subtitle="Kelola, verifikasi, dan tindak lanjuti laporan sarana, akademik, dan layanan administrasi prodi."
        badge={
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            Modul 13
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/kelola/aduan/sensitif"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Aduan Sensitif Satgas
            </Link>
            <ExportMenu filename="antrean-aduan-mahasiswa" title="Ekspor Data Aduan" />
          </div>
        }
      />

      {successToast && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aduan Aktif</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{totalAktif}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Memerlukan penanganan atau tindak lanjut</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Belum Disposisi</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{belumDisposisi}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Segera tunjuk penanggung jawab penyelesaian</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Telah Selesai</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{totalSelesai}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Terselesaikan dengan feedback pelapor</p>
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
        <div className="rounded p-1 bg-white border border-slate-200 text-slate-600 shrink-0">
          <MessageSquareHeart className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Prinsip Anonimitas Mahasiswa (Bab 11 PRD)</p>
          <p className="mt-0.5 text-slate-600">
            Sistem tidak menampilkan NIM, nama, IP address, maupun akun mahasiswa pelapor. Komunikasi dilakukan
            melalui kode tiket terenkripsi. Laporan terkait perundungan dan kekerasan seksual otomatis dipisahkan
            ke ruang terbatas Satgas PPKPT.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor aduan, tiket, judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status aduan"
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="DITERIMA">Diterima / Baru</option>
            <option value="DITINDAKLANJUTI">Ditindaklanjuti</option>
            <option value="SELESAI">Selesai</option>
            <option value="DITOLAK">Ditolak</option>
          </select>

          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            aria-label="Filter kategori aduan"
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="SEMUA">Semua Kategori</option>
            <option value="FASILITAS">Fasilitas</option>
            <option value="AKADEMIK">Akademik</option>
            <option value="LAYANAN_ADMINISTRASI">Layanan Administrasi</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="judul"
        emptyMessage="Tidak ada aduan mahasiswa yang cocok dengan kriteria filter."
      />

      {/* Modal Disposisi Cepat */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Disposisi Aduan Mahasiswa</h3>
                <p className="text-xs text-slate-500">{selectedComplaint.nomor_aduan} &bull; {selectedComplaint.judul}</p>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanDisposisi} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Penanggung Jawab Disposisi <span className="text-red-500">*</span>
                </label>
                <select
                  value={disposisiForm.penanggung_jawab_id}
                  onChange={(e) =>
                    setDisposisiForm({ ...disposisiForm, penanggung_jawab_id: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
                  Tenggat Waktu Penyelesaian <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={disposisiForm.tenggat}
                  onChange={(e) =>
                    setDisposisiForm({ ...disposisiForm, tenggat: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  Kirim Disposisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

