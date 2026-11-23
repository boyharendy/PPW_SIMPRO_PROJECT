import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storageSync, STORAGE_KEYS } from '../src/lib/storage-sync.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Publication submission & verification queue synchronization flow', async () => {
  // Test storage keys
  assert.ok(STORAGE_KEYS.PUBLICATIONS, 'STORAGE_KEYS.PUBLICATIONS must exist');
  assert.ok(STORAGE_KEYS.PUBLICATION_VERIFICATIONS, 'STORAGE_KEYS.PUBLICATION_VERIFICATIONS must exist');

  const initialPubs = [
    {
      id: 'PUB-001',
      judul: 'Publikasi Awal',
      jenis: 'JURNAL',
      penulisUtama: 'Dosen Contoh',
      peringkat: 'SINTA 2',
      tahun: 2025,
      status: 'TERBIT',
      status_verifikasi: 'TIDAK_PERLU',
    },
  ];

  const initialVerifs = [
    {
      id: 'ver-1',
      judul: 'Verifikasi Awal',
      jenis: 'PROSIDING',
      mahasiswa: 'Mahasiswa Awal',
      nim: '1201210088',
      tahap: 'DITERIMA',
      bukti: 'LoA_Prosiding.pdf',
      tanggal: '2025-10-18',
      status: 'MENUNGGU',
    },
  ];

  // 1. Submit a student as primary author publication -> Requires verifikator and sets MENUNGGU
  const studentLeadPubId = 'PUB-TEST-MHS-LEAD';
  const studentLeadPub = {
    id: studentLeadPubId,
    judul: 'Implementasi Algoritma AI untuk Deteksi Malware',
    jenis: 'JURNAL',
    penulisUtama: 'Ahmad Mahasiswa',
    peringkat: 'SINTA 2',
    tahun: 2025,
    status: 'DIAJUKAN',
    target: 'Jurnal Ilmu Komputer',
    status_verifikasi: 'MENUNGGU',
    verifikator: 'Budi Hartono, M.Kom.',
  };

  const updatedPubs = storageSync.prepend(STORAGE_KEYS.PUBLICATIONS, studentLeadPub, initialPubs);
  assert.equal(updatedPubs.length, 2);
  assert.equal(updatedPubs[0].id, studentLeadPubId);
  assert.equal(updatedPubs[0].status_verifikasi, 'MENUNGGU');

  // Add to verification queue
  const newVerif = {
    id: 'ver-test-001',
    publication_id: studentLeadPubId,
    judul: studentLeadPub.judul,
    jenis: studentLeadPub.jenis,
    mahasiswa: 'Ahmad Mahasiswa',
    nim: '1201220055',
    tahap: 'DIAJUKAN',
    bukti: 'Bukti_Submit_Implementasi.pdf',
    tanggal: '2025-11-17',
    status: 'MENUNGGU',
    verifikator: 'Budi Hartono, M.Kom.',
  };

  const updatedVerifs = storageSync.prepend(STORAGE_KEYS.PUBLICATION_VERIFICATIONS, newVerif, initialVerifs);
  assert.equal(updatedVerifs.length, 2);
  assert.equal(updatedVerifs[0].id, 'ver-test-001');
  assert.equal(updatedVerifs[0].status, 'MENUNGGU');

  // 2. Submit a lecturer pure publication (no student) -> TIDAK_PERLU verifikator, does NOT enter queue
  const lecturerLeadPubId = 'PUB-TEST-DOSEN-PURE';
  const lecturerLeadPub = {
    id: lecturerLeadPubId,
    judul: 'Studi Komparasi Cloud Computing untuk Smart Campus',
    jenis: 'PROSIDING',
    penulisUtama: 'Dr. Rina Fitriani, M.Kom.',
    peringkat: 'Scopus Q2',
    tahun: 2025,
    status: 'DIAJUKAN',
    target: 'IEEE Conference 2025',
    status_verifikasi: 'TIDAK_PERLU',
  };

  const withDosenPubs = storageSync.prepend(STORAGE_KEYS.PUBLICATIONS, lecturerLeadPub, updatedPubs);
  assert.equal(withDosenPubs[0].id, lecturerLeadPubId);
  assert.equal(withDosenPubs[0].status_verifikasi, 'TIDAK_PERLU');
  assert.equal(withDosenPubs[0].verifikator, undefined);

  // Verification queue length remains 2 (dosen lead publication did NOT get added to queue)
  assert.equal(updatedVerifs.length, 2);

  // 3. Lecturer verifies and approves the student submission
  const afterApprovedVerifs = storageSync.update(
    STORAGE_KEYS.PUBLICATION_VERIFICATIONS,
    'ver-test-001',
    { status: 'TERVERIFIKASI', catatan: 'Naskah dan bukti submit telah divalidasi keabsahannya.' },
    updatedVerifs
  );
  const targetVerif = afterApprovedVerifs.find((v) => v.id === 'ver-test-001');
  assert.equal(targetVerif?.status, 'TERVERIFIKASI');
  assert.equal(targetVerif?.catatan, 'Naskah dan bukti submit telah divalidasi keabsahannya.');

  // 4. Publication record status_verifikasi updates to TERVERIFIKASI
  const afterApprovedPubs = storageSync.update(
    STORAGE_KEYS.PUBLICATIONS,
    studentLeadPubId,
    { status_verifikasi: 'TERVERIFIKASI' },
    withDosenPubs
  );
  const targetPub = afterApprovedPubs.find((p) => p.id === studentLeadPubId);
  assert.equal(targetPub?.status_verifikasi, 'TERVERIFIKASI');
});

