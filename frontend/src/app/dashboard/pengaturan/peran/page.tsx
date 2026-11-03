'use client';

import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Edit2,
  CheckCircle2,
  FileText,
  Calendar,
  X,
  Mail,
  Award,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { mockProfiles } from '@/lib/mock-data';
import type { Role } from '@/lib/types';

interface RoleAssignment {
  id: string;
  roleKey: Role;
  roleTitle: string;
  category: string;
  description: string;
  currentUserId: string;
  skNumber: string;
  periode: string;
}

const initialAssignments: RoleAssignment[] = [
  {
    id: 'ra-gkm',
    roleKey: 'GKM',
    roleTitle: 'Gugus Kendali Mutu (GKM)',
    category: 'Penjaminan Mutu',
    description: 'Bertanggung jawab atas review dokumen RPS, pemantauan CPMK, dan post evaluasi perkuliahan.',
    currentUserId: 'u-gkm',
    skNumber: 'SK-DEKAN/2024/08/012',
    periode: '2024 - 2026',
  },
  {
    id: 'ra-kp',
    roleKey: 'KOORDINATOR_KP',
    roleTitle: 'Koordinator Kerja Praktik (KP)',
    category: 'Kemitraan & Magang',
    description: 'Mengelola instrumen kepuasan mitra KP dan memantau respons perusahaan mitra magang.',
    currentUserId: 'u-koordinator',
    skNumber: 'SK-DEKAN/2024/08/015',
    periode: '2024 - 2025',
  },
  {
    id: 'ra-psi',
    roleKey: 'KOORDINATOR_PSI',
    roleTitle: 'Koordinator Proyek Sistem Informasi (PSI)',
    category: 'Kemitraan & Magang',
    description: 'Mengelola survei kepuasan mitra industri pada proyek capstone mahasiswa.',
    currentUserId: 'u-koordinator',
    skNumber: 'SK-DEKAN/2024/08/016',
    periode: '2024 - 2025',
  },
  {
    id: 'ra-pdlk',
    roleKey: 'KOORDINATOR_PDLK',
    roleTitle: 'Koordinator Pembelajaran di Luar Kampus (PDLK)',
    category: 'Kemitraan & Magang',
    description: 'Mengelola instrumen dan memantau kepuasan mitra untuk program pertukaran dan pembelajaran luar kampus.',
    currentUserId: 'u-koordinator',
    skNumber: 'SK-DEKAN/2024/08/017',
    periode: '2024 - 2025',
  },
  {
    id: 'ra-admin',
    roleKey: 'ADMIN_PRODI',
    roleTitle: 'Admin Program Studi',
    category: 'Tata Kelola & Anggaran',
    description: 'Mengelola administrasi perjalanan dinas dosen, pencatatan realisasi RKA, dan operasional prodi.',
    currentUserId: 'u-admin',
    skNumber: 'SK-REKTOR/2023/12/045',
    periode: '2024 - 2026',
  },
  {
    id: 'ra-aduan',
    roleKey: 'PENGELOLA_ADUAN',
    roleTitle: 'Pengelola Layanan Aduan Mahasiswa',
    category: 'Layanan Kemahasiswaan',
    description: 'Menerima tiket aduan mahasiswa, melakukan verifikasi awal, dan mendisposisikan ke staf terkait.',
    currentUserId: 'u-pengelola-aduan',
    skNumber: 'SK-KAPRODI/2024/09/004',
    periode: '2024 - 2025',
  },
  {
    id: 'ra-kekerasan',
    roleKey: 'PETUGAS_KEKERASAN',
    roleTitle: 'Petugas Khusus Penanganan Kekerasan (Satgas PPKPT)',
    category: 'Perlindungan & Hukum',
    description: 'Memiliki kewenangan khusus menangani aduan sensitif perundungan dan meneruskannya ke Satgas universitas.',
    currentUserId: 'u-petugas-kekerasan',
    skNumber: 'SK-REKTOR/2024/01/088',
    periode: '2024 - 2026',
  },
];

export default function PenetapanPeranPage() {
  const [assignments, setAssignments] = useState<RoleAssignment[]>(initialAssignments);
  const [selectedRole, setSelectedRole] = useState<RoleAssignment | null>(null);
  const [editForm, setEditForm] = useState({
    userId: '',
    skNumber: '',
    periode: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenEdit = (item: RoleAssignment) => {
    setSelectedRole(item);
    setEditForm({
      userId: item.currentUserId,
      skNumber: item.skNumber,
      periode: item.periode,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id === selectedRole.id) {
          return {
            ...a,
            currentUserId: editForm.userId,
            skNumber: editForm.skNumber,
            periode: editForm.periode,
          };
        }
        return a;
      })
    );

    setToastMessage(`Pejabat tugas untuk ${selectedRole.roleTitle} berhasil diperbarui.`);
    setSelectedRole(null);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penetapan Peran &amp; Gugus Tugas Prodi"
        subtitle="Kelola pejabat penjaminan mutu, koordinator kemitraan, pengelola aduan, dan petugas Satgas PPKPT tingkat program studi."
        badge={
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            Kewenangan Kaprodi
          </span>
        }
      />

      {toastMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid of Role Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {assignments.map((item) => {
          const profile = mockProfiles.find((p) => p.id === item.currentUserId);
          const isSensitiveRole = item.roleKey === 'PETUGAS_KEKERASAN';

          return (
            <div
              key={item.id}
              className={`rounded-xl border bg-white p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between ${
                isSensitiveRole ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold mb-1.5 ${
                        isSensitiveRole
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{item.roleTitle}</h3>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    title="Ubah Pejabat Tugas"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{item.description}</p>

                {/* Assigned Profile Card */}
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3 flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                      isSensitiveRole ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                  >
                    {profile?.nama_lengkap.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {profile?.nama_lengkap || 'Belum ditugaskan'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      NIP/NIDN: {profile?.nomor_induk || '-'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {profile?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Reference & Period */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1 truncate max-w-[200px]" title={item.skNumber}>
                  <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{item.skNumber}</span>
                </div>
                <div className="flex items-center gap-1 font-medium text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Periode: {item.periode}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Role Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Penugasan Pejabat Peran</h3>
                <p className="text-xs text-slate-500">{selectedRole.roleTitle}</p>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Dosen / Tenaga Kependidikan <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.userId}
                  onChange={(e) => setEditForm({ ...editForm, userId: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {mockProfiles
                    .filter((p) => p.tipe_pengguna === 'DOSEN' || p.tipe_pengguna === 'TENDIK')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama_lengkap} — NIP: {p.nomor_induk}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Surat Keputusan (SK) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.skNumber}
                  onChange={(e) => setEditForm({ ...editForm, skNumber: e.target.value })}
                  required
                  placeholder="Contoh: SK-DEKAN/2025/08/022"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periode Masa Jabatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.periode}
                  onChange={(e) => setEditForm({ ...editForm, periode: e.target.value })}
                  required
                  placeholder="Contoh: 2024 - 2026"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

