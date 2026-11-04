'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { useApp } from '@/lib/context';
import { mockProfiles } from '@/lib/mock-data';
import { publicationService } from '@/lib/api/services/publication.service';
import type {
  Publication,
  PublicationType,
  PublicationRank,
  PublicationStage,
  AuthorType,
  AuthorRole,
  PublicationAuthor,
} from '@/lib/types';
import { ArrowLeft, Plus, Trash2, Save, Send, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function TambahPublikasiPage() {
  const router = useRouter();
  const { user } = useApp();

  const [judul, setJudul] = useState('');
  const [jenis, setJenis] = useState<PublicationType>('JURNAL');
  const [namaTarget, setNamaTarget] = useState('');
  const [peringkat, setPeringkat] = useState<PublicationRank>('SINTA_2');
  const [tahapAwal, setTahapAwal] = useState<PublicationStage>('IDE');
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [doi, setDoi] = useState('');
  const [url, setUrl] = useState('');
  const [catatanTahap, setCatatanTahap] = useState('');

  // Initial Authors: default current user as first author
  const [authors, setAuthors] = useState<PublicationAuthor[]>([
    {
      id: 'a-1',
      nama_penulis: user.nama_lengkap,
      tipe_penulis: user.activeRole === 'MAHASISWA' ? 'MAHASISWA' : 'DOSEN',
      peran: 'PENULIS_PERTAMA',
      urutan: 1,
      user_id: user.id,
    },
  ]);

  const [verifikatorId, setVerifikatorId] = useState<string>('u-dosen1');

  const isStudentAuthor = authors.some((a) => a.tipe_penulis === 'MAHASISWA');
  const hasLecturerCoAuthor = authors.some((a) => a.tipe_penulis === 'DOSEN');
  const availableLecturers = mockProfiles.filter((p) => p.tipe_pengguna === 'DOSEN');

  const handleAddAuthor = () => {
    const newAuthor: PublicationAuthor = {
      id: `auth-${Date.now()}`,
      nama_penulis: '',
      tipe_penulis: 'DOSEN',
      peran: 'ANGGOTA',
      urutan: authors.length + 1,
    };
    setAuthors([...authors, newAuthor]);
  };

  const handleUpdateAuthor = (index: number, field: keyof PublicationAuthor, val: unknown) => {
    const updated = authors.map((a, i) => (i === index ? { ...a, [field]: val } : a));
    setAuthors(updated);
  };

  const handleRemoveAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (statusTarget: PublicationStage) => {
    if (!judul.trim() || !namaTarget.trim()) {
      alert('Judul dan nama target publikasi wajib diisi.');
      return;
    }

    const finalStage = statusTarget === 'DRAF' ? 'DRAF' : tahapAwal === 'DRAF' ? 'DIAJUKAN' : tahapAwal;

    const newPub: Publication = {
      id: `pub-${Date.now()}`,
      judul,
      jenis,
      nama_target: namaTarget,
      peringkat,
      status: finalStage,
      status_verifikasi: isStudentAuthor ? 'MENUNGGU' : 'TIDAK_PERLU',
      doi: doi || undefined,
      url: url || undefined,
      tahun,
      dicatat_oleh: user.id,
      verifikator_id: isStudentAuthor ? verifikatorId : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      authors,
      stage_logs: [
        {
          id: `psl-${Date.now()}`,
          publication_id: `pub-${Date.now()}`,
          tahap: finalStage,
          tanggal_tahap: new Date().toISOString().split('T')[0],
          catatan: catatanTahap || `Pencatatan awal pada tahap ${finalStage}`,
          dicatat_oleh: user.id,
          status_verifikasi: isStudentAuthor ? 'MENUNGGU' : 'TIDAK_PERLU',
          created_at: new Date().toISOString(),
        },
      ],
    };

    await publicationService.createPublication(newPub);
    router.push('/dashboard/publikasi');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/publikasi"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Publikasi</span>
        </Link>
      </div>

      <PageHeader
        title="Pencatatan Publikasi Baru"
        description="Daftarkan karya ilmiah jurnal, prosiding seminar, buku, atau hak cipta (HKI) dosen dan mahasiswa beserta tahapan proses publikasinya."
      />

      <div className="space-y-6">
        {/* Detail Naskah */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Informasi Umum & Tahapan Publikasi (FR-29)
          </h3>

          <div className="space-y-4">
            <div>
              <label className="label">Judul Lengkap Publikasi / Artikel</label>
              <textarea
                rows={2}
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Implementasi Artificial Intelligence dalam Sistem Tata Kelola Mutu..."
                className="textarea-field text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="label">Jenis Publikasi</label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as PublicationType)}
                  className="select-field text-xs"
                >
                  <option value="JURNAL">Jurnal Ilmiah</option>
                  <option value="PROSIDING">Prosiding Seminar</option>
                  <option value="BUKU">Buku / Monograf</option>
                  <option value="HKI">Hak Kekayaan Intelektual (HKI)</option>
                </select>
              </div>

              <div>
                <label className="label">Peringkat / Indeksasi</label>
                <select
                  value={peringkat}
                  onChange={(e) => setPeringkat(e.target.value as PublicationRank)}
                  className="select-field text-xs"
                >
                  <option value="SINTA_1">SINTA 1</option>
                  <option value="SINTA_2">SINTA 2</option>
                  <option value="SINTA_3">SINTA 3</option>
                  <option value="SINTA_4">SINTA 4</option>
                  <option value="SINTA_5">SINTA 5</option>
                  <option value="SINTA_6">SINTA 6</option>
                  <option value="SCOPUS_Q1">Scopus Q1</option>
                  <option value="SCOPUS_Q2">Scopus Q2</option>
                  <option value="SCOPUS_Q3">Scopus Q3</option>
                  <option value="SCOPUS_Q4">Scopus Q4</option>
                  <option value="WOS">Web of Science (WoS)</option>
                  <option value="NON_PERINGKAT">Non-Peringkat</option>
                </select>
              </div>

              <div>
                <label className="label">Tahap Saat Ini (SKPL FR-29)</label>
                <select
                  value={tahapAwal}
                  onChange={(e) => setTahapAwal(e.target.value as PublicationStage)}
                  className="select-field text-xs font-semibold text-blue-700"
                >
                  <option value="IDE">1. Ide / Konsep</option>
                  <option value="PENULISAN">2. Penulisan Naskah</option>
                  <option value="DRAF">3. Draf Selesai</option>
                  <option value="SUBMIT">4. Submit ke Jurnal/Seminar</option>
                  <option value="REVIEW">5. Dalam Review (Peer Review)</option>
                  <option value="REVISI">6. Revisi Naskah</option>
                  <option value="ACCEPTED">7. Accepted (LoA)</option>
                  <option value="TERBIT">8. Terbit / Published</option>
                </select>
              </div>

              <div>
                <label className="label">Tahun</label>
                <input
                  type="number"
                  min={2000}
                  max={2030}
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value) || 2025)}
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Target Publikasi (Nama Jurnal / Konferensi / Penerbit)</label>
                <input
                  type="text"
                  required
                  value={namaTarget}
                  onChange={(e) => setNamaTarget(e.target.value)}
                  placeholder="Contoh: Journal of Information Systems & Technology"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="label">Nomor DOI (Opsional)</label>
                <input
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="Contoh: 10.1234/jist.2025.01"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="label">Tautan Artikel / Bukti LoA (Opsional)</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://journal.example.ac.id/article/view/123"
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div>
              <label className="label">Catatan Tahapan Proses (Opsional)</label>
              <input
                type="text"
                value={catatanTahap}
                onChange={(e) => setCatatanTahap(e.target.value)}
                placeholder="Contoh: Naskah telah disubmit ke portal OJS jurnal dan menunggu editor assignment..."
                className="input-field text-xs"
              />
            </div>
          </div>
        </div>

        {/* Authors List */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Daftar Penulis & Peran</h3>
              <p className="text-xs text-slate-500">
                Mendukung publikasi kolaboratif dosen–mahasiswa maupun publikasi mandiri mahasiswa (FR-31)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddAuthor}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-blue-600 border-blue-200"
            >
              <Plus size={14} />
              <span>Tambah Penulis</span>
            </button>
          </div>

          <div className="space-y-3">
            {authors.map((auth, idx) => (
              <div
                key={auth.id || idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 items-center text-xs"
              >
                <div className="sm:col-span-1 flex items-center justify-center font-bold text-slate-400">
                  #{idx + 1}
                </div>

                <div className="sm:col-span-4">
                  <label className="label text-[10px]">Nama Penulis</label>
                  <input
                    type="text"
                    required
                    value={auth.nama_penulis}
                    onChange={(e) => handleUpdateAuthor(idx, 'nama_penulis', e.target.value)}
                    placeholder="Nama Lengkap & Gelar..."
                    className="input-field text-xs py-1.5"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="label text-[10px]">Tipe Penulis</label>
                  <select
                    value={auth.tipe_penulis}
                    onChange={(e) =>
                      handleUpdateAuthor(idx, 'tipe_penulis', e.target.value as AuthorType)
                    }
                    className="select-field text-xs py-1.5"
                  >
                    <option value="DOSEN">Dosen</option>
                    <option value="MAHASISWA">Mahasiswa</option>
                    <option value="EKSTERNAL">Eksternal</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="label text-[10px]">Peran</label>
                  <select
                    value={auth.peran}
                    onChange={(e) =>
                      handleUpdateAuthor(idx, 'peran', e.target.value as AuthorRole)
                    }
                    className="select-field text-xs py-1.5"
                  >
                    <option value="PENULIS_PERTAMA">Penulis Pertama</option>
                    <option value="KORESPONDENSI">Korespondensi</option>
                    <option value="ANGGOTA">Anggota</option>
                    <option value="PEMBIMBING">Pembimbing</option>
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-center">
                  {authors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAuthor(idx)}
                      className="w-7 h-7 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors mt-4 sm:mt-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dosen Verifikator Selection if student involved (FR-31) */}
          {isStudentAuthor && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                <AlertCircle size={15} className="text-amber-600" />
                <span>
                  Verifikasi Publikasi Mahasiswa (SKPL FR-31 —{' '}
                  {hasLecturerCoAuthor ? 'Kolaboratif Dosen & Mahasiswa' : 'Publikasi Mandiri Mahasiswa'})
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {hasLecturerCoAuthor
                  ? 'Publikasi yang melibatkan mahasiswa memerlukan verifikasi dari Dosen Pembimbing atau Dosen Penulis Pendamping sebelum masuk ke rekap resmi prodi.'
                  : 'Untuk publikasi mandiri mahasiswa (tanpa dosen sebagai penulis pendamping), pilih Dosen Pembimbing, Dosen Wali, atau Dosen Verifikator yang ditunjuk Kaprodi untuk memverifikasi publikasi ini.'}
              </p>
              <div className="max-w-md pt-1">
                <label className="label text-[11px] text-amber-900 font-bold">
                  Pilih Dosen Verifikator (Pembimbing / Dosen Wali / Verifikator Prodi)
                </label>
                <select
                  value={verifikatorId}
                  onChange={(e) => setVerifikatorId(e.target.value)}
                  className="select-field text-xs py-1.5 bg-white"
                >
                  {availableLecturers.map((lec) => (
                    <option key={lec.id} value={lec.id}>
                      {lec.nama_lengkap}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit('DRAF')}
            className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Simpan sebagai Draf</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(tahapAwal)}
            className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>Simpan & Catat Tahapan Publikasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
