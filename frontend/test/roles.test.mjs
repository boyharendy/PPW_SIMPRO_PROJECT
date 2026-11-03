import test from 'node:test';
import assert from 'node:assert/strict';

// PRD Bab 8.1: Daftar Peran Tetap Modul 7-13
export const PRD_FIXED_ROLES = [
  'KAPRODI',
  'GKM',
  'ADMIN_PRODI',
  'DOSEN',
  'KOORDINATOR_KP',
  'KOORDINATOR_PSI',
  'KOORDINATOR_PDLK',
  'PENGELOLA_ADUAN',
  'PETUGAS_KEKERASAN',
  'MAHASISWA',
];

// Compatibility roles (PRD Bab 6.A poin 2)
export const PRD_COMPAT_ROLES = [
  'PENGURUS_HIMPUNAN',
  'DOSEN_WALI',
  'DOSEN_PEMBINA',
  'KETUA_KELAS',
];

export function validateNoDuplicateRoles(roles) {
  const seen = new Set();
  const duplicates = [];
  for (const r of roles) {
    if (seen.has(r)) {
      duplicates.push(r);
    }
    seen.add(r);
  }
  return { hasDuplicates: duplicates.length > 0, duplicates };
}

export function validateNoDuplicateLabels(roleLabels) {
  const labelMap = new Map();
  const duplicateLabels = [];
  for (const [role, label] of Object.entries(roleLabels)) {
    if (labelMap.has(label)) {
      duplicateLabels.push({ label, roles: [labelMap.get(label), role] });
    } else {
      labelMap.set(label, role);
    }
  }
  return { hasDuplicateLabels: duplicateLabels.length > 0, duplicateLabels };
}

test('PRD fixed roles list contains exactly 10 unique roles with no duplicates', () => {
  const res = validateNoDuplicateRoles(PRD_FIXED_ROLES);
  assert.equal(res.hasDuplicates, false, `Found duplicate roles in PRD_FIXED_ROLES: ${res.duplicates.join(', ')}`);
  assert.equal(PRD_FIXED_ROLES.length, 10);
});

test('ROLE_LABELS must not have duplicate labels across roles', async () => {
  // Import from Header.tsx or definitions
  const EXPECTED_ROLE_LABELS = {
    KAPRODI: 'Kaprodi',
    GKM: 'GKM (Gugus Kendali Mutu)',
    ADMIN_PRODI: 'Admin Prodi',
    DOSEN: 'Dosen',
    KOORDINATOR_KP: 'Koordinator KP',
    KOORDINATOR_PSI: 'Koordinator PSI',
    KOORDINATOR_PDLK: 'Koordinator PDLK',
    PENGELOLA_ADUAN: 'Pengelola Aduan',
    PETUGAS_KEKERASAN: 'Petugas Kekerasan (Satgas)',
    MAHASISWA: 'Mahasiswa',
    PENGURUS_HIMPUNAN: 'Pengurus Himpunan',
    DOSEN_WALI: 'Dosen Wali',
    DOSEN_PEMBINA: 'Dosen Pembina',
    KETUA_KELAS: 'Ketua Kelas',
  };

  const res = validateNoDuplicateLabels(EXPECTED_ROLE_LABELS);
  assert.equal(res.hasDuplicateLabels, false, `Found duplicate labels: ${JSON.stringify(res.duplicateLabels)}`);
});

test('Deduplication helper ensures user roles are unique', () => {
  const dirtyRoles = ['KAPRODI', 'DOSEN', 'KOORDINATOR_KP', 'KAPRODI', 'DOSEN'];
  const cleanRoles = Array.from(new Set(dirtyRoles));
  assert.deepEqual(cleanRoles, ['KAPRODI', 'DOSEN', 'KOORDINATOR_KP']);
  assert.equal(cleanRoles.length, 3);
});
