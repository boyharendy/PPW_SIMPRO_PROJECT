'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { supabaseBeasiswa } from '@/lib/supabase';
import type { ScholarshipRecipient } from '@/lib/types';
import {
  ArrowLeft,
  FileDown,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PieChart,
  Award,
  Filter,
  Send,
  CheckCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

export default function RekapBeasiswaPage() {
  const [recipients, setRecipients] = useState<ScholarshipRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRisiko, setFilterRisiko] = useState<string>('ALL');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('2024/2025 Ganjil');

  useEffect(() => {
    setLoading(true);
    supabaseBeasiswa.getPenerimaAll().then((data) => {
      setRecipients(data);
      setLoading(false);
    }).catch((err) => {
      console.error('Gagal memuat data penerima beasiswa:', err);
      setLoading(false);
    });
  }, []);

  const [selectedAtRiskStudent, setSelectedAtRiskStudent] = useState<ScholarshipRecipient | null>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);

  const filtered = recipients.filter((r) => {
    if (filterRisiko === 'RISIKO' && !r.is_berisiko) return false;
    if (filterRisiko === 'TUNTAS' && r.status !== 'SELESAI') return false;
    if (filterJenis !== 'ALL' && !r.jenis_beasiswa.toLowerCase().includes(filterJenis.toLowerCase())) return false;
    return true;
  });

  const totalKewajiban = recipients.reduce((acc, r) => acc + r.kewajiban_jam, 0);
  const totalTerverifikasi = recipients.reduce((acc, r) => acc + r.jam_terverifikasi, 0);
  const aggregatePercent = totalKewajiban > 0 ? Math.round((totalTerverifikasi / totalKewajiban) * 100) : 0;
  const totalBerisiko = recipients.filter((r) => r.is_berisiko).length;
  const totalTuntas = recipients.filter((r) => r.status === 'SELESAI').length;

  const handleExport = (format: 'EXCEL' | 'PDF') => {
    setToastNotification(`Rekapitulasi Pemenuhan Jam Karya (${format}) Semester ${selectedSemester} berhasil diekspor!`);
    setTimeout(() => setToastNotification(null), 5000);
  };

  const handleSendWarning = () => {
    if (!selectedAtRiskStudent) return;
    setToastNotification(`Surat peringatan dini pemenuhan jam karya berhasil dikirimkan ke mahasiswa ${selectedAtRiskStudent.mahasiswa_nama} (${selectedAtRiskStudent.mahasiswa_nim}) dan tembusan ke Dosen Verifikator.`);
    setSelectedAtRiskStudent(null);
    setWarningMessage('');
    setTimeout(() => setToastNotification(null), 6000);
  };

  const columns = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa Penerima',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.mahasiswa_nama}</span>
          <p className="text-[11px] text-slate-500 font-mono">
            NIM: {row.mahasiswa_nim} • Angkatan {row.angkatan}
          </p>
        </div>
      ),
    },
    {
      key: 'beasiswa',
      header: 'Jenis Beasiswa & Lembaga',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-blue-700 text-xs">{row.jenis_beasiswa}</span>
          <p className="text-[11px] text-slate-500">{row.pemberi_beasiswa}</p>
        </div>
      ),
    },
    {
      key: 'verifikator',
      header: 'Dosen Verifikator',
      render: (row: ScholarshipRecipient) => (
        <span className="text-xs text-slate-700 font-medium">{row.dosen_verifikator_nama}</span>
      ),
    },
    {
      key: 'kewajiban',
      header: 'Kewajiban Jam',
      render: (row: ScholarshipRecipient) => (
        <span className="font-bold text-slate-800 text-xs">{row.kewajiban_jam} Jam</span>
      ),
    },
    {
      key: 'terverifikasi',
      header: 'Disetujui',
      render: (row: ScholarshipRecipient) => (
        <span className="font-bold text-emerald-700 text-xs">{row.jam_terverifikasi} Jam</span>
      ),
    },
    {
      key: 'sisa',
      header: 'Sisa Jam',
      render: (row: ScholarshipRecipient) => {
        const sisa = Math.max(0, row.kewajiban_jam - row.jam_terverifikasi);
        return (
          <span className={`font-bold text-xs ${sisa === 0 ? 'text-slate-400' : 'text-amber-700'}`}>
            {sisa} Jam
          </span>
        );
      },
    },
    {
      key: 'persen',
      header: 'Persentase & Status Risiko',
      render: (row: ScholarshipRecipient) => {
        const pct = Math.min(100, Math.round((row.jam_terverifikasi / row.kewajiban_jam) * 100));
        return (
          <div className="space-y-1 min-w-[140px]">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-extrabold ${pct >= 100 ? 'text-emerald-700' : row.is_berisiko ? 'text-rose-700' : 'text-blue-700'}`}>
                {pct}%
              </span>
              {row.is_berisiko ? (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                  Berisiko
                </span>
              ) : pct >= 100 ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  Tuntas
                </span>
              ) : null}
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct >= 100 ? 'bg-emerald-500' : row.is_berisiko ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'aksi',
      header: 'Aksi Intervensi',
      render: (row: ScholarshipRecipient) => (
        row.is_berisiko ? (
          <button
            onClick={() => {
              setSelectedAtRiskStudent(row);
              setWarningMessage(`Diberitahukan kepada sdr. ${row.mahasiswa_nama} bahwa progres pemenuhan jam karya beasiswa Anda baru mencapai ${Math.round((row.jam_terverifikasi / row.kewajiban_jam) * 100)}%. Mohon segera berkoordinasi dengan Dosen Verifikator untuk memenuhi sisa ${row.kewajiban_jam - row.jam_terverifikasi} jam sebelum penutupan semester.`);
            }}
            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 flex items-center gap-1 transition-colors"
          >
            <Send className="h-3 w-3" />
            <span>Kirim Peringatan</span>
          </button>
        ) : (
          <span className="text-slate-400 text-xs italic">Aman</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/beasiswa" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Beasiswa</span>
        </Link>
      </div>

      <PageHeader
        title="Rekapitulasi Pemenuhan Jam Karya Beasiswa"
        description="Monitoring komprehensif pemenuhan jam karya mahasiswa penerima beasiswa prodi: pelacakan persentase ketercapaian, deteksi dini mahasiswa berisiko, dan ekspor laporan resmi."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowDocModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <FileText className="h-4 w-4 text-slate-600" />
              <span>Preview Rekap Resmi</span>
            </button>
            <button
              onClick={() => handleExport('EXCEL')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 shadow-xs transition-colors"
            >
              <FileDown className="h-4 w-4 text-emerald-600" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleExport('PDF')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              <FileDown className="h-4 w-4 text-white" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        }
      />

      {/* Toast Notification */}
      {toastNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{toastNotification}</span>
          </div>
          <button onClick={() => setToastNotification(null)} className="text-emerald-500 hover:text-emerald-800 font-bold ml-2">×</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mahasiswa Beasiswa"
          value={recipients.length.toString()}
          description={`Periode ${selectedSemester}`}
          icon="Award"
        />
        <StatCard
          title="Mahasiswa Tuntas"
          value={totalTuntas.toString()}
          description="100% Kewajiban Terpenuhi"
          icon="CheckCircle2"
        />
        <StatCard
          title="Mahasiswa Berisiko"
          value={totalBerisiko.toString()}
          description="Ketercapaian di bawah target"
          icon="AlertTriangle"
        />
        <StatCard
          title="Total Jam Terserap"
          value={`${totalTerverifikasi} Jam`}
          description={`${aggregatePercent}% Dari Total Target (${totalKewajiban} Jam)`}
          icon="Clock"
        />
      </div>

      {/* Filter and Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" />
              Filter:
            </span>

            {/* Filter Status Risiko */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setFilterRisiko('ALL')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterRisiko === 'ALL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Mahasiswa
              </button>
              <button
                onClick={() => setFilterRisiko('RISIKO')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                  filterRisiko === 'RISIKO' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="h-3 w-3 text-rose-500" />
                <span>Hanya Berisiko ({totalBerisiko})</span>
              </button>
              <button
                onClick={() => setFilterRisiko('TUNTAS')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterRisiko === 'TUNTAS' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sudah Tuntas ({totalTuntas})
              </button>
            </div>

            {/* Filter Jenis Beasiswa */}
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">Semua Jenis Beasiswa</option>
              <option value="KIP Kuliah">KIP Kuliah</option>
              <option value="Bank Indonesia">Bank Indonesia</option>
              <option value="Djarum">Djarum Plus</option>
              <option value="Industri">Industri</option>
            </select>
          </div>

          <p className="text-xs text-slate-500">
            Menampilkan <strong>{filtered.length}</strong> mahasiswa
          </p>
        </div>

        <DataTable
          data={filtered}
          columns={columns}
          searchPlaceholder="Cari mahasiswa, NIM, atau dosen verifikator..."
          searchKey="mahasiswa_nama"
        />
      </div>

      {/* MODAL: Kirim Peringatan Dini ke Mahasiswa Berisiko */}
      {selectedAtRiskStudent && (
        <Modal
          isOpen={!!selectedAtRiskStudent}
          onClose={() => setSelectedAtRiskStudent(null)}
          title={`Kirim Peringatan Dini Pemenuhan Jam — ${selectedAtRiskStudent.mahasiswa_nama}`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <p className="font-bold text-rose-900 text-sm">
                {selectedAtRiskStudent.mahasiswa_nama} ({selectedAtRiskStudent.mahasiswa_nim})
              </p>
              <p className="text-rose-800 text-xs">
                Kewajiban: <strong>{selectedAtRiskStudent.kewajiban_jam} Jam</strong> • Baru Terverifikasi: <strong>{selectedAtRiskStudent.jam_terverifikasi} Jam</strong> ({Math.round((selectedAtRiskStudent.jam_terverifikasi / selectedAtRiskStudent.kewajiban_jam) * 100)}%)
              </p>
              <p className="text-rose-700 text-[11px]">
                Sisa yang harus diselesaikan: <strong>{selectedAtRiskStudent.kewajiban_jam - selectedAtRiskStudent.jam_terverifikasi} Jam</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teks Pesan Peringatan Resmi (Dikirim via Email & Notifikasi Sistem) *
              </label>
              <textarea
                rows={4}
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAtRiskStudent(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSendWarning}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-xs"
              >
                Kirim Surat Peringatan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Preview Dokumen Rekap Resmi */}
      {showDocModal && (
        <Modal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          title="Preview Dokumen Rekapitulasi Beasiswa Resmi"
        >
          <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 text-xs">
            <div className="p-4 bg-white border border-slate-300 rounded-xl space-y-3 font-serif">
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  PROGRAM STUDI SARJANA SISTEM INFORMASI
                </h3>
                <h4 className="text-xs font-bold uppercase text-slate-800">
                  REKAPITULASI PEMENUHAN JAM KARYA MAHASISWA BEASISWA
                </h4>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Periode Semester {selectedSemester} • Tanggal Terbit: 3 November 2024
                </p>
              </div>

              <div className="font-sans space-y-2 text-[11px] text-slate-700">
                <p><strong>Total Mahasiswa Penerima:</strong> {recipients.length} Orang</p>
                <p><strong>Total Jam Karya Terpenuhi:</strong> {totalTerverifikasi} dari {totalKewajiban} Jam ({aggregatePercent}%)</p>
                <p><strong>Status Mahasiswa:</strong> {totalTuntas} Tuntas 100%, {totalBerisiko} Dalam Pengawasan Khusus.</p>
              </div>

              <div className="pt-6 font-sans flex justify-between text-center text-[11px] text-slate-800">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold mt-12">Dr. Ahmad Fauzi, M.T.</p>
                  <p className="text-slate-500">Ketua Program Studi</p>
                </div>
                <div>
                  <p>Koordinator Verifikator Beasiswa,</p>
                  <p className="font-bold mt-12">Siti Rahmawati, M.Kom.</p>
                  <p className="text-slate-500">Dosen Verifikator</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDocModal(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Dokumen</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
