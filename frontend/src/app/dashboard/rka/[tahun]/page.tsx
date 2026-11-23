'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart3,
  CheckCircle2,
  FilePlus,
  Plus,
  Receipt,
  XCircle,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import RkaActivityFormModal from '@/components/rka/RkaActivityFormModal';
import RkaVersionHistoryModal from '@/components/rka/RkaVersionHistoryModal';
import RkaActivityList from '@/components/rka/RkaActivityList';
import RkaDetailStatusSection from '@/components/rka/RkaDetailStatusSection';
import RkaVersionSummarySection, {
  RkaNotFoundState,
  RkaVersionToolbar,
} from '@/components/rka/RkaVersionSummarySection';
import { rkaService } from '@/lib/api';
import { useUser } from '@/lib/context';
import {
  computeDocumentTotalPagu,
  getVersionSnapshot,
  validateRkaForApproval,
} from '@/lib/rka-utils';
import type { RkaActivity, RkaDocument } from '@/lib/types';
import { calculateAbsorptionPercentage, getStatusLabel } from '@/lib/utils';

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

  const handleStartRevision = async (alasan: string) => {
    if (!doc || !isKaprodi) return;
    const res = await rkaService.startRevision(doc.tahun_anggaran, alasan, user.id, user.name);
    if (res.success && res.data) {
      setDoc(res.data);
      const draftVer = (res.data.versions || []).find((v) => v.id === res.data?.versi_kerja_id);
      if (draftVer) setSelectedVersionNum(draftVer.nomor_versi);
      setRevisionModalOpen(false);
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
    return <RkaNotFoundState tahun={tahun} />;
  }

  const isViewingArchivedSnapshot =
    Boolean(selectedVersion) && selectedVersion?.status === 'DIGANTIKAN';
  const isLockedActive =
    doc.status === 'AKTIF' && !workingVersion && !isViewingArchivedSnapshot;

  return (
    <div className="space-y-5">
      <RkaVersionToolbar
        versions={versions}
        selectedVersionNumber={selectedVersion?.nomor_versi}
        onSelectVersion={setSelectedVersionNum}
        onOpenHistory={() => setHistoryModalOpen(true)}
      />

      <PageHeader
        title={`${doc.judul}`}
        description={`Tahun Anggaran ${doc.tahun_anggaran} • Total pagu dihitung otomatis dari seluruh pos anggaran kegiatan.`}
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
                onClick={() => setRevisionModalOpen(true)}
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

      <RkaDetailStatusSection
        bannerMessage={bannerMessage}
        onDismissBanner={() => setBannerMessage(null)}
        isViewingArchivedSnapshot={isViewingArchivedSnapshot}
        isLockedActive={isLockedActive}
        isKaprodi={isKaprodi}
        isViewingEditableVersion={isViewingEditableVersion}
        validation={validation}
        selectedVersion={selectedVersion}
        activeVersion={activeVersion}
        onSelectVersion={setSelectedVersionNum}
        displayedTotalPagu={displayedTotalPagu}
        displayedActivityCount={displayedActivities.length}
        totalRealisasi={totalRealisasi}
        serapanPct={serapanPct}
      />

      <RkaActivityList
        activities={displayedActivities}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        isViewingEditableVersion={isViewingEditableVersion}
        isViewingArchivedSnapshot={isViewingArchivedSnapshot}
        onAddActivity={() => {
          setEditingActivity(null);
          setActivityModalOpen(true);
        }}
        onEditActivity={(act) => {
          setEditingActivity(act);
          setActivityModalOpen(true);
        }}
        onDeleteActivity={handleDeleteActivity}
      />

      <RkaVersionSummarySection
        versions={versions}
        selectedVersionNumber={selectedVersion?.nomor_versi}
        onSelectVersion={setSelectedVersionNum}
        onOpenHistory={() => setHistoryModalOpen(true)}
        isKaprodi={isKaprodi}
        tahunAnggaran={doc.tahun_anggaran}
        revisionModalOpen={revisionModalOpen}
        onCloseRevisionModal={() => setRevisionModalOpen(false)}
        onSubmitRevision={handleStartRevision}
      />

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
    </div>
  );
}
