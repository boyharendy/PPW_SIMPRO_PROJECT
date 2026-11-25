'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { mockUkmMemberships, mockUkmDirectories } from '@/lib/mock-data';
import type { UkmMembership, UkmPosition } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  FileCheck,
  XCircle,
  Compass,
  Lock,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function KeanggotaanUkmPage() {
  const { currentRole } = useUser();
  const [memberships, setMemberships] = useState<UkmMembership[]>(mockUkmMemberships);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [rejectModalItem, setRejectModalItem] = useState<UkmMembership | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'ALL' | 'MY'>('ALL');

  // Filter UKM yang berstatus AKTIF (FR-14, NF-01: Mahasiswa memilih UKM berstatus aktif)
  const activeUkms = mockUkmDirectories.filter((u) => u.status_aktif === 'AKTIF');

  // Form states
  const [selectedUkmId, setSelectedUkmId] = useState(activeUkms[0]?.id || mockUkmDirectories[0].id);
  const [nim, setNim] = useState('220101001');
  const [nama, setNama] = useState('Budi Darmawan');
  const [angkatan, setAngkatan] = useState('2022');
  const [jabatan, setJabatan] = useState<UkmPosition>('ANGGOTA');
  const [periode, setPeriode] = useState('2024/2025');

  const isVerifier = currentRole === 'DOSEN_PEMBINA' || currentRole === 'KAPRODI' || currentRole === 'ADMIN_PRODI';

  const visibleMemberships = viewFilter === 'MY' || currentRole === 'MAHASISWA'
    ? memberships.filter((m) => m.mahasiswa_nim === '220101001')
    : memberships;

  const pendingMembers = memberships.filter((m) => m.status === 'MENUNGGU');
  const verifiedMembers = memberships.filter((m) => m.status === 'TERVERIFIKASI');

  const handleJoinSubmit = () => {
    const targetUkm = mockUkmDirectories.find((u) => u.id === selectedUkmId);
    if (!targetUkm) return;

    const newMembership: UkmMembership = {
      id: `ukm-mem-${Date.now()}`,
      ukm_id: targetUkm.id,
      ukm_nama: targetUkm.nama_ukm,
      mahasiswa_nim: nim,
      mahasiswa_nama: nama,
      angkatan: parseInt(angkatan) || 2022,
      jabatan,
      periode_kepengurusan: periode,
      status: 'MENUNGGU',
      created_at: new Date().toISOString(),
    };

    setMemberships([newMembership, ...memberships]);
    setShowJoinModal(false);
    setToastMessage(`Pendaftaran keanggotaan di ${targetUkm.nama_ukm} berhasil disimpan dengan status Menunggu dan diteruskan ke Dosen Pembina UKM (FR-15, NF-06).`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleApprove = (row: UkmMembership) => {
    setMemberships(
      memberships.map((m) =>
        m.id === row.id
          ? {
              ...m,
              status: 'TERVERIFIKASI',
              diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T. (Dosen Pembina UKM)',
              diverifikasi_at: new Date().toISOString(),
              catatan: 'Keanggotaan disahkan resmi.',
            }
          : m
      )
    );
    setToastMessage(`Keanggotaan ${row.mahasiswa_nama} di ${row.ukm_nama} berhasil diverifikasi dan dientri dikunci (NF-06, NF-09). Rekap partisipasi otomatis diperbarui.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleConfirmReject = () => {
    if (!rejectModalItem) return;
    const notes = rejectionNotes.trim() || 'Ditolak: data kepengurusan atau prasyarat keanggotaan tidak memenuhi kualifikasi.';

    setMemberships(
      memberships.map((m) =>
        m.id === rejectModalItem.id
          ? {
              ...m,
              status: 'DITOLAK',
              diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T. (Dosen Pembina UKM)',
              diverifikasi_at: new Date().toISOString(),
              catatan: notes,
            }
          : m
      )
    );

    setToastMessage(`Keanggotaan ${rejectModalItem.mahasiswa_nama} ditolak dengan catatan. Notifikasi diteruskan ke mahasiswa dan tidak dihitung ke rekap (BPMN End Event).`);
    setTimeout(() => setToastMessage(null), 6000);
    setRejectModalItem(null);
    setRejectionNotes('');
  };

  const columns = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
      render: (row: UkmMembership) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.mahasiswa_nama}</span>
          <p className="text-[11px] text-slate-500">NIM: {row.mahasiswa_nim} • Angkatan {row.angkatan}</p>
        </div>
      ),
    },
    {
      key: 'ukm',
      header: 'Nama UKM & Periode',
      render: (row: UkmMembership) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-blue-700 text-xs">{row.ukm_nama}</span>
          <p className="text-[11px] text-slate-500">Periode: {row.periode_kepengurusan}</p>
        </div>
      ),
    },
    {
      key: 'jabatan',
      header: 'Jabatan Organisasi',
      render: (row: UkmMembership) => (
        <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
          {row.jabatan.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Verifikasi & Entri',
      render: (row: UkmMembership) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} size="sm" />
          {row.status === 'TERVERIFIKASI' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
              <Lock className="h-3 w-3" />
              <span>Terkunci (NF-06)</span>
            </span>
          )}
          {row.status === 'DITOLAK' && row.catatan && (
            <p className="text-[10px] text-rose-700 bg-rose-50 p-1 rounded border border-rose-200 line-clamp-1 max-w-[180px]" title={row.catatan}>
              Alasan: {row.catatan}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi Verifikasi Pembina (FR-15)',
      render: (row: UkmMembership) => {
        if (row.status === 'MENUNGGU') {
          if (isVerifier) {
            return (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleApprove(row)}
                  className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 shadow-xs"
                  title="Setuju & Kunci Entri (BPMN Service Task)"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Setujui</span>
                </button>
                <button
                  onClick={() => {
                    setRejectModalItem(row);
                    setRejectionNotes('');
                  }}
                  className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold flex items-center gap-1 shadow-xs"
                  title="Tolak Keanggotaan dengan Catatan (BPMN Service Task)"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Tolak</span>
                </button>
              </div>
            );
          }
          return <span className="text-[11px] text-amber-600 font-medium">Menunggu Dosen Pembina</span>;
        }

        if (row.status === 'TERVERIFIKASI') {
          return (
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Disahkan Pembina</span>
            </span>
          );
        }

        return (
          <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" />
            <span>Ditolak</span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/ukm" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Direktori UKM</span>
        </Link>
      </div>

      <PageHeader
        title="Keanggotaan & Kepengurusan UKM (FR-15)"
        description="Mahasiswa mendaftarkan keanggotaan dan kepengurusan pada UKM prodi. Keanggotaan baru resmi tercatat setelah diverifikasi oleh dosen pembina UKM terkait."
        actions={
          <button
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Daftar Keanggotaan UKM</span>
          </button>
        }
      />

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-blue-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Anggota Terverifikasi"
          value={verifiedMembers.length.toString()}
          description="Tercatat aktif di rekap prodi"
          icon="CheckCircle2"
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={pendingMembers.length.toString()}
          description="Diteruskan ke Dosen Pembina"
          icon="Clock"
        />
        <StatCard
          title="Total Registrasi"
          value={visibleMemberships.length.toString()}
          description="Periode 2024/2025"
          icon="Users"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            {currentRole === 'MAHASISWA' ? 'Riwayat Pendaftaran Keanggotaan Saya (FR-15)' : 'Daftar Pengajuan & Riwayat Keanggotaan Mahasiswa'}
          </h3>
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewFilter('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                viewFilter === 'ALL' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua Pendaftaran
            </button>
            <button
              onClick={() => setViewFilter('MY')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                viewFilter === 'MY' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pendaftaran Saya
            </button>
          </div>
        </div>

        <DataTable
          data={visibleMemberships}
          columns={columns}
          searchPlaceholder="Cari mahasiswa atau UKM..."
          searchKey="mahasiswa_nama"
        />
      </div>

      {/* MODAL: Daftar UKM (FR-15) */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Formulir Pendaftaran Keanggotaan UKM (FR-15)"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Pilih unit kegiatan mahasiswa berstatus aktif (NF-01) yang ingin Anda ikuti beserta posisi jabatan kepengurusan. Pendaftaran akan dikirimkan ke Dosen Pembina UKM untuk diverifikasi.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih UKM Berstatus Aktif *</label>
            <select
              value={selectedUkmId}
              onChange={(e) => setSelectedUkmId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            >
              {activeUkms.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama_ukm} ({u.kategori})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIM Mahasiswa</label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mahasiswa</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan dalam UKM *</label>
              <select
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value as UkmPosition)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              >
                <option value="ANGGOTA">Anggota Biasa</option>
                <option value="KORDINATOR_DIVISI">Koordinator Divisi</option>
                <option value="SEKRETARIS">Sekretaris</option>
                <option value="BENDAHARA">Bendahara</option>
                <option value="WAKIL_KETUA">Wakil Ketua</option>
                <option value="KETUA">Ketua UKM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Periode Kepengurusan</label>
              <input
                type="text"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowJoinModal(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleJoinSubmit}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Kirim Pendaftaran
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Tolak Keanggotaan dengan Catatan (FR-15, NF-09) */}
      {rejectModalItem && (
        <Modal
          isOpen={!!rejectModalItem}
          onClose={() => setRejectModalItem(null)}
          title={`Penolakan Keanggotaan — ${rejectModalItem.mahasiswa_nama}`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-slate-600 text-xs">
              Sesuai alur BPMN Modul 4, Dosen Pembina wajib memberikan <strong>catatan alasan penolakan</strong> agar mahasiswa menerima notifikasi penjelasan dan keanggotaan tidak dimasukkan ke dalam rekapitulasi.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
              <p><strong>UKM:</strong> {rejectModalItem.ukm_nama}</p>
              <p><strong>Mahasiswa:</strong> {rejectModalItem.mahasiswa_nama} ({rejectModalItem.mahasiswa_nim})</p>
              <p><strong>Jabatan Diajukan:</strong> {rejectModalItem.jabatan.replace('_', ' ')}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Alasan Penolakan *</label>
              <textarea
                rows={3}
                placeholder="Tuliskan alasan penolakan (misal: syarat IPK/kuota divisi belum terpenuhi, data kepengurusan tidak valid)..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Simpan Penolakan & Kirim Notifikasi
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
