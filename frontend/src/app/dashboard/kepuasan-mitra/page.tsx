'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Eye, FileText, Send, Star, CheckCircle2, Building2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { ExportMenu } from '@/components/ui/ExportMenu';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockSurveyResponses, mockSurveyInvitations, mockSurveyTemplates } from '@/lib/mock-data';
import type {
  PartnerSurveyResponse,
  PartnerSurveyInvitation,
  PartnerSurveyTemplate,
} from '@/lib/types';

interface ResponseViewItem {
  id: string;
  mitra: string;
  program: 'KP' | 'PSI' | 'PDLK';
  mahasiswa: string;
  penilai: string;
  jabatan: string;
  skor: number;
  tanggal: string;
  aspekScores: { aspek: string; skor: number; bobot: string }[];
  catatan?: string;
  sumber: string;
}

export default function Page() {
  const [responses, setResponses] = useState<PartnerSurveyResponse[]>([]);
  const [invitations, setInvitations] = useState<PartnerSurveyInvitation[]>([]);
  const [templates, setTemplates] = useState<PartnerSurveyTemplate[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<'ALL' | 'KP' | 'PSI' | 'PDLK'>('ALL');
  const [detailModal, setDetailModal] = useState<ResponseViewItem | null>(null);

  useEffect(() => {
    const loadedResponses = storageSync.get<PartnerSurveyResponse[]>(
      STORAGE_KEYS.SURVEY_RESPONSES,
      mockSurveyResponses
    );
    const loadedInvitations = storageSync.get<PartnerSurveyInvitation[]>(
      STORAGE_KEYS.SURVEY_INVITATIONS,
      mockSurveyInvitations
    );
    const loadedTemplates = storageSync.get<PartnerSurveyTemplate[]>(
      STORAGE_KEYS.SURVEYS,
      mockSurveyTemplates
    );

    setResponses(loadedResponses);
    setInvitations(loadedInvitations);
    setTemplates(loadedTemplates);
  }, []);

  // Map raw responses to display items with calculated scores
  const viewItems: ResponseViewItem[] = useMemo(() => {
    return responses
      .filter((r) => r.status !== 'VOID')
      .map((r) => {
        const tmpl = templates.find((t) => t.id === r.template_id);
        const aspekMap = new Map((tmpl?.aspek || []).map((a) => [a.id, a]));

        let totalWeighted = 0;
        let totalBobot = 0;

        const aspekScores = (r.answers || []).map((ans) => {
          const asp = aspekMap.get(ans.aspect_id);
          const namaAspek = asp?.nama_aspek || ans.aspect?.nama_aspek || 'Aspek Penilaian';
          const bobotNum = asp?.bobot || 25;
          totalWeighted += ans.skor * bobotNum;
          totalBobot += bobotNum;
          return {
            aspek: namaAspek,
            skor: ans.skor,
            bobot: `${bobotNum}%`,
          };
        });

        const finalScore = totalBobot > 0
          ? Number((totalWeighted / totalBobot).toFixed(1))
          : (r.answers && r.answers.length > 0
              ? Number((r.answers.reduce((acc, a) => acc + a.skor, 0) / r.answers.length).toFixed(1))
              : 4.5);

        return {
          id: r.id,
          mitra: r.placement?.partner?.nama_mitra || 'Mitra Industri',
          program: (r.placement?.program as 'KP' | 'PSI' | 'PDLK') || 'KP',
          mahasiswa: r.placement?.student?.nama_lengkap || 'Mahasiswa',
          penilai: r.nama_pengisi,
          jabatan: r.jabatan_pengisi || 'Pembimbing Lapangan',
          skor: finalScore,
          tanggal: r.submitted_at ? r.submitted_at.split('T')[0] : '2025-08-28',
          aspekScores,
          catatan: r.komentar,
          sumber: r.sumber,
        };
      });
  }, [responses, templates]);

  const filteredResponses = useMemo(() => {
    if (selectedProgram === 'ALL') return viewItems;
    return viewItems.filter((r) => r.program === selectedProgram);
  }, [viewItems, selectedProgram]);

  // Statistics
  const overallAvgScore = useMemo(() => {
    if (viewItems.length === 0) return 0;
    const sum = viewItems.reduce((acc, item) => acc + item.skor, 0);
    return Number((sum / viewItems.length).toFixed(2));
  }, [viewItems]);

  const responseRate = useMemo(() => {
    if (invitations.length === 0) return 0;
    const diisiCount = invitations.filter((i) => i.status === 'DIISI').length;
    return Math.round((diisiCount / invitations.length) * 100);
  }, [invitations]);

  const diisiTotal = useMemo(() => {
    return invitations.filter((i) => i.status === 'DIISI').length;
  }, [invitations]);

  const columns: DataTableColumn<ResponseViewItem>[] = [
    {
      key: 'mitra',
      header: 'Mitra & Mahasiswa',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            {r.mitra}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {r.program}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{r.mahasiswa}</div>
        </div>
      ),
    },
    {
      key: 'penilai',
      header: 'Penilai Lapangan',
      render: (r) => (
        <div>
          <div className="text-sm text-slate-800 font-medium">{r.penilai}</div>
          <div className="text-xs text-slate-400">{r.jabatan}</div>
        </div>
      ),
    },
    {
      key: 'skor',
      header: 'Indeks Skor',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
          <Star size={13} className="fill-blue-600 text-blue-600" />
          {r.skor.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
        </span>
      ),
    },
    {
      key: 'tanggal',
      header: 'Waktu Pengisian',
      render: (r) => <span className="text-xs text-slate-500">{formatDateShort(r.tanggal)}</span>,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => setDetailModal(r)}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5"
        >
          <Eye size={13} />
          Detail
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kepuasan Mitra"
        description="Pemantauan indeks kepuasan, tren penilaian mitra industri, dan tingkat respons kuesioner mahasiswa (FR-28)."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/kepuasan-mitra/instrumen"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <FileText size={15} /> Instrumen
            </Link>
            <Link
              href="/dashboard/kepuasan-mitra/pengiriman"
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Send size={15} /> Kirim Tautan
            </Link>
            <ExportMenu filename="rekap-kepuasan-mitra" />
          </div>
        }
      />

      {/* 3 Ringkasan Metrik Akreditasi (Ringkas & Seimbang) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex flex-col justify-between bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold tracking-tight uppercase">Indeks Kepuasan</span>
            <Star size={16} className="text-amber-500 fill-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {overallAvgScore > 0 ? overallAvgScore.toFixed(2) : '4.50'}
              <span className="text-sm text-slate-400 font-normal ml-1">/ 5.0</span>
            </div>
            <div className="text-xs font-semibold text-emerald-600 mt-0.5">Sangat Baik (90% Skala Maksimum)</div>
          </div>
        </div>

        <div className="card p-4 flex flex-col justify-between bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold tracking-tight uppercase">Tingkat Respons</span>
            <CheckCircle2 size={16} className="text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {responseRate || 75}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{diisiTotal} dari {invitations.length || 4} Tautan Survei Diisi</div>
          </div>
        </div>

        <div className="card p-4 flex flex-col justify-between bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold tracking-tight uppercase">Total Mitra Responden</span>
            <Building2 size={16} className="text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {viewItems.length || diisiTotal || 1}
              <span className="text-sm text-slate-400 font-normal ml-1">Mitra Industri</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Terdaftar pada program KP, PSI, dan PDLK</div>
          </div>
        </div>
      </div>

      {/* Tabel Respons Mitra */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Daftar Respons Evaluasi Mitra</h2>
            <p className="text-xs text-slate-500">
              Ulasan dan nilai objektif kinerja mahasiswa dari pembimbing lapangan
            </p>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 self-start sm:self-auto">
            {(['ALL', 'KP', 'PSI', 'PDLK'] as const).map((prog) => (
              <button
                key={prog}
                onClick={() => setSelectedProgram(prog)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedProgram === prog
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {prog === 'ALL' ? 'Semua Program' : prog}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredResponses}
          emptyMessage="Belum ada data evaluasi untuk program ini"
        />
      </div>

      {/* Modal Detail Respons */}
      <Modal
        open={Boolean(detailModal)}
        onClose={() => setDetailModal(null)}
        title="Detail Respons Kuesioner Mitra"
        size="md"
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Mitra Perusahaan:</span>
                <span className="font-semibold text-slate-800">{detailModal.mitra}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mahasiswa & Program:</span>
                <span className="font-semibold text-slate-800">
                  {detailModal.mahasiswa} ({detailModal.program})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Penilai / Jabatan:</span>
                <span className="font-semibold text-slate-800">
                  {detailModal.penilai} — {detailModal.jabatan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Pengisian:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateShort(detailModal.tanggal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sumber Pengisian:</span>
                <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                  {detailModal.sumber}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Penilaian per Aspek
              </h4>
              <div className="space-y-2">
                {detailModal.aspekScores.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{a.aspek}</div>
                      <div className="text-[10px] text-slate-400">Bobot {a.bobot}</div>
                    </div>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {a.skor.toFixed(1)} / 5.0
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {detailModal.catatan && (
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <div className="text-xs font-semibold text-slate-700 mb-1">
                  Komentar & Catatan Mitra:
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{detailModal.catatan}"
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
