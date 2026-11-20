'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Eye, AlertCircle, Lock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { rkaService } from '@/lib/api';
import { useUser } from '@/lib/context';
import type { RkaDocument } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';

export default function Page() {
  const router = useRouter();
  const { user, currentRole } = useUser();
  const isKaprodi = currentRole === 'KAPRODI';

  const [docs, setDocs] = useState<RkaDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tahunBaru, setTahunBaru] = useState(String(new Date().getFullYear() + 1));
  const [judulBaru, setJudulBaru] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await rkaService.getRkaList();
      if (res.data) setDocs(res.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleOpenCreateModal = () => {
    const nextYear = new Date().getFullYear() + 1;
    setTahunBaru(String(nextYear));
    setJudulBaru(`RKA Program Studi Informatika TA ${nextYear}`);
    setFormError(null);
    setShowModal(true);
  };

  const handleCreateRka = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKaprodi) return;
    setFormError(null);

    const tahunNum = Number(tahunBaru);
    if (!tahunNum || tahunNum < 2020 || tahunNum > 2100) {
      setFormError('Masukkan tahun anggaran yang valid (2020–2100).');
      return;
    }
    if (!judulBaru.trim()) {
      setFormError('Judul dokumen RKA wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await rkaService.createRka({
        tahun_anggaran: tahunNum,
        judul: judulBaru.trim(),
        dibuat_oleh: user.id,
        actorName: user.name,
      });
      if (!res.success) {
        setFormError(res.message);
        return;
      }
      setShowModal(false);
      await loadData();
      router.push(`/dashboard/rka/${tahunNum}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<RkaDocument>[] = [
    {
      key: 'tahun_anggaran',
      header: 'Tahun Anggaran',
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.tahun_anggaran}</span>
      ),
    },
    {
      key: 'judul',
      header: 'Judul',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-blue-500 shrink-0" />
          <div>
            <span className="text-sm text-slate-700 font-medium block">{row.judul}</span>
            <span className="text-[11px] text-slate-400">
              {(row.activities || []).length} Butir Kegiatan
              {row.total_realisasi ? ` • Serapan ${row.persentase_serapan ?? 0}%` : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'total_anggaran',
      header: 'Total Pagu (Otomatis)',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block">
            {formatRupiah(row.total_anggaran)}
          </span>
          <span className="text-[10px] text-slate-400">Kalkulasi otomatis pos</span>
        </div>
      ),
    },
    {
      key: 'versi_aktif',
      header: 'Versi Aktif',
      render: (row) => {
        const activeVer =
          (row.versions || []).find((v) => v.id === row.versi_aktif_id) ||
          (row.versions || []).find((v) => v.status === 'DISETUJUI') ||
          (row.versions || [])[0];
        const workingVer = (row.versions || []).find(
          (v) => v.status === 'DRAF' && v.id !== activeVer?.id
        );
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              v{activeVer?.nomor_versi ?? 1}
            </span>
            {workingVer && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Revisi v{workingVer.nomor_versi} (Draf)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => router.push(`/dashboard/rka/${row.tahun_anggaran}`)}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5"
        >
          <Eye size={13} /> Detail
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rencana Kerja & Anggaran (RKA)"
        description="Kelola rencana kerja dan anggaran program studi per tahun anggaran. Total pagu dihitung otomatis dari rincian pos anggaran kegiatan."
        actions={
          isKaprodi ? (
            <button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus size={16} /> Buat RKA Tahun Baru
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
              <Lock size={13} /> Mode Lihat (Admin Prodi)
            </span>
          )
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Memuat daftar dokumen RKA...</div>
        ) : (
          <DataTable columns={columns} data={docs} emptyMessage="Belum ada dokumen RKA" />
        )}
      </div>

      {isKaprodi && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Buat RKA Tahun Baru (Draf)"
        >
          <form onSubmit={handleCreateRka} className="space-y-4">
            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-800 leading-relaxed">
              Dokumen RKA baru akan dibuat dengan status <strong>Draf (v1)</strong> dan Total Pagu awal Rp 0.
              Setelah disimpan, lengkapi Daftar Butir Kegiatan &amp; Pos Anggaran di halaman Detail RKA sebelum disahkan.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tahun Anggaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={2020}
                max={2100}
                value={tahunBaru}
                onChange={(e) => {
                  const val = e.target.value;
                  setTahunBaru(val);
                  if (!judulBaru || judulBaru.startsWith('RKA Program Studi Informatika TA ')) {
                    setJudulBaru(`RKA Program Studi Informatika TA ${val}`);
                  }
                }}
                placeholder="Contoh: 2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Judul RKA <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={judulBaru}
                onChange={(e) => setJudulBaru(e.target.value)}
                placeholder="Contoh: RKA Program Studi Informatika TA 2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Buat Draf & Susun Kegiatan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
