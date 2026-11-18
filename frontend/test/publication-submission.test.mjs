import test from 'node:test';
import assert from 'node:assert/strict';
import { storageSync, STORAGE_KEYS } from '../src/lib/storage-sync.ts';

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
