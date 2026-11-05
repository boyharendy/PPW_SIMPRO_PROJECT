'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Receipt, FileText, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatRupiah, formatDateShort } from '@/lib/utils';

interface RealisasiItem {
  id: string;
  tanggal: string;
  kodePos: string;
  namaPos: string;
  uraian: string;
  nominal: number;
  sumber: 'MANUAL' | 'PERJALANAN_DINAS';
  bukti: string;
}

const MOCK_REALISASI: RealisasiItem[] = [
  {
    id: 'rel-1',
    tanggal: '2025-03-12',
    kodePos: 'POS-04',
    namaPos: 'Perjalanan Dinas Konferensi & Seminar',
    uraian: 'Realisasi perjalanan dinas Semnas TIK Surabaya (Dr. Budi Santoso)',
    nominal: 5250000,
    sumber: 'PERJALANAN_DINAS',
    bukti: 'LPJ_PD_001_Surabaya.pdf',
  },
  {
    id: 'rel-2',
    tanggal: '2025-03-01',
    kodePos: 'POS-01-01',
    namaPos: 'Honorarium Pakar Eksternal Kurikulum',
    uraian: 'Pembayaran honor narasumber lokakarya kurikulum OBE',
    nominal: 6000000,
    sumber: 'MANUAL',
    bukti: 'Kuitansi_Honor_Narasumber.pdf',
  },
  {
    id: 'rel-3',
    tanggal: '2025-02-18',
    kodePos: 'POS-01-02',
    namaPos: 'Konsumsi Rapat Pleno Review Kurikulum',
    uraian: 'Konsumsi snack dan makan siang rapat dosen prodi',
    nominal: 1500000,
    sumber: 'MANUAL',
    bukti: 'Nota_Konsumsi_Rapat.pdf',
  },
  {
    id: 'rel-4',
    tanggal: '2025-02-05',
    kodePos: 'POS-03-02',
    namaPos: 'Pengadaan ATK & Modul Praktikum',
    uraian: 'Pembelian kertas, toner printer, dan modul lab semester genap',
    nominal: 3450000,
    sumber: 'MANUAL',
    bukti: 'Faktur_Penyedia_ATK.pdf',
  },
];

export default function Page() {
  const { tahun } = useParams<{ tahun: string }>();

  const [realisasiList, setRealisasiList] = useState<RealisasiItem[]>(MOCK_REALISASI);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [kodePos, setKodePos] = useState('POS-01-01');
  const [namaPos, setNamaPos] = useState('Honorarium Pakar Eksternal Kurikulum');
  const [uraian, setUraian] = useState('');
  const [nominal, setNominal] = useState(1000000);
  const [bukti, setBukti] = useState('');

  const totalRealisasi = realisasiList.reduce((s, r) => s + r.nominal, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uraian.trim()) return;

    const newItem: RealisasiItem = {
      id: `rel-${Date.now()}`,
      tanggal: new Date().toISOString().split('T')[0],
      kodePos,
      namaPos,
      uraian: uraian.trim(),
      nominal,
      sumber: 'MANUAL',
      bukti: bukti || 'Bukti_Pengeluaran.pdf',
    };

    setRealisasiList([newItem, ...realisasiList]);
    setUraian('');
    setNominal(1000000);
    setBukti('');
    setModalOpen(false);
  };

  const columns: DataTableColumn<RealisasiItem>[] = [
    {
      key: 'tanggal',
      header: 'Tanggal Realisasi',
      render: (r) => <span className="text-xs text-slate-600 font-medium">{formatDateShort(r.tanggal)}</span>,
    },
    {
      key: 'pos',
      header: 'Pos Anggaran RKA',
      render: (r) => (
        <div>
          <span className="font-mono text-[11px] font-bold text-slate-400 mr-1.5">{r.kodePos}</span>
          <span className="text-sm font-semibold text-slate-800">{r.namaPos}</span>
        </div>
      ),
    },
    {
      key: 'uraian',
      header: 'Uraian Pengeluaran',
      render: (r) => (
        <div>
          <div className="text-xs text-slate-700 line-clamp-1">{r.uraian}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Bukti: {r.bukti}</div>
        </div>
      ),
    },
    {
      key: 'sumber',
      header: 'Sumber Catat',
      render: (r) => (
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
            r.sumber === 'PERJALANAN_DINAS'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {r.sumber === 'PERJALANAN_DINAS' ? 'Perjalanan Dinas' : 'Manual'}
        </span>
      ),
    },
    {
      key: 'nominal',
      header: 'Nominal Realisasi',
      className: 'text-right',
      render: (r) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatRupiah(r.nominal)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/rka/${tahun || '2025'}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke RKA {tahun || '2025'}
        </Link>
      </div>

      <PageHeader
        title={`Realisasi Anggaran RKA ${tahun || '2025'}`}
        description="Pencatatan bukti pencairan dan realisasi belanja per mata anggaran (FR-41)."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} /> Catat Realisasi Baru
          </button>
        }
      />

      <div className="card p-4 flex justify-between items-center bg-slate-50 border border-slate-200">
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase block">Total Realisasi Terbukukan</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{formatRupiah(totalRealisasi)}</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {realisasiList.length} transaksi realisasi
        </span>
      </div>

      <div className="card">
        <DataTable columns={columns} data={realisasiList} emptyMessage="Belum ada transaksi realisasi anggaran." />
      </div>

      {/* Modal Catat Realisasi */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Catat Realisasi Anggaran Baru"
        size="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Pos Anggaran</label>
            <select
              value={kodePos}
              onChange={(e) => {
                setKodePos(e.target.value);
                setNamaPos(e.target.options[e.target.selectedIndex].text);
              }}
              className="select-field text-xs"
            >
              <option value="POS-01-01">POS-01-01 — Honorarium Pakar Eksternal Kurikulum</option>
              <option value="POS-01-02">POS-01-02 — Konsumsi Rapat Pleno Review Kurikulum</option>
              <option value="POS-02-01">POS-02-01 — Pengadaan Server Rak Komputasi Awan</option>
              <option value="POS-03-02">POS-03-02 — Pengadaan ATK & Modul Praktikum</option>
              <option value="POS-04">POS-04 — Perjalanan Dinas Konferensi & Seminar</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nominal Realisasi (Rp)</label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={nominal}
              onChange={(e) => setNominal(Number(e.target.value))}
              className="input-field text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Uraian / Keterangan Belanja</label>
            <textarea
              rows={2}
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Contoh: Pembayaran invoice narasumber lokakarya..."
              className="input-field resize-none text-xs"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Berkas Bukti Kuitansi/Faktur</label>
            <input
              type="text"
              value={bukti}
              onChange={(e) => setBukti(e.target.value)}
              placeholder="Contoh: Kuitansi_Honor_01.pdf"
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs px-4 py-2">
              Simpan Realisasi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
