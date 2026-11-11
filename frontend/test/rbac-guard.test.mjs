import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccess, isRoleAuthorized, NAV_ITEMS } from '../src/lib/navigation.ts';

test('RBAC canAccess: Mahasiswa DITOLAK pada rute-rute milik Kaprodi/Admin/Dosen', () => {
  const mhsRestrictedRoutes = [
    '/dashboard/rka',
    '/dashboard/rka/2025/serapan',
    '/dashboard/rka/2025/realisasi',
    '/dashboard/perjalanan-dinas/persetujuan',
    '/dashboard/perjalanan-dinas/rekap',
    '/dashboard/pengaturan/peran',
    '/dashboard/pengaturan/mutu',
    '/dashboard/kelola/aduan',
    '/dashboard/kelola/aduan/sensitif',
    '/dashboard/kelola/aduan/rekap',
    '/dashboard/kelola/aduan/tugas-saya',
    '/dashboard/rps',
    '/dashboard/rps/ajukan',
    '/dashboard/rps/review-saya',
    '/dashboard/rps/rekap',
    '/dashboard/evaluasi-perkuliahan',
    '/dashboard/evaluasi-perkuliahan/rekap',
    '/dashboard/perwalian',
    '/dashboard/perwalian/rekap',
    '/dashboard/beasiswa',
    '/dashboard/beasiswa/verifikasi',
    '/dashboard/beasiswa/rekap',
    '/dashboard/pelanggaran',
    '/dashboard/pelanggaran/verifikasi',
    '/dashboard/pelanggaran/retensi',
    '/dashboard/himpunan/verifikasi',
    '/dashboard/sertifikat/verifikasi',
    '/dashboard/sertifikat/rekap',
    '/dashboard/kepuasan-mitra',
    '/dashboard/kepuasan-mitra/instrumen',
    '/dashboard/kepuasan-mitra/pengiriman',
  ];

  for (const route of mhsRestrictedRoutes) {
    assert.equal(
      canAccess(route, 'MAHASISWA'),
      false,
      `Mahasiswa seharusnya TIDAK boleh mengakses rute ${route}`
    );
  }
});

test('RBAC canAccess: Mahasiswa DIIZINKAN pada rute resmi kemahasiswaannya', () => {
  const mhsAllowedRoutes = [
    '/dashboard',
    '/dashboard/aduan',
    '/dashboard/beasiswa/jam-karya',
    '/dashboard/pelanggaran/sanksi-saya',
    '/dashboard/ukm',
    '/dashboard/ukm/keanggotaan',
    '/dashboard/sertifikat',
    '/dashboard/publikasi',
    '/dashboard/publikasi/baru',
  ];

  for (const route of mhsAllowedRoutes) {
    assert.equal(
      canAccess(route, 'MAHASISWA'),
      true,
      `Mahasiswa seharusnya DIIZINKAN mengakses rute ${route}`
    );
  }
});

test('RBAC canAccess: Kaprodi dapat mengakses modul tata kelola dan monitoring', () => {
  assert.equal(canAccess('/dashboard', 'KAPRODI'), true);
  assert.equal(canAccess('/dashboard/rka', 'KAPRODI'), true);
  assert.equal(canAccess('/dashboard/rka/2025/serapan', 'KAPRODI'), true);
  assert.equal(canAccess('/dashboard/perjalanan-dinas/persetujuan', 'KAPRODI'), true);
  assert.equal(canAccess('/dashboard/pengaturan/peran', 'KAPRODI'), true);
  assert.equal(canAccess('/dashboard/kelola/aduan', 'KAPRODI'), true);
  assert.equal(canAccess('/dashboard/perwalian', 'KAPRODI'), true);

  // Kaprodi bukan mahasiswa pengisi mandiri
  assert.equal(canAccess('/dashboard/aduan', 'KAPRODI'), false);
  assert.equal(canAccess('/dashboard/beasiswa/jam-karya', 'KAPRODI'), false);
  assert.equal(canAccess('/dashboard/pelanggaran/sanksi-saya', 'KAPRODI'), false);
});

test('RBAC canAccess: Mitra Eksternal tidak memiliki akun dashboard internal', () => {
  assert.equal(canAccess('/dashboard', 'MITRA'), false);
  assert.equal(canAccess('/dashboard/kepuasan-mitra', 'MITRA'), false);
  // Namun rute publik di luar /dashboard dapat diakses siapa saja
  assert.equal(canAccess('/mitra/isi/tok-telkom-2025', 'MITRA'), true);
  assert.equal(canAccess('/', 'MITRA'), true);
});

test('RBAC canAccess: Rute tak dikenal di bawah /dashboard ditolak secara default (Deny by Default)', () => {
  assert.equal(canAccess('/dashboard/modul-hacker', 'MAHASISWA'), false);
  assert.equal(canAccess('/dashboard/secret-endpoint', 'KAPRODI'), false);
});

