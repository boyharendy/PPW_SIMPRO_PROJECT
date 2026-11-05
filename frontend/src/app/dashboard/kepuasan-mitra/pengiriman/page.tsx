'use client';

import React, { useState } from 'react';
import { Send, MessageSquare, Copy, Check, Edit3, Link2, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { copyToClipboard } from '@/lib/utils';

interface PlacementItem {
  id: string;
  mitra: string;
  pic: string;
  telepon: string;
  program: 'KP' | 'PSI' | 'PDLK';
  mahasiswa: string;
  nim: string;
  instrumentName: string;
  status: 'DIBUAT' | 'TERKIRIM' | 'DIISI' | 'KEDALUWARSA';
  token: string;
  terakhirKirim?: string;
}

const INITIAL_PLACEMENTS: PlacementItem[] = [
  {
    id: 'plc-1',
    mitra: 'PT Telkom Indonesia (Persero) Tbk',
    pic: 'Budi Rahardjo',
    telepon: '6281234567890',
    program: 'KP',
    mahasiswa: 'Muhammad Rizky Pratama',
    nim: '1201220001',
    instrumentName: 'Instrumen Kepuasan Mitra Kerja Praktik 2025/2026',
    status: 'DIISI',
    token: 'tk_telkom_kp_9821',
    terakhirKirim: '2025-08-25',
  },
  {
    id: 'plc-2',
    mitra: 'PT Astra International Tbk',
    pic: 'Linda Setiawan',
    telepon: '6281398765432',
    program: 'PSI',
    mahasiswa: 'Anisa Putri Maharani',
    nim: '1201220042',
    instrumentName: 'Instrumen Evaluasi Mitra Proyek Sistem Informasi (PSI)',
    status: 'TERKIRIM',
    token: 'tk_astra_psi_4412',
    terakhirKirim: '2025-10-01',
  },
  {
    id: 'plc-3',
    mitra: 'PT Bank Mandiri (Persero) Tbk - IT Center',
    pic: 'Farhan Maulana',
    telepon: '6281122334455',
    program: 'PDLK',
    mahasiswa: 'Muhammad Rizky Pratama',
    nim: '1201220001',
    instrumentName: 'Instrumen Pembimbing Mitra Pembelajaran di Luar Kampus',
    status: 'DIBUAT',
    token: 'tk_mandiri_pdlk_7719',
  },
  {
    id: 'plc-4',
    mitra: 'PT GoTo Gojek Tokopedia Tbk',
    pic: 'Arya Pratama',
    telepon: '6281987654321',
    program: 'KP',
    mahasiswa: 'Bambang Sudarsono',
    nim: '1201220019',
    instrumentName: 'Instrumen Kepuasan Mitra Kerja Praktik 2025/2026',
    status: 'KEDALUWARSA',
    token: 'tk_goto_kp_1102',
    terakhirKirim: '2025-07-10',
  },
];

export default function Page() {
  const [placements, setPlacements] = useState<PlacementItem[]>(INITIAL_PLACEMENTS);
  const [filterProgram, setFilterProgram] = useState<'ALL' | 'KP' | 'PSI' | 'PDLK'>('ALL');
  const [activeModal, setActiveModal] = useState<{ type: 'LINK' | 'MANUAL'; item: PlacementItem } | null>(null);
  const [copied, setCopied] = useState(false);

  // Manual input form states
  const [manualPenilai, setManualPenilai] = useState('');
  const [manualJabatan, setManualJabatan] = useState('');
  const [manualScores, setManualScores] = useState<Record<string, number>>({
    aspek1: 5,
    aspek2: 4,
    aspek3: 5,
    aspek4: 4,
  });
  const [manualCatatan, setManualCatatan] = useState('');

  const filtered = filterProgram === 'ALL'
    ? placements
    : placements.filter((p) => p.program === filterProgram);

  const handleSendLink = (item: PlacementItem) => {
    setPlacements(
      placements.map((p) =>
        p.id === item.id
          ? { ...p, status: 'TERKIRIM', terakhirKirim: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    setActiveModal({ type: 'LINK', item });
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/mitra/isi/${token}`;
    copyToClipboard(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (item: PlacementItem) => {
    const link = `${window.location.origin}/mitra/isi/${item.token}`;
    const text = encodeURIComponent(
      `Yth. Bapak/Ibu ${item.pic} (${item.mitra}),\n\n` +
      `Sehubungan dengan berakhirnya program ${item.program} mahasiswa kami (${item.mahasiswa}), kami memohon kesediaan Bapak/Ibu mengisi evaluasi kepuasan mitra pada tautan berikut:\n${link}\n\n` +
      `Pengisian membutuhkan waktu <3 menit. Terima kasih atas kerjasama yang baik.\n\n— Program Studi Sistem Informasi`
    );
    window.open(`https://wa.me/${item.telepon}?text=${text}`, '_blank');
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    setPlacements(
      placements.map((p) =>
        p.id === activeModal.item.id
          ? { ...p, status: 'DIISI', terakhirKirim: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    setActiveModal(null);
  };

  const columns: DataTableColumn<PlacementItem>[] = [
    {
      key: 'mitra',
      header: 'Mitra & Program',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            {r.mitra}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {r.program}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">PIC: {r.pic} • {r.telepon}</div>
        </div>
      ),
    },
    {
      key: 'mahasiswa',
      header: 'Mahasiswa Penempatan',
      render: (r) => (
        <div>
          <div className="text-sm font-medium text-slate-800">{r.mahasiswa}</div>
          <div className="text-xs text-slate-400">NIM: {r.nim}</div>
        </div>
      ),
    },
    {
      key: 'instrumentName',
      header: 'Instrumen',
      render: (r) => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-[200px]" title={r.instrumentName}>
          {r.instrumentName}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Survei',
      render: (r) => (
        <div>
          <StatusBadge status={r.status} size="sm" />
          {r.terakhirKirim && (
            <div className="text-[10px] text-slate-400 mt-0.5">Kirim: {r.terakhirKirim}</div>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi Pengiriman & Pengisian',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status === 'DIISI' ? (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-flex items-center gap-1">
              <Check size={12} /> Kuesioner Selesai
            </span>
          ) : (
            <>
              <button
                onClick={() => handleSendLink(r)}
                className="btn-primary text-xs px-2.5 py-1 inline-flex items-center gap-1"
                title="Dapatkan tautan unik kuesioner"
              >
                <Send size={12} /> {r.status === 'TERKIRIM' ? 'Kirim Ulang' : 'Kirim Tautan'}
              </button>
              <button
                onClick={() => handleWhatsApp(r)}
                className="btn-secondary text-xs px-2 py-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 inline-flex items-center gap-1"
                title="Bagikan pesan ke WhatsApp mitra"
              >
                <MessageSquare size={12} /> WA
              </button>
              <button
                onClick={() => {
                  setManualPenilai(r.pic);
                  setManualJabatan('Pembimbing Lapangan');
                  setActiveModal({ type: 'MANUAL', item: r });
                }}
                className="btn-secondary text-xs px-2 py-1 inline-flex items-center gap-1"
                title="Input kuesioner manual jika mitra mengisi via form cetak"
              >
                <Edit3 size={12} /> Manual
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengiriman & Input Mitra"
        description="Kirim tautan kuesioner ke mitra via email/WhatsApp atau catat hasil evaluasi secara manual (FR-27)."
      />

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {(['ALL', 'KP', 'PSI', 'PDLK'] as const).map((prog) => (
              <button
                key={prog}
                onClick={() => setFilterProgram(prog)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterProgram === prog
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {prog === 'ALL' ? 'Semua Program' : prog}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Menampilkan {filtered.length} penempatan mitra
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Tidak ada penempatan mitra untuk filter ini."
        />
      </div>

      {/* Modal Tautan Terkirim / Bagikan */}
      <Modal
        open={activeModal?.type === 'LINK'}
        onClose={() => setActiveModal(null)}
        title="Tautan Survei Mitra Siap Dikirim"
        size="md"
      >
        {activeModal && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800 leading-relaxed">
              Tautan survei unik untuk <strong>{activeModal.item.mitra}</strong> (mahasiswa: {activeModal.item.mahasiswa}) telah dibuat. Tautan ini berlaku selama 30 hari dan dapat diisi tanpa perlu login.
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tautan Unik Kuesioner:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/mitra/isi/${activeModal.item.token}` : ''}
                  className="input-field font-mono text-xs text-slate-600 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(activeModal.item.token)}
                  className="btn-primary text-xs px-3 py-2.5 shrink-0 flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleWhatsApp(activeModal.item)}
                className="btn-secondary text-xs px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
              >
                <MessageSquare size={14} /> Bagikan via WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-primary text-xs px-4 py-2"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Input Manual */}
      <Modal
        open={activeModal?.type === 'MANUAL'}
        onClose={() => setActiveModal(null)}
        title="Input Hasil Evaluasi Mitra Manual"
        size="lg"
      >
        {activeModal && (
          <form onSubmit={handleSaveManual} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 grid grid-cols-2 gap-2">
              <div><strong>Mitra:</strong> {activeModal.item.mitra}</div>
              <div><strong>Program:</strong> {activeModal.item.program}</div>
              <div><strong>Mahasiswa:</strong> {activeModal.item.mahasiswa} ({activeModal.item.nim})</div>
              <div><strong>Sumber Input:</strong> INPUT_KOORDINATOR</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Pengisi Mitra</label>
                <input
                  type="text"
                  value={manualPenilai}
                  onChange={(e) => setManualPenilai(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Jabatan Pengisi</label>
                <input
                  type="text"
                  value={manualJabatan}
                  onChange={(e) => setManualJabatan(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Skor Penilaian per Aspek (Skala 1 - 5)
              </label>
              <div className="space-y-2.5">
                {[
                  { key: 'aspek1', label: '1. Integritas & Etika Profesional (Bobot 25%)' },
                  { key: 'aspek2', label: '2. Kompetensi Teknis Sistem Informasi (Bobot 35%)' },
                  { key: 'aspek3', label: '3. Komunikasi & Kerjasama Tim (Bobot 20%)' },
                  { key: 'aspek4', label: '4. Koordinasi dengan Program Studi (Bobot 20%)' },
                ].map((a) => (
                  <div key={a.key} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                    <span className="text-xs font-medium text-slate-800">{a.label}</span>
                    <select
                      value={manualScores[a.key]}
                      onChange={(e) =>
                        setManualScores({ ...manualScores, [a.key]: Number(e.target.value) })
                      }
                      className="select-field w-24 text-xs font-bold text-blue-700"
                    >
                      <option value={5}>5 - Sangat Baik</option>
                      <option value={4}>4 - Baik</option>
                      <option value={3}>3 - Cukup</option>
                      <option value={2}>2 - Kurang</option>
                      <option value={1}>1 - Sangat Kurang</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan / Komentar Mitra</label>
              <textarea
                rows={2}
                value={manualCatatan}
                onChange={(e) => setManualCatatan(e.target.value)}
                placeholder="Masukkan catatan penilaian jika ada..."
                className="input-field resize-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary text-xs px-4 py-2"
              >
                Simpan Hasil Evaluasi
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
