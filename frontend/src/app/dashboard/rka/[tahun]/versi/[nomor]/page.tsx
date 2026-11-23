'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, GitCompare, Lock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { rkaService } from '@/lib/api';
import { useUser } from '@/lib/context';
import { mockProfiles } from '@/lib/mock-data';
import { computeRkaVersionDiff, getVersionSnapshot } from '@/lib/rka-utils';
import type { RkaDocument } from '@/lib/types';
import { formatDateShort, formatRupiah } from '@/lib/utils';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';

export default function Page() {
  const { tahun, nomor } = useParams<{ tahun: string; nomor: string }>();
  const router = useRouter();
  const { user, currentRole } = useUser();
  const isKaprodi = currentRole === 'KAPRODI';

  const [doc, setDoc] = useState<RkaDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await rkaService.getRkaByYear(tahun || '2025');
      if (res.data) setDoc(res.data);
    } finally {
      setIsLoading(false);
    }
  }, [tahun]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const targetNum = Number(nomor) || 1;
  const version = useMemo(
    () => (doc?.versions || []).find((v) => v.nomor_versi === targetNum),
    [doc, targetNum]
  );

  const prevVersion = useMemo(
    () => (doc?.versions || []).find((v) => v.nomor_versi === targetNum - 1),
    [doc, targetNum]
  );

  const diff = useMemo(() => {
    if (!doc || !version) return null;
    const baseSnap = prevVersion
      ? getVersionSnapshot(doc, prevVersion)
      : { judul: doc.judul, total_anggaran: 0, activities: [] };
    const targetSnap = getVersionSnapshot(doc, version);
    return computeRkaVersionDiff(baseSnap, targetSnap);
  }, [doc, version, prevVersion]);

  const handleRatify = async () => {
    if (!doc || !isKaprodi) return;
    const res = await rkaService.approveRka(doc.tahun_anggaran, user.id, user.name);
    if (res.success) {
      router.push(`/dashboard/rka/${doc.tahun_anggaran}`);
    } else {
      alert(res.message);
    }
  };

  const resolveUser = (id?: string) =>
    mockProfiles.find((p) => p.id === id)?.nama_lengkap || id || 'Kaprodi';

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Memuat detail versi...</div>;
  }

  if (!doc || !version) {
    return (
      <div className="space-y-4">
        <Link
          href={`/dashboard/rka/${tahun || '2025'}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke RKA {tahun || '2025'}
        </Link>
        <div className="card p-6 text-center text-sm text-slate-500">
          Versi #{targetNum} tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/rka/${doc.tahun_anggaran}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke RKA {doc.tahun_anggaran}
        </Link>
      </div>

      <PageHeader
        title={`Riwayat Versi RKA — Versi ${version.nomor_versi} (${doc.tahun_anggaran})`}
        description="Arsip snapshot read-only dan perbandingan perubahan antar versi rencana kerja anggaran (NF-09)."
        badge={<StatusBadge status={version.status} size="sm" />}
        actions={
          isKaprodi && (version.status === 'DRAF' || version.status === 'DIAJUKAN') ? (
            <button
              onClick={handleRatify}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} /> Sahkan Versi Ini
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Lock size={12} /> Snapshot Read-Only
            </span>
          )
        }
      />

      <MotionCard index={0} interactive={false} className="card space-y-3">
        <WordRevealHeading as="h3" text="Informasi Versi" className="text-sm font-bold text-slate-800 uppercase tracking-wider" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Nomor Versi:</span>
            <span className="font-bold text-slate-800 font-mono text-sm">
              Versi #{version.nomor_versi}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Total Pagu Versi:</span>
            <span className="font-bold text-blue-700 font-mono text-sm">
              {formatRupiah(version.total_anggaran)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Disusun Oleh:</span>
            <span className="font-medium text-slate-800">{resolveUser(version.dibuat_oleh)}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Tanggal:</span>
            <span className="font-medium text-slate-800">
              {formatDateShort(version.diterapkan_at || version.created_at)}
            </span>
          </div>
          <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-100">
            <span className="text-slate-400 block mb-1 font-semibold">Alasan Revisi / Catatan:</span>
            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
              {version.alasan_revisi || 'Penyusunan RKA'}
            </p>
          </div>
        </div>
      </MotionCard>

      {diff && (
        <MotionCard index={1} interactive={false} className="card space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <GitCompare size={16} className="text-blue-600" />
              <WordRevealHeading
                as="h3"
                text={`Perbandingan terhadap ${prevVersion ? `Versi #${prevVersion.nomor_versi}` : 'Awal'}`}
                className="text-sm font-bold text-slate-800 uppercase tracking-wider"
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">
              Selisih Total: {diff.deltaTotal >= 0 ? '+' : ''}
              {formatRupiah(diff.deltaTotal)}
            </span>
          </div>

          {diff.entries.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Tidak ada perubahan pos anggaran tercatat pada perbandingan ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {diff.entries.map((d, i) => (
                <div
                  key={i}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        d.tipe === 'TAMBAH'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : d.tipe === 'HAPUS'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {d.tipe}
                    </span>
                    <div>
                      <span className="font-mono font-bold text-slate-500 mr-2">{d.kode}</span>
                      <span className="font-semibold text-slate-800">{d.nama}</span>
                      <span className="block text-[11px] text-slate-400">{d.kegiatanNama}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs self-end sm:self-auto">
                    {d.sebelum > 0 && (
                      <span className="text-slate-400 line-through">{formatRupiah(d.sebelum)}</span>
                    )}
                    <span className="font-bold text-slate-900">{formatRupiah(d.sesudah)}</span>
                    <span
                      className={`text-[11px] font-bold ${
                        d.selisih >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      ({d.selisih >= 0 ? '+' : ''}
                      {formatRupiah(d.selisih)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MotionCard>
      )}
    </div>
  );
}
