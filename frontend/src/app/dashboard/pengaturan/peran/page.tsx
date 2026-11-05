'use client';

import React, { useState } from 'react';
import { Plus, UserCheck, ShieldAlert, Trash2, Shield, Award } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';

interface PengelolaAduan {
  id: string;
  nama: string;
  nidn: string;
  penangananKekerasan: boolean;
  berlakuDari: string;
}

interface VerifikatorPublikasi {
  id: string;
  nama: string;
  nidn: string;
  bidang: string;
  berlakuDari: string;
}

const INITIAL_PENGELOLA: PengelolaAduan[] = [
  {
    id: 'p-1',
    nama: 'Dr. Rina Fitriani, M.Kom.',
    nidn: '0412088501',
    penangananKekerasan: true,
    berlakuDari: '2025-01-01',
  },
  {
    id: 'p-2',
    nama: 'Agus Prasetyo, M.T.',
    nidn: '0420058802',
    penangananKekerasan: false,
    berlakuDari: '2025-01-01',
  },
];

const INITIAL_VERIFIKATOR: VerifikatorPublikasi[] = [
  {
    id: 'v-1',
    nama: 'Ir. Bambang Tri, Ph.D.',
    nidn: '0403067801',
    bidang: 'Rekayasa Perangkat Lunak & Sistem Informasi',
    berlakuDari: '2025-01-01',
  },
  {
    id: 'v-2',
    nama: 'Dr. Budi Santoso, M.Kom.',
    nidn: '0415108003',
    bidang: 'Jaringan Komputer & Keamanan Siber',
    berlakuDari: '2025-01-01',
  },
];

