'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit3,
  FilePlus,
  GitBranch,
  History,
  Lock,
  PieChart,
  Plus,
  Receipt,
  Trash2,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import RkaActivityFormModal from '@/components/rka/RkaActivityFormModal';
import RkaVersionHistoryModal from '@/components/rka/RkaVersionHistoryModal';
import { rkaService } from '@/lib/api';
import { useUser } from '@/lib/context';
import {
  computeActivityTotal,
  computeDocumentTotalPagu,
  formatActivityQuarters,
  getVersionSnapshot,
  resolveActivityPicName,
  validateRkaForApproval,
} from '@/lib/rka-utils';
import type { RkaActivity, RkaDocument } from '@/lib/types';
import {
  calculateAbsorptionPercentage,
  formatDateShort,
  formatRupiah,
  getStatusLabel,
} from '@/lib/utils';

export default function Page() {
  const { tahun } = useParams<{ tahun: string }>();
  const router = useRouter();
  const { user, currentRole } = useUser();
  const isKaprodi = currentRole === 'KAPRODI';

  const [doc, setDoc] = useState<RkaDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<RkaActivity | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [alasanRevisi, setAlasanRevisi] = useState('');
  const [bannerMessage, setBannerMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await rkaService.getRkaByYear(tahun);
      if (res.data) {
        setDoc(res.data);
        setSelectedVersionNum((prev) => {
          if (prev !== null && (res.data?.versions || []).some((v) => v.nomor_versi === prev)) {
            return prev;
          }
          const working = (res.data?.versions || []).find(
            (v) => v.id === res.data?.versi_kerja_id || v.status === 'DRAF'
          );
          if (working) return working.nomor_versi;
          const active = (res.data?.versions || []).find(
            (v) => v.id === res.data?.versi_aktif_id || v.status === 'DISETUJUI'
          );
          return active?.nomor_versi ?? (res.data?.versions?.[0]?.nomor_versi ?? 1);
        });
      } else {
        setDoc(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tahun]);

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('simpro_storage_change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('simpro_storage_change', handleSync);
    };
  }, [loadData]);

  const versions = useMemo(
    () => [...(doc?.versions || [])].sort((a, b) => b.nomor_versi - a.nomor_versi),
    [doc?.versions]
  );

  const workingVersion = useMemo(
    () =>
      versions.find(
        (v) => v.id === doc?.versi_kerja_id || v.status === 'DRAF' || v.status === 'PERLU_REVISI'
      ),
    [versions, doc?.versi_kerja_id]
  );

  const activeVersion = useMemo(
    () =>
      versions.find((v) => v.id === doc?.versi_aktif_id) ||
      versions.find((v) => v.status === 'DISETUJUI') ||
      versions[0],
    [versions, doc?.versi_aktif_id]
  );

  const selectedVersion = useMemo(
    () => versions.find((v) => v.nomor_versi === selectedVersionNum) || activeVersion || workingVersion,
    [versions, selectedVersionNum, activeVersion, workingVersion]
  );

  // Tentukan apakah user sedang melihat versi draf/revisi yang dapat diedit oleh Kaprodi
  const isViewingEditableVersion = useMemo(() => {
    if (!doc || !isKaprodi) return false;
    if (doc.status === 'DITUTUP' || doc.status === 'ARSIP') return false;
    if (doc.status === 'DRAF') {
      return !selectedVersion || selectedVersion.status === 'DRAF' || selectedVersion.id === workingVersion?.id;
    }
    return Boolean(workingVersion && selectedVersion?.id === workingVersion.id);
  }, [doc, isKaprodi, selectedVersion, workingVersion]);

  const displayedActivities: RkaActivity[] = useMemo(() => {
    if (!doc) return [];
    if (!selectedVersion) return doc.activities || [];
    if (selectedVersion.id === activeVersion?.id && doc.status === 'AKTIF') {
      return doc.activities || [];
    }
    if (selectedVersion.id === doc.versi_kerja_id || selectedVersion.status === 'DRAF') {
      const draftActs = selectedVersion.draft_payload?.activities as RkaActivity[] | undefined;
      return draftActs || doc.activities || [];
    }
    return getVersionSnapshot(doc, selectedVersion).activities || [];
  }, [doc, selectedVersion, activeVersion]);

  const displayedTotalPagu = useMemo(
    () => computeDocumentTotalPagu(displayedActivities),
    [displayedActivities]
  );

  const totalRealisasi = doc?.total_realisasi ?? 0;
  const serapanPct = calculateAbsorptionPercentage(totalRealisasi, displayedTotalPagu);

  const validation = useMemo(
    () => validateRkaForApproval(displayedActivities),
    [displayedActivities]
  );

  const toggleExpand = (actId: string) => {
    setExpandedIds((prev) => ({ ...prev, [actId]: !prev[actId] }));
  };

  const handleSaveActivity = async (savedActivity: RkaActivity) => {
    if (!doc || !isViewingEditableVersion) return;
    const exists = displayedActivities.some((a) => a.id === savedActivity.id);
    const nextList = exists
      ? displayedActivities.map((a) => (a.id === savedActivity.id ? savedActivity : a))
      : [...displayedActivities, savedActivity];

    const res = await rkaService.saveDraftActivities(doc.tahun_anggaran, nextList, {
      actorName: user.name,
      summary: `${exists ? 'Memperbarui' : 'Menambahkan'} butir kegiatan "${savedActivity.kode_kegiatan} — ${savedActivity.nama_kegiatan}".`,
    });
    if (res.success && res.data) {
      setDoc(res.data);
      setExpandedIds((prev) => ({ ...prev, [savedActivity.id]: true }));
      setBannerMessage({ tone: 'success', text: res.message });
    } else {
      setBannerMessage({ tone: 'error', text: res.message });
    }
  };

  const handleDeleteActivity = async (act: RkaActivity) => {
    if (!doc || !isViewingEditableVersion) return;
    const nextList = displayedActivities.filter((a) => a.id !== act.id);
    const res = await rkaService.saveDraftActivities(doc.tahun_anggaran, nextList, {
      actorName: user.name,
      summary: `Menghapus butir kegiatan "${act.kode_kegiatan} — ${act.nama_kegiatan}".`,
    });
    if (res.success && res.data) {
      setDoc(res.data);
      setBannerMessage({ tone: 'success', text: `Kegiatan ${act.kode_kegiatan} dihapus dari draf.` });
    }
  };

  const handleApproveRka = async () => {
    if (!doc || !isKaprodi) return;
    const check = validateRkaForApproval(displayedActivities);
    if (!check.valid) {
      setBannerMessage({ tone: 'error', text: check.errors.join(' ') });
      return;
    }

    const res = await rkaService.approveRka(doc.tahun_anggaran, user.id, user.name);
    if (res.success && res.data) {
      setDoc(res.data);
      const nextActive = (res.data.versions || []).find((v) => v.id === res.data?.versi_aktif_id);
      if (nextActive) setSelectedVersionNum(nextActive.nomor_versi);
      setBannerMessage({ tone: 'success', text: res.message });
    } else {
      setBannerMessage({ tone: 'error', text: res.message });
    }
  };

  const handleStartRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc || !isKaprodi) return;
    if (!alasanRevisi.trim()) return;

    const res = await rkaService.startRevision(
      doc.tahun_anggaran,
      alasanRevisi.trim(),
      user.id,
      user.name
    );
    if (res.success && res.data) {
      setDoc(res.data);
      const draftVer = (res.data.versions || []).find((v) => v.id === res.data?.versi_kerja_id);
      if (draftVer) setSelectedVersionNum(draftVer.nomor_versi);
      setRevisionModalOpen(false);
      setAlasanRevisi('');
      setBannerMessage({ tone: 'success', text: res.message });
    } else {
      setBannerMessage({ tone: 'error', text: res.message });
    }
  };

  const handleCancelRevision = async () => {
    if (!doc || !isKaprodi) return;
    const res = await rkaService.cancelRevision(doc.tahun_anggaran, user.name);
    if (res.success && res.data) {
      setDoc(res.data);
      const actVer = (res.data.versions || []).find((v) => v.id === res.data?.versi_aktif_id);
      if (actVer) setSelectedVersionNum(actVer.nomor_versi);
      setBannerMessage({ tone: 'success', text: res.message });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Memuat detail RKA...</div>;
  }

  if (!doc) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/rka"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Dokumen RKA
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <AlertCircle className="mx-auto text-amber-500" size={32} />
          <h2 className="text-lg font-bold text-slate-800">Dokumen RKA TA {tahun} Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">
            Dokumen RKA untuk tahun anggaran ini belum dibuat atau telah dihapus.
          </p>
          <Link href="/dashboard/rka" className="btn-primary text-xs px-4 py-2 inline-flex">
            Kembali ke Daftar RKA
          </Link>
        </div>
      </div>
    );
  }

  const isViewingArchivedSnapshot =
    Boolean(selectedVersion) && selectedVersion?.status === 'DIGANTIKAN';
  const isLockedActive =
    doc.status === 'AKTIF' && !workingVersion && !isViewingArchivedSnapshot;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link
          href="/dashboard/rka"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Dokumen RKA
        </Link>

        {/* Dropdown Pemilih Versi & Riwayat Audit Log (Poin 2) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <GitBranch size={13} className="text-blue-600" />
            <span className="text-slate-500 font-medium">Versi:</span>
            <select
              value={selectedVersion?.nomor_versi ?? 1}
              onChange={(e) => setSelectedVersionNum(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.nomor_versi}>
                  v{v.nomor_versi} — {getStatusLabel(v.status)} ({formatRupiah(v.total_anggaran)})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setHistoryModalOpen(true)}
            className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
          >
            <History size={14} /> Riwayat Versi &amp; Audit Log
          </button>
        </div>
      </div>

      <PageHeader
        title={`${doc.judul}`}
        description={`Tahun Anggaran ${doc.tahun_anggaran} • Total pagu dihitung otomatis dari seluruh pos anggaran kegiatan (NF-07).`}
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge status={doc.status} size="sm" />
            {selectedVersion && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                v{selectedVersion.nomor_versi} ({getStatusLabel(selectedVersion.status)})
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {isKaprodi && isViewingEditableVersion && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingActivity(null);
                    setActivityModalOpen(true);
                  }}
                  className="btn-secondary text-xs px-3 py-2 inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Tambah Butir Kegiatan
                </button>
                {doc.status === 'AKTIF' && workingVersion && (
                  <button
                    type="button"
                    onClick={handleCancelRevision}
                    className="btn-secondary text-xs px-3 py-2 inline-flex items-center gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50"
                  >
                    <XCircle size={14} /> Batalkan Revisi
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleApproveRka}
                  className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  {doc.status === 'DRAF' ? 'Sahkan RKA (Disetujui Kaprodi)' : `Sahkan Revisi v${workingVersion?.nomor_versi}`}
                </button>
              </>
            )}

            {isKaprodi && isLockedActive && (
              <button
                type="button"
                onClick={() => {
                  setAlasanRevisi('');
                  setRevisionModalOpen(true);
                }}
                className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
              >
                <FilePlus size={14} /> Buat Revisi RKA
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push(`/dashboard/rka/${doc.tahun_anggaran}/serapan`)}
              className="btn-secondary text-xs px-3 py-2 inline-flex items-center gap-1.5"
            >
              <BarChart3 size={14} /> Monitoring Serapan
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/rka/${doc.tahun_anggaran}/realisasi`)}
              className="bg-emerald-600 text-white rounded-xl px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
            >
              <Receipt size={14} /> Realisasi Anggaran
            </button>
          </div>
        }
      />

      {/* Feedback Banner */}
      {bannerMessage && (
        <div
          className={`rounded-xl border p-3.5 text-xs flex items-start justify-between gap-3 ${
            bannerMessage.tone === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-start gap-2">
            {bannerMessage.tone === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-[11px] font-semibold opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Lock / Draft / Archive Context Banner */}
      {isViewingArchivedSnapshot && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3.5 text-xs text-purple-900 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-purple-600 shrink-0" />
            <span>
              Anda sedang melihat <strong>Arsip Snapshot Versi v{selectedVersion?.nomor_versi} (Read-Only)</strong>.
              Perubahan tidak diizinkan pada versi historis.
            </span>
          </div>
          {activeVersion && (
            <button
              type="button"
              onClick={() => setSelectedVersionNum(activeVersion.nomor_versi)}
              className="text-xs font-semibold text-purple-700 underline"
            >
              Kembali ke Versi Aktif (v{activeVersion.nomor_versi})
            </button>
          )}
        </div>
      )}

      {isLockedActive && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 flex items-center gap-2">
          <Lock size={15} className="text-slate-500 shrink-0" />
          <span>
            RKA berstatus <strong>Aktif (Disetujui Kaprodi)</strong> — pengeditan langsung butir kegiatan &amp; pagu dikunci.
            {isKaprodi
              ? ' Gunakan tombol "Buat Revisi RKA" untuk membuat versi revisi baru sambil mengarsipkan versi aktif saat ini.'
              : ' Anda memiliki akses lihat-saja pada struktur pagu utama.'}
          </span>
        </div>
      )}

      {isViewingEditableVersion && !validation.valid && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-600" />
            Syarat Pengesahan RKA (NF-01 &amp; NF-07) Belum Terpenuhi:
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pagu (Otomatis)"
          value={formatRupiah(displayedTotalPagu)}
          subtitle={`Dari ${displayedActivities.length} butir kegiatan`}
          icon={<Wallet size={16} />}
          color="blue"
        />
        <StatCard
          title="Total Realisasi Berjalan"
          value={formatRupiah(totalRealisasi)}
          subtitle={
            displayedTotalPagu >= totalRealisasi
              ? `Sisa pagu: ${formatRupiah(displayedTotalPagu - totalRealisasi)}`
              : `Over-pagu: ${formatRupiah(totalRealisasi - displayedTotalPagu)}`
          }
          icon={<TrendingUp size={16} />}
          color={totalRealisasi > displayedTotalPagu ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Persentase Serapan"
          value={`${serapanPct}%`}
          subtitle={`Versi ditampilkan: v${selectedVersion?.nomor_versi ?? 1}`}
          icon={<PieChart size={16} />}
          color={serapanPct > 100 ? 'rose' : serapanPct >= 75 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Daftar Butir Kegiatan & Pos Anggaran (FR-36) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Daftar Butir Kegiatan &amp; Pos Anggaran (FR-36)
            </h2>
            <p className="text-xs text-slate-500">
              Klik baris kegiatan untuk melihat rincian Pos Anggaran, Sumber Dana, Indikator Kinerja, PIC, dan Jadwal Pelaksanaan.
            </p>
          </div>
          {isViewingEditableVersion && (
            <button
              type="button"
              onClick={() => {
                setEditingActivity(null);
                setActivityModalOpen(true);
              }}
              className="btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus size={14} /> Tambah Kegiatan
            </button>
          )}
        </div>

        {displayedActivities.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
            <p className="text-sm font-medium text-slate-600">
              Belum ada butir kegiatan pada RKA ini.
            </p>
            {isViewingEditableVersion && (
              <button
                type="button"
                onClick={() => {
                  setEditingActivity(null);
                  setActivityModalOpen(true);
                }}
                className="btn-secondary text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5"
              >
                <Plus size={13} /> Tambah Butir Kegiatan Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedActivities.map((act) => {
              const isExpanded = expandedIds[act.id] ?? true;
              const actPagu = computeActivityTotal(act);
              const actReal = act.total_realisasi ?? 0;
              const actPct = calculateAbsorptionPercentage(actReal, actPagu);
              const isOver = actReal > actPagu;

              return (
                <div
                  key={act.id}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                >
                  {/* Activity Header Row */}
                  <div
                    onClick={() => toggleExpand(act.id)}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="mt-0.5 text-slate-400">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {act.kode_kegiatan}
                          </span>
                          <h3 className="text-sm font-bold text-slate-800">{act.nama_kegiatan}</h3>
                          <StatusBadge status={act.status_pelaksanaan} size="sm" />
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            <strong>Indikator:</strong> {act.indikator_kinerja} ({act.target_indikator})
                          </span>
                          <span>
                            <strong>Jadwal:</strong> {formatActivityQuarters(act)}
                          </span>
                          <span>
                            <strong>PIC:</strong> {resolveActivityPicName(act)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-4 shrink-0 self-end lg:self-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Pagu Kegiatan
                        </span>
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {formatRupiah(actPagu)}
                        </span>
                        {!isViewingArchivedSnapshot && (
                          <span
                            className={`text-[11px] block font-semibold ${
                              isOver ? 'text-rose-600' : 'text-slate-500'
                            }`}
                          >
                            Realisasi: {formatRupiah(actReal)} ({actPct}%)
                          </span>
                        )}
                      </div>

                      {isViewingEditableVersion && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingActivity(act);
                              setActivityModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200"
                            title="Edit Kegiatan & Pos Anggaran"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200"
                            title="Hapus Kegiatan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pos Anggaran Sub-table */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-white border-b border-slate-100 text-left text-[11px] text-slate-400 font-semibold uppercase">
                            <th className="py-2.5 px-4">Kode Pos</th>
                            <th className="py-2.5 px-3">Nama Pos Anggaran</th>
                            <th className="py-2.5 px-3">Kategori Pos</th>
                            <th className="py-2.5 px-3">Sumber Dana</th>
                            <th className="py-2.5 px-3 text-center">Vol &amp; Satuan</th>
                            <th className="py-2.5 px-3 text-right">Nominal Pagu</th>
                            {!isViewingArchivedSnapshot && (
                              <th className="py-2.5 px-4 text-right">Realisasi</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(act.budget_items || []).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-3 px-4 text-center text-rose-600 font-medium">
                                Belum ada pos anggaran pada kegiatan ini (wajib minimal 1 pos sebelum pengesahan).
                              </td>
                            </tr>
                          ) : (
                            (act.budget_items || []).map((pos) => {
                              const posReal = pos.realisasi_total ?? 0;
                              const posOver = posReal > pos.nominal_anggaran;
                              return (
                                <tr key={pos.id} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-4 font-mono text-slate-500 font-semibold">
                                    {pos.kode_pos}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium text-slate-800">
                                    {pos.nama_pos}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                                      {getStatusLabel(pos.kategori_pos)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600">
                                    {getStatusLabel(pos.sumber_dana)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-slate-600">
                                    {pos.volume} {pos.satuan}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                                    {formatRupiah(pos.nominal_anggaran)}
                                  </td>
                                  {!isViewingArchivedSnapshot && (
                                    <td
                                      className={`py-2.5 px-4 text-right font-mono font-semibold ${
                                        posOver ? 'text-rose-600' : 'text-slate-600'
                                      }`}
                                    >
                                      {formatRupiah(posReal)}
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ringkasan Riwayat Versi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch size={18} className="text-slate-400" />
            <h2 className="text-base font-semibold text-slate-800">Riwayat Versi Dokumen</h2>
          </div>
          <button
            type="button"
            onClick={() => setHistoryModalOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Bandingkan Versi &amp; Audit Log →
          </button>
        </div>
        <div className="space-y-2.5">
          {versions.map((v) => {
            const isSelected = v.nomor_versi === selectedVersion?.nomor_versi;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVersionNum(v.nomor_versi)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50/40'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    v{v.nomor_versi}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Versi {v.nomor_versi} • {formatRupiah(v.total_anggaran)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {v.alasan_revisi || 'Penyusunan RKA'} • {formatDateShort(v.diterapkan_at || v.created_at)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={v.status} size="sm" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {isKaprodi && (
        <RkaActivityFormModal
          open={activityModalOpen}
          onClose={() => setActivityModalOpen(false)}
          onSave={handleSaveActivity}
          rkaId={doc.id}
          tahun={doc.tahun_anggaran}
          initialActivity={editingActivity}
          nextIndex={displayedActivities.length + 1}
        />
      )}

      <RkaVersionHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        doc={doc}
        selectedVersionNumber={selectedVersion?.nomor_versi ?? 1}
        onSelectVersion={(num) => setSelectedVersionNum(num)}
      />

      {isKaprodi && (
        <Modal
          open={revisionModalOpen}
          onClose={() => setRevisionModalOpen(false)}
          title={`Buat Revisi RKA TA ${doc.tahun_anggaran}`}
          size="sm"
        >
          <form onSubmit={handleStartRevision} className="space-y-4 text-xs">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-blue-800 leading-relaxed">
              Membuat revisi akan mengarsipkan versi aktif saat ini sebagai snapshot <strong>read-only</strong> dan
              membuka draf versi baru (<strong>v{(versions[0]?.nomor_versi ?? 1) + 1}</strong>) untuk disunting dan disahkan.
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Alasan / Justifikasi Revisi *
              </label>
              <textarea
                rows={3}
                value={alasanRevisi}
                onChange={(e) => setAlasanRevisi(e.target.value)}
                placeholder="Contoh: Pergeseran pagu perjalanan dinas & penambahan alokasi lab..."
                className="input-field text-xs resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary text-xs px-4 py-2">
                Buka Draf Revisi
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
