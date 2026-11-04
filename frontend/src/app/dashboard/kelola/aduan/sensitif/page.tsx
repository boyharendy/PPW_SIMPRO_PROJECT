'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Building2,
  ExternalLink,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUser } from '@/lib/context';
import { mockComplaints } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import type { Complaint } from '@/lib/types';

export default function AduanSensitifPage() {
  const { currentRole } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>(
    mockComplaints.filter((c) => c.is_sensitif || c.kategori === 'PERUNDUNGAN_KEKERASAN')
  );

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [satgasForm, setSatgasForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    nomor_referensi: 'SATGAS-PPKPT/2025/X/055',
    petugas_satgas: 'Dr. Nurul Hidayah, S.H., M.H. (Satgas Universitas)',
    catatan_pengantar: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenTeruskan = (c: Complaint) => {
    setSelectedComplaint(c);
    setSatgasForm({
      tanggal: new Date().toISOString().split('T')[0],
      nomor_referensi: c.nomor_referensi_satgas || `SATGAS-PPKPT/2025/${new Date().getMonth() + 1}/${Math.floor(100 + Math.random() * 900)}`,
      petugas_satgas: 'Dr. Nurul Hidayah, S.H., M.H. (Satgas Universitas)',
      catatan_pengantar: '',
    });
  };

  const handleSimpanTeruskan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === selectedComplaint.id) {
          return {
            ...c,
            status: 'DITINDAKLANJUTI',
            diteruskan_ke_satgas_tanggal: satgasForm.tanggal,
            nomor_referensi_satgas: satgasForm.nomor_referensi,
          };
        }
        return c;
      })
    );

    setToastMessage(`Aduan ${selectedComplaint.nomor_aduan} berhasil diteruskan secara resmi ke Satgas PPKPT.`);
    setSelectedComplaint(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isAuthorized = currentRole === 'PETUGAS_KEKERASAN' || currentRole === 'KAPRODI';

  const columns = [
    {
      key: 'nomor',
      header: 'Nomor Aduan',
      render: (item: Complaint) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-red-500" />
            {item.nomor_aduan}
          </span>
          <span className="font-mono text-xs text-slate-500">{item.kode_tiket}</span>
        </div>
      ),
    },
    {
      key: 'tanggal',
      header: 'Tgl Lapor',
      render: (item: Complaint) => (
        <span className="text-xs text-slate-600">{formatDate(item.tanggal_diterima)}</span>
      ),
    },
    {
      key: 'judul',
      header: 'Perihal / Kasus',
      render: (item: Complaint) => (
        <div className="max-w-md">
          <p className="text-sm font-medium text-slate-800">{item.judul}</p>
          <p className="text-xs text-rose-600 italic">Kategori: Perundungan &amp; Kekerasan Seksual (Permendikbud 30/2021)</p>
        </div>
      ),
    },
    {
      key: 'satgas',
      header: 'Status Satgas PPKPT',
      render: (item: Complaint) => {
        if (item.diteruskan_ke_satgas_tanggal) {
          return (
            <div className="text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Diteruskan ke Satgas
              </span>
              <div className="text-slate-500 font-mono text-[11px]">{item.nomor_referensi_satgas}</div>
              <div className="text-slate-400 text-[10px]">Tgl: {formatDate(item.diteruskan_ke_satgas_tanggal)}</div>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            Belum diteruskan
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status Alur',
      render: (item: Complaint) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi Khusus',
      className: 'text-right',
      render: (item: Complaint) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenTeruskan(item)}
            className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors inline-flex items-center gap-1"
          >
            <Building2 className="h-3 w-3" />
            Teruskan Satgas
          </button>
          <Link
            href={`/dashboard/kelola/aduan/${item.id}`}
            className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
          >
            Detail Aman
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Antrean Aduan Sensitif (Satgas PPKPT)"
        subtitle="Kanal penanganan khusus dugaan kekerasan seksual dan perundungan dengan jaminan kerahasiaan penuh."
        badge={
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Strict Confidentiality
          </span>
        }
      />

      {toastMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Strict Privacy Banner */}
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-100 p-2 text-red-700 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-900">Perhatian Privasi &amp; Perlindungan Korban</h4>
            <p className="mt-1 text-xs text-red-800 leading-relaxed">
              Sesuai dengan <strong>Permendikbudristek No. 30 Tahun 2021</strong> dan <strong>UU No. 12 Tahun 2022 (TPKS)</strong>:
              Seluruh akses narasi aduan, lampiran bukti, dan identitas saksi/korban terenkripsi dan hanya dapat dibuka
              oleh <strong>Petugas Khusus Kekerasan</strong>. Kaprodi hanya menerima rekap agregat jumlah kasus tanpa detail isi untuk pelaporan berkala.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Kasus Masuk</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{complaints.length}</p>
          <p className="mt-1 text-xs text-slate-500">Kanal terenkripsi aktif</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Diteruskan ke Satgas PPKPT</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {complaints.filter((c) => !!c.diteruskan_ke_satgas_tanggal).length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Pendampingan universitas resmi</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sedang Berjalan</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {complaints.filter((c) => c.status === 'DITINDAKLANJUTI').length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Fase investigasi / konseling</p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={complaints}
        searchKey="judul"
        emptyMessage="Tidak ada aduan sensitif aktif saat ini."
      />

      {/* Modal Teruskan ke Satgas PPKPT */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-red-100 p-1.5 text-red-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Teruskan ke Satgas PPKPT Universitas</h3>
                  <p className="text-xs text-slate-500">{selectedComplaint.nomor_aduan}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanTeruskan} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Penerusan Berkas <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={satgasForm.tanggal}
                  onChange={(e) => setSatgasForm({ ...satgasForm, tanggal: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Referensi Resmi Satgas PPKPT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={satgasForm.nomor_referensi}
                  onChange={(e) =>
                    setSatgasForm({ ...satgasForm, nomor_referensi: e.target.value })
                  }
                  required
                  placeholder="Contoh: SATGAS-PPKPT/2025/X/042"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petugas Penerima Satgas Universitas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={satgasForm.petugas_satgas}
                  onChange={(e) =>
                    setSatgasForm({ ...satgasForm, petugas_satgas: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pengantar Khusus
                </label>
                <textarea
                  rows={3}
                  value={satgasForm.catatan_pengantar}
                  onChange={(e) =>
                    setSatgasForm({ ...satgasForm, catatan_pengantar: e.target.value })
                  }
                  placeholder="Informasi kebutuhan pendampingan psikologis mendesak atau perlindungan saksi..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-red-500 focus:outline-none"
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
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  Konfirmasi Penerusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