export default function Page() {
  const [pengelola, setPengelola] = useState<PengelolaAduan[]>(INITIAL_PENGELOLA);
  const [verifikator, setVerifikator] = useState<VerifikatorPublikasi[]>(INITIAL_VERIFIKATOR);

  // Modals
  const [modalPengelola, setModalPengelola] = useState(false);
  const [modalVerifikator, setModalVerifikator] = useState(false);

  // Form pengelola
  const [namaPengelola, setNamaPengelola] = useState('');
  const [nidnPengelola, setNidnPengelola] = useState('');
  const [penangananKekerasan, setPenangananKekerasan] = useState(false);

  // Form verifikator
  const [namaVerif, setNamaVerif] = useState('');
  const [nidnVerif, setNidnVerif] = useState('');
  const [bidangVerif, setBidangVerif] = useState('');

  const handleAddPengelola = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPengelola.trim()) return;

    setPengelola([
      ...pengelola,
      {
        id: `p-${Date.now()}`,
        nama: namaPengelola.trim(),
        nidn: nidnPengelola.trim(),
        penangananKekerasan,
        berlakuDari: new Date().toISOString().split('T')[0],
      },
    ]);
    setNamaPengelola('');
    setNidnPengelola('');
    setPenangananKekerasan(false);
    setModalPengelola(false);
  };

  const handleAddVerifikator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaVerif.trim()) return;

    setVerifikator([
      ...verifikator,
      {
        id: `v-${Date.now()}`,
        nama: namaVerif.trim(),
        nidn: nidnVerif.trim(),
        bidang: bidangVerif.trim(),
        berlakuDari: new Date().toISOString().split('T')[0],
      },
    ]);
    setNamaVerif('');
    setNidnVerif('');
    setBidangVerif('');
    setModalVerifikator(false);
  };

  const pengelolaColumns: DataTableColumn<PengelolaAduan>[] = [
    {
      key: 'nama',
      header: 'Nama Dosen / Pejabat Penugasan',
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm">{r.nama}</span>
          <div className="text-xs text-slate-400">NIDN: {r.nidn}</div>
        </div>
      ),
    },
    {
      key: 'pglk',
      header: 'Penetapan Mandat Kekerasan (PGL-K)',
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            r.penangananKekerasan
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {r.penangananKekerasan ? 'Mandat PGL-K Aktif' : 'Pengelola Umum'}
        </span>
      ),
    },
    {
      key: 'berlaku',
      header: 'Berlaku Mulai',
      render: (r) => <span className="text-xs text-slate-600">{formatDateShort(r.berlakuDari)}</span>,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => setPengelola(pengelola.filter((p) => p.id !== r.id))}
          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
          title="Cabut Penugasan"
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  const verifikatorColumns: DataTableColumn<VerifikatorPublikasi>[] = [
    {
      key: 'nama',
      header: 'Nama Dosen Verifikator',
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm">{r.nama}</span>
          <div className="text-xs text-slate-400">NIDN: {r.nidn}</div>
        </div>
      ),
    },
    {
      key: 'bidang',
      header: 'Bidang Keahlian / Rumpun',
      render: (r) => <span className="text-xs text-slate-700 font-medium">{r.bidang}</span>,
    },
    {
      key: 'berlaku',
      header: 'Berlaku Mulai',
      render: (r) => <span className="text-xs text-slate-600">{formatDateShort(r.berlakuDari)}</span>,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => setVerifikator(verifikator.filter((v) => v.id !== r.id))}
          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
          title="Cabut Penugasan"
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Peran & Penugasan"
        description="Penugasan peran operasional, dosen verifikator, koordinator, dan tim gugus kendali mutu prodi."
      />

      {/* Bagian 1: Pengelola Aduan */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={16} className="text-blue-600" /> Penugasan Pengelola Layanan Aduan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pengelola yang ditunjuk menangani telaah awal, disposisi tiket, dan kanal sensitif kekerasan (PGL-K).
            </p>
          </div>
          <button
            onClick={() => setModalPengelola(true)}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={14} /> Tunjuk Pengelola
          </button>
        </div>

        <DataTable columns={pengelolaColumns} data={pengelola} />
      </div>

      {/* Bagian 2: Dosen Verifikator Publikasi */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={16} className="text-blue-600" /> Penugasan Dosen Verifikator Publikasi Mahasiswa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dosen yang berwenang memvalidasi LoA dan DOI publikasi yang diunggah oleh mahasiswa (FR-32).
            </p>
          </div>
          <button
            onClick={() => setModalVerifikator(true)}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={14} /> Tunjuk Verifikator
          </button>
        </div>

        <DataTable columns={verifikatorColumns} data={verifikator} />
      </div>

      {/* Modal Tunjuk Pengelola */}
      <Modal
        open={modalPengelola}
        onClose={() => setModalPengelola(false)}
        title="Tunjuk Pengelola Aduan Baru"
        size="md"
      >
        <form onSubmit={handleAddPengelola} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Lengkap Dosen / Staf</label>
            <input
              type="text"
              value={namaPengelola}
              onChange={(e) => setNamaPengelola(e.target.value)}
              placeholder="Contoh: Dr. Rina Fitriani, M.Kom."
              className="input-field text-xs"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">NIDN / NIP</label>
            <input
              type="text"
              value={nidnPengelola}
              onChange={(e) => setNidnPengelola(e.target.value)}
              placeholder="Contoh: 0412088501"
              className="input-field text-xs font-mono"
              required
            />
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={penangananKekerasan}
                onChange={(e) => setPenangananKekerasan(e.target.checked)}
                className="rounded text-rose-600"
              />
              <span className="font-bold text-rose-900 flex items-center gap-1">
                <ShieldAlert size={13} className="text-rose-600" /> Tunjuk sebagai PGL-K (Penanganan Kekerasan)
              </span>
            </label>
            <p className="text-[11px] text-rose-700 pl-5">
              Memberikan hak akses eksklusif membuka materi aduan sensitif kekerasan seksual dan perundungan.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalPengelola(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs px-4 py-2">
              Tetapkan Penugasan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tunjuk Verifikator */}
      <Modal
        open={modalVerifikator}
        onClose={() => setModalVerifikator(false)}
        title="Tunjuk Dosen Verifikator Publikasi"
        size="md"
      >
        <form onSubmit={handleAddVerifikator} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Lengkap Dosen</label>
            <input
              type="text"
              value={namaVerif}
              onChange={(e) => setNamaVerif(e.target.value)}
              placeholder="Contoh: Ir. Bambang Tri, Ph.D."
              className="input-field text-xs"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">NIDN</label>
            <input
              type="text"
              value={nidnVerif}
              onChange={(e) => setNidnVerif(e.target.value)}
              placeholder="Contoh: 0403067801"
              className="input-field text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Bidang Keahlian / KBK</label>
            <input
              type="text"
              value={bidangVerif}
              onChange={(e) => setBidangVerif(e.target.value)}
              placeholder="Contoh: Rekayasa Perangkat Lunak & Sistem Enterprise"
              className="input-field text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalVerifikator(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs px-4 py-2">
              Tetapkan Verifikator
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
