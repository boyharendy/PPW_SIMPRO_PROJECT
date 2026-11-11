'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, UserCheck, ExternalLink, Plus, FileText, Send } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';

export default function Page() {
  const { id } = useParams<{ id: string }>();

  // Mock publication data
  const [pub, setPub] = useState({
    id: id || 'PUB-001',
    judul: 'Implementasi Deep Learning untuk Deteksi Anomali pada Jaringan IoT',
    jenis: 'JURNAL',
    target: 'Jurnal Teknologi Informasi dan Ilmu Komputer (JTIIK)',
    peringkat: 'SINTA 2',
    tahun: 2025,
    doi: '10.25126/jtiik.2025.12.3.4412',
    url: 'https://jtiik.ub.ac.id/index.php/jtiik/article/view/4412',
    status: 'TERBIT',
    statusVerifikasi: 'TERVERIFIKASI',
    verifikator: 'Dr. Ahmad Fauzi (Kaprodi)',
  });

  const [tahapan, setTahapan] = useState([
    { tahap: 'TERBIT', tanggal: '2025-08-20', bukti: 'DOI: 10.25126/jtiik.2025.12.3.4412', statusVerif: 'TERVERIFIKASI' },
    { tahap: 'DITERIMA', tanggal: '2025-06-15', bukti: 'LoA_JTIIK_2025.pdf', statusVerif: 'TERVERIFIKASI' },
    { tahap: 'REVISI', tanggal: '2025-04-10', bukti: 'Revisi_Mayor_V2.pdf', statusVerif: 'TERVERIFIKASI' },
    { tahap: 'DALAM_REVIEW', tanggal: '2025-02-18', bukti: '-', statusVerif: 'TERVERIFIKASI' },
    { tahap: 'DIAJUKAN', tanggal: '2025-01-12', bukti: 'Bukti_Submit_JTIIK.pdf', statusVerif: 'TERVERIFIKASI' },
    { tahap: 'DRAF', tanggal: '2024-12-05', bukti: '-', statusVerif: 'TERVERIFIKASI' },
  ]);

  const [penulis] = useState([
    { urutan: 1, nama: 'Dr. Rina Fitriani, M.Kom.', tipe: 'DOSEN', peran: 'PENULIS_PERTAMA' },
    { urutan: 2, nama: 'Muhammad Rizky Pratama', tipe: 'MAHASISWA', peran: 'ANGGOTA' },
    { urutan: 3, nama: 'Ir. Bambang Tri, Ph.D.', tipe: 'DOSEN', peran: 'KORESPONDENSI' },
  ]);

  const [stageModal, setStageModal] = useState(false);
  const [newTahap, setNewTahap] = useState('REVISI');
  const [newBukti, setNewBukti] = useState('');

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    setTahapan([
      {
        tahap: newTahap,
        tanggal: new Date().toISOString().split('T')[0],
        bukti: newBukti || 'Dokumen_Tahap.pdf',
        statusVerif: 'MENUNGGU',
      },
      ...tahapan,
    ]);
    setStageModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/publikasi"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Publikasi
        </Link>
      </div>

      <PageHeader
        title={pub.judul}
        description={`Katalog karya ilmiah prodi — ID: ${pub.id}`}
        badge={<StatusBadge status={pub.status} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStageModal(true)}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={14} /> Perbarui Tahapan
            </button>
          </div>
        }
      />

      {/* Info Karya Ilmiah */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Informasi Manuskrip & Target
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Jenis Publikasi:</span>
              <span className="font-semibold text-slate-800">{pub.jenis}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Peringkat / Indeksasi:</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {pub.peringkat}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Target Publikasi:</span>
              <span className="font-medium text-slate-800">{pub.target}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Tahun Terbit:</span>
              <span className="font-medium text-slate-800">{pub.tahun}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">DOI / Tautan Resmi:</span>
              {pub.url ? (
                <a
                  href={pub.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                >
                  {pub.doi || pub.url} <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Verifikasi Mahasiswa */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Status Validasi
          </h3>
          <div>
            <div className="text-xs text-slate-400 mb-1">Status Verifikasi:</div>
            <StatusBadge status={pub.statusVerifikasi} size="md" />
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 block mb-0.5">Diverifikasi oleh:</span>
            <span className="font-medium text-slate-800">{pub.verifikator}</span>
          </div>
        </div>
      </div>

      {/* Daftar Penulis */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Susunan Penulis Karya
        </h3>
        <div className="divide-y divide-slate-100">
          {penulis.map((p) => (
            <div key={p.urutan} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-400 w-4 text-center">{p.urutan}</span>
                <div>
                  <div className="font-semibold text-slate-800">{p.nama}</div>
                  <div className="text-[11px] text-slate-400">Tipe: {p.tipe}</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {p.peran.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Riwayat Tahapan (Timeline) */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Riwayat Tahapan Publikasi (FR-30)
        </h3>
        <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {tahapan.map((t, i) => (
            <div key={i} className="flex items-start gap-4 relative">
              <div className="w-7 h-7 rounded-full bg-blue-50 border-2 border-blue-500 text-blue-600 flex items-center justify-center shrink-0 z-10">
                <CheckCircle2 size={14} />
              </div>
              <div className="flex-1 p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{t.tahap}</span>
                    <span className="text-[11px] text-slate-400">• {formatDateShort(t.tanggal)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Bukti: {t.bukti}</div>
                </div>
                <StatusBadge status={t.statusVerif} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tambah Tahap */}
      <Modal
        open={stageModal}
        onClose={() => setStageModal(false)}
        title="Perbarui Tahapan Publikasi"
        size="md"
      >
        <form onSubmit={handleAddStage} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Tahap Baru</label>
            <select
              value={newTahap}
              onChange={(e) => setNewTahap(e.target.value)}
              className="select-field"
            >
              <option value="DIAJUKAN">Diajukan (Submit)</option>
              <option value="DALAM_REVIEW">Dalam Review</option>
              <option value="REVISI">Revisi</option>
              <option value="DITERIMA">Diterima (LoA Accepted)</option>
              <option value="TERBIT">Terbit (Published)</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Unggah Bukti / Tautan DOI
            </label>
            <input
              type="text"
              value={newBukti}
              onChange={(e) => setNewBukti(e.target.value)}
              placeholder="Contoh: LoA_JTIIK_2025.pdf atau DOI url"
              className="input-field text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStageModal(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs px-4 py-2">
              Simpan Tahap
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
