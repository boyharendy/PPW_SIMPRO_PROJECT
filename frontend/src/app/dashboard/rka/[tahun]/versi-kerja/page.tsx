'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import BudgetTableEditor from '@/components/ui/BudgetTableEditor';
import { mockRkaDocuments } from '@/lib/mock-data';
import type { RkaActivity } from '@/lib/types';
import { ArrowLeft, Save, Send, AlertTriangle, Check } from 'lucide-react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/utils';

export default function RkaVersiKerjaPage() {
  const params = useParams();
  const router = useRouter();
  const tahun = Number(params.tahun) || 2025;

  const doc =
    mockRkaDocuments.find((d) => d.tahun_anggaran === tahun) || mockRkaDocuments[0];

  const [activities, setActivities] = useState<RkaActivity[]>(
    JSON.parse(JSON.stringify(doc.activities || []))
  );
  const [alasanRevisi, setAlasanRevisi] = useState(
    doc.versions?.find((v) => v.status === 'DRAF')?.alasan_revisi || 'Penyusunan penyesuaian pos anggaran prodi'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Total computation across all activities
  const totalAnggaran = activities.reduce((acc, act) => {
    const actTotal = act.budget_items.reduce((sum, item) => sum + (item.nominal_anggaran || 0), 0);
    return acc + actTotal;
  }, 0);

  const handleSaveDraft = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAjukan = () => {
    // Validate each activity has >= 1 pos
    const invalidAct = activities.find((a) => !a.budget_items || a.budget_items.length === 0);
    if (invalidAct) {
      alert(`Kegiatan "${invalidAct.nama_kegiatan}" wajib memiliki minimal 1 pos anggaran.`);
      return;
    }

    // Set active draft version to DIAJUKAN
    const draftVer = doc.versions?.find((v) => v.status === 'DRAF');
    if (draftVer) {
      draftVer.status = 'DIAJUKAN';
      draftVer.total_anggaran = totalAnggaran;
      draftVer.diajukan_at = new Date().toISOString();
      draftVer.diajukan_oleh = 'u-admin';
    }

    router.push(`/dashboard/rka/${doc.tahun_anggaran}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/rka/${doc.tahun_anggaran}`}
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Dokumen RKA {doc.tahun_anggaran}</span>
        </Link>
      </div>

      <PageHeader
        title={`Editor Versi Kerja RKA Tahun ${doc.tahun_anggaran}`}
        description="Kelola kegiatan dan rincian pos anggaran pada versi kerja sebelum diajukan ke Kaprodi."
        action={
          <div className="flex items-center gap-3">
            <div className="text-right mr-2 hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Anggaran Versi</span>
              <p className="text-base font-extrabold text-blue-700">{formatRupiah(totalAnggaran)}</p>
            </div>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Simpan Draf</span>
            </button>

            <button
              type="button"
              onClick={handleAjukan}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>Ajukan Versi ke Kaprodi</span>
            </button>
          </div>
        }
      />

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          <span>Draf versi kerja RKA berhasil disimpan!</span>
        </div>
      )}

      {/* Optimistic locking & Revision note */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Alasan Revisi & Penyesuaian Anggaran
          </span>
          <span className="text-[10px] font-mono text-slate-400">Row Version: 1</span>
        </div>

        <textarea
          rows={2}
          value={alasanRevisi}
          onChange={(e) => setAlasanRevisi(e.target.value)}
          placeholder="Tuliskan latar belakang revisi anggaran (misal: penyesuaian belanja hibah, akreditasi)..."
          className="textarea-field text-xs"
        />
      </div>

      {/* Hierarchical Two-Level Budget Table Editor */}
      <div className="space-y-4">
        <BudgetTableEditor activities={activities} onChange={setActivities} />
      </div>
    </div>
  );
}

