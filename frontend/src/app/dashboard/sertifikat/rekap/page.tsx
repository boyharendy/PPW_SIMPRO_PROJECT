'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileBadge,
  Clock,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { formatDateShort } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockStudentCertificates } from '@/lib/mock-data';
import type { StudentCertificate } from '@/lib/types';

export default function Page() {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [filterMasa, setFilterMasa] = useState<'ALL' | 'AKTIF' | 'SEGERA' | 'KEDALUWARSA'>('ALL');

  useEffect(() => {
    const data = storageSync.get<StudentCertificate[]>(
      STORAGE_KEYS.CERTIFICATES,
      mockStudentCertificates
    );
    setCertificates(data);
  }, []);

  const verifiedCerts = useMemo(() => {
    return certificates.filter((c) => c.status === 'TERVERIFIKASI');
  }, [certificates]);

  const filtered = useMemo(() => {
    if (filterMasa === 'SEGERA') {
      return verifiedCerts.filter((c) => c.is_segera_kedaluwarsa);
    }
    if (filterMasa === 'KEDALUWARSA') {
      return verifiedCerts.filter((c) => c.is_kedaluwarsa);
    }
    if (filterMasa === 'AKTIF') {
      return verifiedCerts.filter((c) => !c.is_kedaluwarsa && !c.is_segera_kedaluwarsa);
    }
    return verifiedCerts;
  }, [verifiedCerts, filterMasa]);

  const activeCount = verifiedCerts.filter((c) => !c.is_kedaluwarsa && !c.is_segera_kedaluwarsa).length;
  const expiringCount = verifiedCerts.filter((c) => c.is_segera_kedaluwarsa).length;
  const expiredCount = verifiedCerts.filter((c) => c.is_kedaluwarsa).length;

  const columns: DataTableColumn<StudentCertificate>[] = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa & Angkatan',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.mahasiswa_nama}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            NIM: {r.mahasiswa_nim} • Angkatan {r.angkatan}
          </div>
        </div>
      ),
    },
    {
      key: 'jenis',
      header: 'Jenis Sertifikasi & Lembaga',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.jenis_sertifikasi}</div>
          <div className="text-xs text-slate-500 mt-0.5">{r.lembaga_penerbit}</div>
        </div>
      ),
    },
    {
      key: 'nomor_skor',
      header: 'Nomor & Skor',
      render: (r) => (
        <div>
          <div className="text-xs text-slate-700 font-mono">{r.nomor_sertifikat}</div>
          <div className="text-xs font-semibold text-blue-700 mt-0.5">Skor: {r.skor_level}</div>
        </div>
      ),
    },
    {
      key: 'terbit',
      header: 'Tanggal Terbit',
      render: (r) => (
        <span className="text-xs text-slate-600 font-normal">
          {formatDateShort(r.tanggal_terbit)}
        </span>
      ),
    },
    {
      key: 'kedaluwarsa',
      header: 'Kedaluwarsa',
      render: (r) => (
        <span className="text-xs text-slate-700 font-normal">
          {r.is_seumur_hidup
            ? 'Seumur Hidup'
            : r.tanggal_kedaluwarsa
            ? formatDateShort(r.tanggal_kedaluwarsa)
            : '-'}
        </span>
      ),
    },
    {
      key: 'status_masa',
      header: 'Status Masa Berlaku',
      render: (r) => {
        if (r.is_seumur_hidup) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 size={12} /> Berlaku Seumur Hidup
            </span>
          );
        }
        if (r.is_kedaluwarsa) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              <ShieldAlert size={12} /> Telah Kedaluwarsa
            </span>
          );
        }
        if (r.is_segera_kedaluwarsa) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Clock size={12} /> &lt; 30 Hari Lagi
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <CheckCircle2 size={12} /> Masih Aktif
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/sertifikat"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Sertifikat
        </Link>
      </div>

      <PageHeader
        title="Rekapitulasi Masa Berlaku Sertifikat"
        description="Pemantauan masa kedaluwarsa sertifikat bahasa asing dan kompetensi profesi mahasiswa."
        actions={<ExportMenu filename="rekap-sertifikat-mahasiswa" />}
      />

      {/* 3 StatCards - Komposisi Seragam & Selaras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Sertifikat Aktif"
          value={`${activeCount} Sertifikat`}
          subtitle="Valid untuk syarat kelulusan"
          badgeTone="blue"
          icon={<FileBadge size={16} />}
        />
        <StatCard
          title="Segera Kedaluwarsa"
          value={`${expiringCount} Sertifikat`}
          subtitle="Perlu perpanjangan dalam 30 hari"
          badgeTone="amber"
          icon={<Clock size={16} />}
        />
        <StatCard
          title="Telah Kedaluwarsa"
          value={`${expiredCount} Sertifikat`}
          subtitle="Perlu ujian / sertifikasi ulang"
          badgeTone="rose"
          icon={<ShieldAlert size={16} />}
        />
      </div>

      {/* Tabel Rekapitulasi */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {(['ALL', 'AKTIF', 'SEGERA', 'KEDALUWARSA'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMasa(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterMasa === m
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'ALL'
                  ? 'Semua Status'
                  : m === 'AKTIF'
                  ? `Aktif (${activeCount})`
                  : m === 'SEGERA'
                  ? `Segera Kedaluwarsa (${expiringCount})`
                  : `Kedaluwarsa (${expiredCount})`}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {filtered.length} sertifikat terverifikasi
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Tidak ada data sertifikat terverifikasi untuk filter masa berlaku ini."
        />
      </div>
    </div>
  );
}
