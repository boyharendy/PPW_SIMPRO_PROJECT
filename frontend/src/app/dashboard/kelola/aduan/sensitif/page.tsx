'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Lock, ArrowRight, CheckCircle2, Send, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';

interface SensitiveComplaint {
  id: string;
  nomor: string;
  tanggal: string;
  judulSamaran: string;
  uraian: string;
  status: 'DITERIMA' | 'DIVERIFIKASI' | 'DITINDAKLANJUTI' | 'SELESAI';
  satgasRef?: string;
  satgasTgl?: string;
  tenggat: string;
}

const MOCK_SENSITIVE: SensitiveComplaint[] = [
  {
    id: 'sen-01',
    nomor: 'ADU-2025-0019',
    tanggal: '2025-10-20',
    judulSamaran: 'Laporan dugaan pelecehan verbal di lingkungan kegiatan ormawa',
    uraian: 'Pelapor menyampaikan dugaan komentar tidak pantas secara berulang dalam grup koordinasi kepanitiaan.',
    status: 'DITINDAKLANJUTI',
    satgasRef: 'PPKPT/REG/2025/X/042',
    satgasTgl: '2025-10-22',
    tenggat: '2025-10-28',
  },
  {
    id: 'sen-02',
    nomor: 'ADU-2025-0027',
    tanggal: '2025-10-26',
    judulSamaran: 'Laporan intimidasi relasi kuasa kegiatan praktikum',
    uraian: 'Pelapor merasa diancam nilai praktikum jika tidak mengikuti kegiatan di luar jam akademik.',
    status: 'DIVERIFIKASI',
    tenggat: '2025-10-31',
  },
];

export default function Page() {
  const [items, setItems] = useState<SensitiveComplaint[]>(MOCK_SENSITIVE);
  const [activeCase, setActiveCase] = useState<SensitiveComplaint | null>(null);
  const [satgasRefInput, setSatgasRefInput] = useState('');

  const handleForwardSatgas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !satgasRefInput.trim()) return;

    setItems(
      items.map((it) =>
        it.id === activeCase.id
          ? {
              ...it,
              status: 'DITINDAKLANJUTI',
              satgasRef: satgasRefInput.trim(),
              satgasTgl: new Date().toISOString().split('T')[0],
            }
          : it
      )
    );
    setActiveCase(null);
  };

  const columns: DataTableColumn<SensitiveComplaint>[] = [
    {
      key: 'nomor',
      header: 'Nomor Tiket & Tanggal',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800">{r.nomor}</span>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatDateShort(r.tanggal)}</div>
        </div>
      ),
    },
    {
      key: 'judul',
      header: 'Pokok Pengaduan Sensitif',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm line-clamp-1">{r.judulSamaran}</div>
          <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
            Kategori Kekerasan / Perundungan (PGL-K)
          </span>
        </div>
      ),
    },
    {
      key: 'satgas',
      header: 'Penerusan Satgas PPKPT',
      render: (r) => (
        <div>
          {r.satgasRef ? (
            <div className="text-xs">
              <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {r.satgasRef}
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">Diteruskan: {formatDateShort(r.satgasTgl)}</div>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Belum Diteruskan</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status Penanganan',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => {
            setActiveCase(r);
            setSatgasRefInput(r.satgasRef || '');
          }}
          className="btn-primary text-xs px-2.5 py-1 inline-flex items-center gap-1"
        >
          <Lock size={12} /> Tangani
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aduan Sensitif & Kekerasan"
        description="Kanal khusus penanganan aduan sensitif dan kekerasan seksual/perundungan dengan hak akses terbatas (FR-50)."
      />

      {/* Warning Box PGL-K Protocol */}
      <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert size={20} />
        </div>
        <div className="space-y-1 text-xs text-rose-950 leading-relaxed">
          <h3 className="font-bold text-sm text-rose-900">
            Kanal Terbatas: Protokol Penanganan Pengelola Khusus (PGL-K)
          </h3>
          <p>
            Hanya Pengelola Aduan dengan mandat penanganan kekerasan (PGL-K) yang memiliki wewenang membaca isi aduan pada kanal ini.
            Pimpinan program studi hanya melihat nomor tiket tanpa dapat mengakses rincian kasus.
          </p>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={items}
          emptyMessage="Tidak ada aduan sensitif yang tercatat saat ini."
        />
      </div>

      {/* Modal Tangani Kasus Sensitif */}
      <Modal
        open={Boolean(activeCase)}
        onClose={() => setActiveCase(null)}
        title="Penanganan Aduan Sensitif (PGL-K)"
        size="md"
      >
        {activeCase && (
          <form onSubmit={handleForwardSatgas} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-rose-950 space-y-1">
              <div><strong>Nomor Tiket:</strong> {activeCase.nomor}</div>
              <div><strong>Tanggal Masuk:</strong> {formatDateShort(activeCase.tanggal)}</div>
              <div><strong>Status:</strong> {activeCase.status}</div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Uraian Aduan:</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                {activeCase.uraian}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Penerusan ke Satgas PPKPT Perguruan Tinggi (FR-50)
              </label>
              <p className="text-xs text-slate-500">
                Penerusan dokumen fisik/berkas rahasia dilakukan di luar sistem. Catat nomor referensi registrasi dari Satgas PPKPT di bawah ini:
              </p>
              <input
                type="text"
                value={satgasRefInput}
                onChange={(e) => setSatgasRefInput(e.target.value)}
                placeholder="Contoh: PPKPT/REG/2025/X/042"
                className="input-field text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveCase(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Tutup
              </button>
              <button type="submit" className="btn-primary text-xs px-4 py-2">
                Simpan Catatan Satgas
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
