'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, UserCheck, Send, Shield, Lock, MessageSquare } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [aduan, setAduan] = useState({
    id: id || 'c-01',
    nomor: 'ADU-2025-0042',
    kategori: 'AKADEMIK',
    judul: 'Ketidaksesuaian jadwal praktikum basis data dengan perkuliahan teori',
    tanggal: '2025-10-24',
    uraian:
      'Pada minggu ke-8, materi praktikum basis data di laboratorium sudah masuk materi trigger dan stored procedure, sedangkan pada sesi kuliah teori di kelas baru membahas normalisasi 3NF. Hal ini membuat sebagian besar mahasiswa kesulitan mengerjakan tugas modul praktikum.',
    status: 'DITINDAKLANJUTI',
    disposisi: {
      penanggungJawab: 'Dr. Rina Fitriani (GKM / Koordinator KBK)',
      tenggat: '2025-10-31',
      catatan: 'Mohon koordinasikan keselarasan silabus mingguan antara dosen pengampu teori dan asisten laboratorium.',
    },
    messages: [
      {
        pengirim: 'PELAPOR',
        tanggal: '2025-10-24',
        isi: 'Mohon ditinjau kembali urutan materi praktikum agar tidak mendahului materi kuliah teori.',
        isInternal: false,
      },
      {
        pengirim: 'PETUGAS',
        namaPetugas: 'Pengelola Aduan Prodi',
        tanggal: '2025-10-25',
        isi: 'Aduan telah diverifikasi dan didisposisikan kepada Koordinator Kelompok Bidang Keahlian.',
        isInternal: false,
      },
      {
        pengirim: 'PETUGAS',
        namaPetugas: 'Dr. Rina Fitriani',
        tanggal: '2025-10-26',
        isi: 'Catatan internal: Telah dijadwalkan rapat koordinasi antara asisten lab dan dosen pengampu hari Selasa depan.',
        isInternal: true,
      },
    ],
  });

  const [balasTeks, setBalasTeks] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [disposisiModal, setDisposisiModal] = useState(false);
  const [pjBaru, setPjBaru] = useState(aduan.disposisi.penanggungJawab);
  const [tenggatBaru, setTenggatBaru] = useState('2025-11-05');
  const [catatanBaru, setCatatanBaru] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!balasTeks.trim()) return;

    setAduan({
      ...aduan,
      messages: [
        ...aduan.messages,
        {
          pengirim: 'PETUGAS',
          namaPetugas: 'Staf Prodi',
          tanggal: new Date().toISOString().split('T')[0],
          isi: balasTeks.trim(),
          isInternal: isInternalNote,
        },
      ],
    });
    setBalasTeks('');
    setIsInternalNote(false);
  };

  const handleSaveDisposisi = (e: React.FormEvent) => {
    e.preventDefault();
    setAduan({
      ...aduan,
      status: 'DITINDAKLANJUTI',
      disposisi: {
        penanggungJawab: pjBaru,
        tenggat: tenggatBaru,
        catatan: catatanBaru || aduan.disposisi.catatan,
      },
    });
    setDisposisiModal(false);
  };

  const handleSelesai = () => {
    setAduan({ ...aduan, status: 'SELESAI' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/kelola/aduan"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Antrean Aduan
        </Link>
      </div>

      <PageHeader
        title={`Detail Aduan #${aduan.nomor}`}
        description={`Kategori: ${aduan.kategori.replace('_', ' ')} • Masuk: ${formatDateShort(aduan.tanggal)}`}
        badge={<StatusBadge status={aduan.status} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDisposisiModal(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <UserCheck size={14} /> Atur Disposisi
            </button>
            {aduan.status !== 'SELESAI' && (
              <button
                onClick={handleSelesai}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> Tandai Selesai
              </button>
            )}
          </div>
        }
      />

      {/* Rincian Aduan & Disposisi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Uraian Aduan Pelapor (Anonim)
            </h3>
            <span className="text-xs font-semibold text-slate-400">Identitas Pelapor Terlindungi</span>
          </div>
          <div className="text-xs font-bold text-slate-800 text-sm">{aduan.judul}</div>
          <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
            {aduan.uraian}
          </p>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Status Disposisi Tindak Lanjut
          </h3>
          <div className="text-xs space-y-2">
            <div>
              <span className="text-slate-400 block mb-0.5">Penanggung Jawab:</span>
              <span className="font-semibold text-slate-800">{aduan.disposisi.penanggungJawab}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Batas Tenggat Penyelesaian:</span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                {formatDateShort(aduan.disposisi.tenggat)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block mb-0.5">Arahan Disposisi:</span>
              <p className="text-slate-600 italic leading-relaxed text-[11px]">
                "{aduan.disposisi.catatan}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Utas Percakapan & Tanggapan */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={16} className="text-blue-600" /> Utas Tanggapan & Log Penanganan
          </h3>
          <span className="text-[11px] text-slate-400">
            Catatan internal diberi penanda gembok khusus dan tidak terlihat oleh pelapor.
          </span>
        </div>

        <div className="space-y-3">
          {aduan.messages.map((m, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                m.isInternal
                  ? 'bg-amber-50/50 border-amber-200/80 ml-6'
                  : m.pengirim === 'PELAPOR'
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-blue-50/40 border-blue-200 ml-6'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  {m.isInternal && <Lock size={12} className="text-amber-600" />}
                  {m.pengirim === 'PELAPOR' ? (
                    <span className="text-slate-700">Pelapor (Anonim)</span>
                  ) : (
                    <span className={m.isInternal ? 'text-amber-900' : 'text-blue-800'}>
                      {m.namaPetugas} {m.isInternal && '(Catatan Internal)'}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">{formatDateShort(m.tanggal)}</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{m.isi}</p>
            </div>
          ))}
        </div>

        {/* Form Kirim Tanggapan */}
        <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-100 space-y-3">
          <textarea
            rows={3}
            value={balasTeks}
            onChange={(e) => setBalasTeks(e.target.value)}
            placeholder="Tulis tanggapan untuk pelapor atau catatan internal tim pengelola..."
            className="input-field text-xs resize-none"
            required
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isInternalNote}
                onChange={(e) => setIsInternalNote(e.target.checked)}
                className="rounded"
              />
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Lock size={12} /> Tandai sebagai Catatan Internal (Hanya Petugas)
              </span>
            </label>

            <button type="submit" className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              <Send size={13} /> Kirim Tanggapan
            </button>
          </div>
        </form>
      </div>

      {/* Modal Disposisi */}
      <Modal
        open={disposisiModal}
        onClose={() => setDisposisiModal(false)}
        title="Disposisikan Aduan ke Penanggung Jawab"
        size="md"
      >
        <form onSubmit={handleSaveDisposisi} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Pilih Penanggung Jawab
            </label>
            <select
              value={pjBaru}
              onChange={(e) => setPjBaru(e.target.value)}
              className="select-field text-xs"
            >
              <option value="Dr. Rina Fitriani (GKM / Koordinator KBK)">
                Dr. Rina Fitriani (GKM / Koordinator KBK)
              </option>
              <option value="Admin Prodi Sistem Informasi">Admin Prodi Sistem Informasi</option>
              <option value="Staf Laboratorium Komputasi">Staf Laboratorium Komputasi</option>
              <option value="Dosen Pembina Kemahasiswaan">Dosen Pembina Kemahasiswaan</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Batas Tenggat Penyelesaian (SLA)
            </label>
            <input
              type="date"
              value={tenggatBaru}
              onChange={(e) => setTenggatBaru(e.target.value)}
              className="input-field text-xs"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Arahan / Catatan Disposisi
            </label>
            <textarea
              rows={3}
              value={catatanBaru}
              onChange={(e) => setCatatanBaru(e.target.value)}
              placeholder="Berikan instruksi langkah penanganan untuk penanggung jawab..."
              className="input-field text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDisposisiModal(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs px-4 py-2">
              Simpan Disposisi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
