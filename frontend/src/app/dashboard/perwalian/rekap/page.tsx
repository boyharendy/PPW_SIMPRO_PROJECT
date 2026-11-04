'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { supabasePerwalian } from '@/lib/supabase';
import { mockPerwalianRecurringIssues } from '@/lib/mock-data';
import type { PerwalianRecurringIssue, ClassPerwalianReport, DosenWaliSessionReport } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  FileDown,
  Printer,
  AlertTriangle,
  FileText,
  Filter,
  CheckCircle2,
  Users,
  Building,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ExtendedIssue extends PerwalianRecurringIssue {
  status_solusi?: 'DIJADWALKAN_RAPAT' | 'DALAM_PENANGANAN' | 'SELESAI';
  rencana_aksi?: string;
}

export default function RekapPerwalianPage() {
  const [selectedSemester, setSelectedSemester] = useState('2024/2025 GANJIL');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterAngkatan, setFilterAngkatan] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Issues state with Kaprodi action
  const [issues, setIssues] = useState<ExtendedIssue[]>(
    mockPerwalianRecurringIssues.map((isu) => ({
      ...isu,
      status_solusi: isu.tingkat_urgensi === 'TINGGI' ? 'DIJADWALKAN_RAPAT' : 'DALAM_PENANGANAN',
      rencana_aksi: isu.kategori === 'FASILITAS'
        ? 'Pengadaan AC baru dan perpanjangan izin operasional laboratorium komputer hingga pukul 21.00 WIB.'
        : 'Penyusunan kalender koordinasi pengumpulan tugas besar prodi.',
    }))
  );

  const [selectedIssue, setSelectedIssue] = useState<ExtendedIssue | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [showOfficialDocModal, setShowOfficialDocModal] = useState(false);

  const [classReports, setClassReports] = useState<ClassPerwalianReport[]>([]);
  const [dosenSessions, setDosenSessions] = useState<DosenWaliSessionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabasePerwalian.getLaporanAll(),
      supabasePerwalian.getSesiAll()
    ]).then(([reports, sessions]) => {
      setClassReports(reports);
      setDosenSessions(sessions);
      setLoading(false);
    }).catch((err) => {
      console.error('Gagal memuat data rekap perwalian:', err);
      setLoading(false);
    });
  }, []);

  const verifiedReports = classReports.filter((r) => r.status === 'TERVERIFIKASI');

  const filteredReports = verifiedReports.filter((r) => {
    return filterAngkatan === 'ALL' || r.angkatan.toString() === filterAngkatan;
  });

  const filteredIssues = issues.filter((i) => {
    return filterKategori === 'ALL' || i.kategori === filterKategori;
  });

  const handleExport = (format: 'PDF' | 'WORD') => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportNotice(`Dokumen Resmi Rekapitulasi Laporan Perwalian (${format}) Semester ${selectedSemester} berhasil digenerate dan diunduh.`);
      setTimeout(() => setExportNotice(null), 5000);
    }, 1000);
  };

  const handleSaveIssueAction = () => {
    if (!selectedIssue) return;
    setIssues(
      issues.map((i) =>
        i.id === selectedIssue.id
          ? {
              ...i,
              status_solusi: 'DIJADWALKAN_RAPAT',
              rencana_aksi: actionInput || i.rencana_aksi,
            }
          : i
      )
    );
    setSelectedIssue(null);
    setActionInput('');
    setExportNotice(`Rencana tindak lanjut Kaprodi untuk isu "${selectedIssue.isu}" berhasil disimpan.`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  const issueColumns = [
    {
      key: 'isu',
      header: 'Isu / Keluhan Berulang',
      render: (row: ExtendedIssue) => (
        <div className="space-y-1">
          <p className="font-bold text-slate-800 text-xs sm:text-sm">{row.isu}</p>
          <div className="flex items-center gap-2">
            <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Kategori: {row.kategori}
            </span>
            {row.rencana_aksi && (
              <span className="text-[10px] text-blue-600 line-clamp-1 italic max-w-xs">
                Tindak Lanjut: {row.rencana_aksi}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'kemunculan',
      header: 'Frekuensi Kemunculan',
      render: (row: ExtendedIssue) => (
        <span className="font-extrabold text-blue-700 text-xs sm:text-sm bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg inline-block">
          {row.jumlah_kemunculan} Kelas
        </span>
      ),
    },
    {
      key: 'kelas',
      header: 'Kelas Terdampak',
      render: (row: ExtendedIssue) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.kelas_terdampak.map((k) => (
            <span key={k} className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {k}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'urgensi',
      header: 'Tingkat Urgensi',
      render: (row: ExtendedIssue) => (
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-block ${
            row.tingkat_urgensi === 'TINGGI'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : row.tingkat_urgensi === 'SEDANG'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {row.tingkat_urgensi}
        </span>
      ),
    },
    {
      key: 'aksi',
      header: 'Tindak Lanjut Kaprodi',
      render: (row: ExtendedIssue) => (
        <button
          onClick={() => {
            setSelectedIssue(row);
            setActionInput(row.rencana_aksi || '');
          }}
          className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
        >
          Atur Tindakan
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/perwalian" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Laporan Perwalian</span>
        </Link>
      </div>

      <PageHeader
        title="Rekapitulasi Laporan & Analisis Isu Perwalian"
        description="Pusat analisis isu berulang dari seluruh kelas bagi Kaprodi serta pembangkitan dokumen resmi kompilasi perwalian terpadu tingkat program studi (format PDF & Word)."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowOfficialDocModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <FileText className="h-4 w-4 text-slate-600" />
              <span>Preview Dokumen Resmi</span>
            </button>
            <button
              onClick={() => handleExport('PDF')}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 shadow-xs transition-colors"
            >
              <FileDown className="h-4 w-4 text-rose-600" />
              <span>Export PDF Resmi</span>
            </button>
            <button
              onClick={() => handleExport('WORD')}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              <FileText className="h-4 w-4 text-white" />
              <span>Export Word (.docx)</span>
            </button>
          </div>
        }
      />

      {/* Export Notice */}
      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-600 hover:text-emerald-800 font-bold ml-2">×</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Isu Berulang Terdeteksi"
          value={issues.length.toString()}
          description="Memerlukan koordinasi Kaprodi"
          icon="AlertTriangle"
        />
        <StatCard
          title="Laporan Terkompilasi"
          value={verifiedReports.length.toString()}
          description="Sudah diverifikasi Dosen Wali"
          icon="CheckCircle2"
        />
        <StatCard
          title="Tingkat Kepatuhan Pengisian"
          value="85%"
          description="Kelas telah menyelesaikan laporan"
          icon="Users"
        />
        <StatCard
          title="Agenda Tindak Lanjut"
          value="4 Agenda"
          description="Masuk rencana aksi pimpinan prodi"
          icon="Building"
        />
      </div>

      {/* Section 1: Rekap Isu Berulang bagi Kaprodi */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Rekapitulasi Isu Berulang Antarkelas (Kaprodi View)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sistem mendeteksi dan mengelompokkan keluhan berulang terkait perkuliahan, praktikum, sarana lab, dan kehadiran mahasiswa dari seluruh laporan kelas.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Kategori:</span>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="FASILITAS">Fasilitas & Lab</option>
                <option value="AKADEMIK">Akademik & Tugas</option>
                <option value="KEHADIRAN">Kehadiran Mahasiswa</option>
                <option value="FINANSIAL_SOSIAL">Finansial / UKT</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Periode:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="rounded-lg border border-slate-300 p-1.5 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="2024/2025 GANJIL">2024/2025 Ganjil</option>
                <option value="2023/2024 GENAP">2023/2024 Genap</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          data={filteredIssues}
          columns={issueColumns}
          searchPlaceholder="Cari isu berulang atau kelas terdampak..."
          searchKey="isu"
        />
      </div>

      {/* Section 2: Kompilasi Laporan Perwalian Terpadu */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Dokumen Kompilasi Laporan Perwalian Terpadu</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Penggabungan komprehensif antara Laporan Ketua Kelas yang telah diverifikasi dan Notulen Sesi Bimbingan Dosen Wali per kelas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Angkatan:</span>
            <select
              value={filterAngkatan}
              onChange={(e) => setFilterAngkatan(e.target.value)}
              className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-700 bg-white font-semibold"
            >
              <option value="ALL">Semua Angkatan</option>
              <option value="2022">Angkatan 2022</option>
              <option value="2023">Angkatan 2023</option>
              <option value="2024">Angkatan 2024</option>
            </select>
          </div>
        </div>

        <div className="space-y-5">
          {filteredReports.map((report) => {
            const sessions = dosenSessions.filter((s) => s.kelas === report.kelas);
            return (
              <div key={report.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Kelas: {report.kelas} — Angkatan {report.angkatan}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Ketua Kelas: <strong>{report.ketua_kelas_nama}</strong> (NIM {report.ketua_kelas_nim}) • Dosen Wali: <strong>{report.dosen_wali_nama}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={report.status} size="sm" />
                    <button
                      onClick={() => handleExport('PDF')}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Cetak Lembar Kelas</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-blue-800 block border-b border-slate-100 pb-1.5">
                      Bagian 1: Laporan Evaluasi Ketua Kelas
                    </span>
                    <p className="text-slate-700"><strong>Kondisi Umum:</strong> {report.kondisi_umum}</p>
                    <p className="text-slate-700"><strong>Kendala Akademik:</strong> {report.kendala_akademik}</p>
                    <p className="text-slate-700"><strong>Kendala Fasilitas:</strong> {report.kendala_non_akademik}</p>
                    <p className="text-slate-700"><strong>Aspirasi Mahasiswa:</strong> {report.aspirasi_mahasiswa}</p>
                    {report.mahasiswa_perhatian.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-100">
                        <span className="font-bold text-amber-700 block text-[11px] mb-1">
                          Perhatian Khusus ({report.mahasiswa_perhatian.length} Mahasiswa):
                        </span>
                        {report.mahasiswa_perhatian.map((m, idx) => (
                          <p key={idx} className="text-[11px] text-slate-600">
                            • {m.nama} ({m.nim}): {m.isu} (Kehadiran: {m.persentase_kehadiran}%)
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-emerald-800 block border-b border-slate-100 pb-1.5">
                      Bagian 2: Hasil Sesi Bimbingan Dosen Wali
                    </span>
                    {sessions.length > 0 ? (
                      sessions.map((sess) => (
                        <div key={sess.id} className="space-y-1 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                          <p className="text-slate-800 font-bold">
                            {sess.sesi.replace('_', ' ')} ({formatDate(sess.tanggal_sesi)}):
                          </p>
                          <p className="text-slate-600">
                            Presensi: <strong>{sess.hadir_mahasiswa}</strong> dari {sess.total_mahasiswa} mahasiswa hadir.
                          </p>
                          <p className="text-slate-700"><strong>Topik:</strong> {sess.topik_bahasan}</p>
                          <p className="text-slate-700"><strong>Rekomendasi:</strong> {sess.rekomendasi}</p>
                          <p className="text-slate-700"><strong>Rencana Tindak Lanjut:</strong> {sess.rencana_tindak_lanjut}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">Belum ada sesi bimbingan dosen yang tersimpan.</p>
                    )}
                  </div>
                </div>

                {report.catatan_verifikasi_dosen && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-900">Pengesahan Dosen Wali: </span>
                    <span className="text-emerald-800">{report.catatan_verifikasi_dosen}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Pengaturan Rencana Tindak Lanjut Isu (Kaprodi) */}
      {selectedIssue && (
        <Modal
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          title={`Penetapan Tindak Lanjut Isu — ${selectedIssue.kategori}`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
              <p className="font-bold text-slate-800 text-sm">{selectedIssue.isu}</p>
              <p className="text-slate-600 text-xs">
                Dilaporkan oleh <strong>{selectedIssue.jumlah_kemunculan} kelas</strong>: {selectedIssue.kelas_terdampak.join(', ')}
              </p>
              <p className="text-[11px] text-amber-800 font-semibold">Tingkat Urgensi: {selectedIssue.tingkat_urgensi}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rencana Aksi / Disposisi Kaprodi *
              </label>
              <textarea
                rows={3}
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="Tuliskan tindakan yang akan diambil, misal: Koordinasi dengan Kepala Lab, Pembahasan dalam Rapat Senat Prodi, dsb..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedIssue(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveIssueAction}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs"
              >
                Simpan Tindak Lanjut
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Preview Dokumen Resmi Kompilasi */}
      {showOfficialDocModal && (
        <Modal
          isOpen={showOfficialDocModal}
          onClose={() => setShowOfficialDocModal(false)}
          title="Preview Dokumen Kompilasi Laporan Perwalian Resmi"
        >
          <div className="space-y-5 max-h-[78vh] overflow-y-auto pr-1 text-xs">
            {/* Kop Surat Dokumen Resmi */}
            <div className="p-4 bg-white border border-slate-300 rounded-xl space-y-3 font-serif">
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
                </h3>
                <h4 className="text-xs font-bold uppercase text-slate-800">
                  PROGRAM STUDI SARJANA SISTEM INFORMASI
                </h4>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Jl. Telekomunikasi No. 1 • SIMPRO Manajemen Mutu & Kemahasiswaan
                </p>
              </div>

              <div className="text-center py-2 font-sans">
                <h5 className="font-bold text-xs uppercase tracking-wide text-slate-900">
                  LAPORAN KOMPILASI PERWALIAN MAHASISWA
                </h5>
                <p className="text-[11px] text-slate-600">
                  Semester Ganjil Tahun Akademik 2024/2025
                </p>
              </div>

              <div className="font-sans space-y-2 text-[11px] text-slate-700">
                <p><strong>1. Ringkasan Kepatuhan:</strong> 85% kelas telah menyelesaikan pelaporan dan verifikasi Dosen Wali.</p>
                <p><strong>2. Rekap Isu Berulang:</strong> Terdeteksi 4 kelompok isu utama (Fasilitas Lab, Jadwal Tugas Besar, Kehadiran Pagi, dan Finansial UKT).</p>
                <p><strong>3. Daftar Kelas Terverifikasi:</strong> IF-2022-A, SI-2023-B (Lampiran lengkap terlampir).</p>
              </div>

              <div className="pt-6 font-sans flex justify-between text-center text-[11px] text-slate-800">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold mt-12">Dr. Ahmad Fauzi, M.T.</p>
                  <p className="text-slate-500">Ketua Program Studi</p>
                </div>
                <div>
                  <p>Dosen Wali Perwakilan,</p>
                  <p className="font-bold mt-12">Siti Rahmawati, M.Kom.</p>
                  <p className="text-slate-500">Gugus Kendali Mutu</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowOfficialDocModal(false)}
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
                <span>Cetak Dokumen Sekarang</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