test('Halaman Tambah Publikasi (/dashboard/publikasi/baru) tidak menampilkan Reviewer Internal Opsional dan menyediakan tombol Kembali untuk semua role', () => {
  const pagePath = path.resolve(__dirname, '../src/app/dashboard/publikasi/baru/page.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');

  assert.equal(
    content.includes('Dosen Reviewer Internal'),
    false,
    'Form Tambah Publikasi tidak boleh menampilkan section Dosen Reviewer Internal (Opsional)'
  );
  assert.equal(
    content.includes('Tanpa Reviewer Internal'),
    false,
    'Form Tambah Publikasi tidak boleh memiliki opsi dropdown Tanpa Reviewer Internal'
  );

  // Back button (Link to /dashboard/publikasi with ArrowLeft) must be shown for all roles
  assert.ok(
    content.includes('ArrowLeft') && content.includes('href="/dashboard/publikasi"'),
    'Form Tambah Publikasi harus memiliki tombol back Link ke /dashboard/publikasi dengan ikon ArrowLeft'
  );

  const branchIndex = content.search(/(?:if\s*\(\s*isKaprodi\s*\)|isKaprodi\s*\?)/);
  const backLinkIndex = content.indexOf('href="/dashboard/publikasi"');

  assert.ok(
    backLinkIndex !== -1 && branchIndex !== -1 && backLinkIndex < branchIndex,
    'Tombol back ke /dashboard/publikasi harus dirender di luar percabangan role agar tampil untuk semua role'
  );
});

test('Dosen Verifikator memiliki daftar dummy fallback dan otomatis terpasang sebagai pembimbing saat ajukan publikasi', async () => {
  const {
    DUMMY_VERIFIER_LECTURERS,
    resolveEligibleVerifiers,
    ensureVerifierAuthor,
  } = await import('../src/lib/publication-verifiers.ts');

  assert.ok(
    Array.isArray(DUMMY_VERIFIER_LECTURERS) && DUMMY_VERIFIER_LECTURERS.length >= 2,
    'DUMMY_VERIFIER_LECTURERS harus menyediakan minimal 2 dosen dummy'
  );

  // When backend only returns current user (u1) or empty, dummy fallback kicks in
  const fallbackFromSingle = resolveEligibleVerifiers(
    [{ id: 'u1', nama: 'Dr. Eng. Dosen Kaprodi, S.T., M.Eng.' }],
    'u1',
    [{ nama: 'Mahasiswa Satu', tipe: 'MAHASISWA', peran: 'PENULIS_PERTAMA' }]
  );
  assert.ok(
    fallbackFromSingle.length >= 2,
    'resolveEligibleVerifiers harus memakai DUMMY_VERIFIER_LECTURERS saat daftar dosen selain user aktif kosong'
  );

  // When no lecturer co-author has been typed yet, all candidates remain selectable
  const candidatePool = resolveEligibleVerifiers(
    [
      { id: 'u1', nama: 'User Aktif' },
      { id: 'd2', nama: 'Dosen Pembimbing A' },
      { id: 'd3', nama: 'Dosen Pembimbing B' },
    ],
    'u1',
    [{ nama: 'Mahasiswa Satu', tipe: 'MAHASISWA', peran: 'PENULIS_PERTAMA' }]
  );
  assert.equal(candidatePool.length, 2);

  // When a matching lecturer co-author is explicitly typed, narrow to that lecturer
  const narrowed = resolveEligibleVerifiers(
    [
      { id: 'd2', nama: 'Dosen Pembimbing A' },
      { id: 'd3', nama: 'Dosen Pembimbing B' },
    ],
    'u1',
    [
      { nama: 'Mahasiswa Satu', tipe: 'MAHASISWA', peran: 'PENULIS_PERTAMA' },
      { nama: 'dosen pembimbing b', tipe: 'DOSEN', peran: 'PEMBIMBING' },
    ]
  );
  assert.deepEqual(
    narrowed.map((d) => d.id),
    ['d3']
  );

  // Submitting with selected verifier automatically attaches PEMBIMBING author immutably
  const initialAuthors = [
    {
      id: '',
      user_id: 'u1',
      nama_penulis: 'Mahasiswa Satu',
      tipe_penulis: 'MAHASISWA',
      peran: 'PENULIS_PERTAMA',
      urutan: 1,
    },
  ];
  const withSupervisor = ensureVerifierAuthor(initialAuthors, DUMMY_VERIFIER_LECTURERS[0]);
  assert.equal(initialAuthors.length, 1, 'authors asli tidak boleh termutasi');
  assert.equal(withSupervisor.length, 2);
  assert.equal(withSupervisor[1].user_id, DUMMY_VERIFIER_LECTURERS[0].id);
  assert.equal(withSupervisor[1].tipe_penulis, 'DOSEN');
  assert.equal(withSupervisor[1].peran, 'PEMBIMBING');

  const pagePath = path.resolve(__dirname, '../src/app/dashboard/publikasi/baru/page.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert.ok(
    content.includes('resolveEligibleVerifiers') && content.includes('ensureVerifierAuthor'),
    'Form Tambah Publikasi harus menggunakan resolveEligibleVerifiers dan ensureVerifierAuthor'
  );
});
