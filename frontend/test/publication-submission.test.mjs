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

  // 1. Submit a student publication with verifikator
  const newPubId = 'PUB-TEST-001';
  const newPub = {
    id: newPubId,
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

  const updatedPubs = storageSync.prepend(STORAGE_KEYS.PUBLICATIONS, newPub, initialPubs);
  assert.equal(updatedPubs.length, 2);
  assert.equal(updatedPubs[0].id, newPubId);
  assert.equal(updatedPubs[0].status_verifikasi, 'MENUNGGU');

  // 2. Add to verification queue
  const newVerif = {
    id: 'ver-test-001',
    publication_id: newPubId,
    judul: newPub.judul,
    jenis: newPub.jenis,
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

  // 3. Lecturer verifies and approves the submission
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
    newPubId,
    { status_verifikasi: 'TERVERIFIKASI' },
    updatedPubs
  );
  const targetPub = afterApprovedPubs.find((p) => p.id === newPubId);
  assert.equal(targetPub?.status_verifikasi, 'TERVERIFIKASI');
});
