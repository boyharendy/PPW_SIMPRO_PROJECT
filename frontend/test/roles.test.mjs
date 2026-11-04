import test from 'node:test';
import assert from 'node:assert/strict';

// 13 Aktor Utama SIMPRO (sesuai spesifikasi pengguna)
export const CANONICAL_ACTORS = [
  'KAPRODI',
  'GKM',
  'ADMIN_PRODI',
  'DOSEN',
  'DOSEN_VERIFIKATOR',
  'DOSEN_WALI',
  'DOSEN_PEMBINA',
  'KETUA_KELAS',
  'MAHASISWA',
  'PENGURUS_HIMPUNAN',
  'KOORDINATOR_KP_PSI_PDLK',
  'PENGELOLA_ADUAN',
  'MITRA',
];

export const CANONICAL_ROLE_LABELS = {
  KAPRODI: 'Kaprodi',
  GKM: 'GKM',
  ADMIN_PRODI: 'Admin Prodi',
  DOSEN: 'Dosen',
  DOSEN_VERIFIKATOR: 'Dosen Verifikator',
  DOSEN_WALI: 'Dosen Wali',
  DOSEN_PEMBINA: 'Dosen Pembina Himpunan / UKM',
  KETUA_KELAS: 'Ketua Kelas',
  MAHASISWA: 'Mahasiswa',
  PENGURUS_HIMPUNAN: 'Pengurus Himpunan',
  KOORDINATOR_KP_PSI_PDLK: 'Koordinator KP / PSI / PDLK',
  PENGELOLA_ADUAN: 'Pengelola Aduan',
  MITRA: 'Mitra (eksternal)',
};

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

test('Daftar aktor utama SIMPRO memuat tepat 13 peran unik tanpa duplikasi', () => {
  const res = validateNoDuplicateRoles(CANONICAL_ACTORS);
  assert.equal(res.hasDuplicates, false, `Terdapat peran duplikat: ${res.duplicates.join(', ')}`);
  assert.equal(CANONICAL_ACTORS.length, 13, 'Jumlah aktor utama harus tepat 13');
});

test('CANONICAL_ROLE_LABELS memetakan seluruh 13 aktor dengan label unik dan benar', () => {
  assert.equal(Object.keys(CANONICAL_ROLE_LABELS).length, 13);
  for (const role of CANONICAL_ACTORS) {
    assert.ok(CANONICAL_ROLE_LABELS[role], `Peran ${role} harus memiliki label`);
  }
  const res = validateNoDuplicateLabels(CANONICAL_ROLE_LABELS);
  assert.equal(res.hasDuplicateLabels, false, `Terdapat label duplikat: ${JSON.stringify(res.duplicateLabels)}`);
});

test('Label masing-masing aktor sesuai persis dengan permintaan pengguna', () => {
  assert.equal(CANONICAL_ROLE_LABELS.KAPRODI, 'Kaprodi');
  assert.equal(CANONICAL_ROLE_LABELS.GKM, 'GKM');
  assert.equal(CANONICAL_ROLE_LABELS.ADMIN_PRODI, 'Admin Prodi');
  assert.equal(CANONICAL_ROLE_LABELS.DOSEN, 'Dosen');
  assert.equal(CANONICAL_ROLE_LABELS.DOSEN_VERIFIKATOR, 'Dosen Verifikator');
  assert.equal(CANONICAL_ROLE_LABELS.DOSEN_WALI, 'Dosen Wali');
  assert.equal(CANONICAL_ROLE_LABELS.DOSEN_PEMBINA, 'Dosen Pembina Himpunan / UKM');
  assert.equal(CANONICAL_ROLE_LABELS.KETUA_KELAS, 'Ketua Kelas');
  assert.equal(CANONICAL_ROLE_LABELS.MAHASISWA, 'Mahasiswa');
  assert.equal(CANONICAL_ROLE_LABELS.PENGURUS_HIMPUNAN, 'Pengurus Himpunan');
  assert.equal(CANONICAL_ROLE_LABELS.KOORDINATOR_KP_PSI_PDLK, 'Koordinator KP / PSI / PDLK');
  assert.equal(CANONICAL_ROLE_LABELS.PENGELOLA_ADUAN, 'Pengelola Aduan');
  assert.equal(CANONICAL_ROLE_LABELS.MITRA, 'Mitra (eksternal)');
});

test('Deduplikasi peran pengguna bekerja dengan baik', () => {
  const dirtyRoles = ['KAPRODI', 'DOSEN', 'MITRA', 'KAPRODI', 'DOSEN'];
  const cleanRoles = Array.from(new Set(dirtyRoles));
  assert.deepEqual(cleanRoles, ['KAPRODI', 'DOSEN', 'MITRA']);
  assert.equal(cleanRoles.length, 3);
});

export function isRoleAuthorized(allowedRoles, currentRole) {
  if (allowedRoles.includes(currentRole)) return true;
  if (currentRole === 'KOORDINATOR_KP_PSI_PDLK') {
    return allowedRoles.some(r => r === 'KOORDINATOR_KP' || r === 'KOORDINATOR_PSI' || r === 'KOORDINATOR_PDLK' || r === 'KOORDINATOR_KP_PSI_PDLK');
  }
  if (currentRole === 'KOORDINATOR_KP' || currentRole === 'KOORDINATOR_PSI' || currentRole === 'KOORDINATOR_PDLK') {
    return allowedRoles.includes('KOORDINATOR_KP_PSI_PDLK');
  }
  if (currentRole === 'MITRA') {
    return allowedRoles.includes('MITRA_EKSTERNAL');
  }
  if (currentRole === 'MITRA_EKSTERNAL') {
    return allowedRoles.includes('MITRA');
  }
  if (currentRole === 'PENGELOLA_ADUAN') {
    return allowedRoles.includes('PETUGAS_KEKERASAN');
  }
  if (currentRole === 'PETUGAS_KEKERASAN') {
    return allowedRoles.includes('PENGELOLA_ADUAN');
  }
  if (currentRole === 'PENGURUS_HIMPUNAN') {
    return allowedRoles.includes('HIMPUNAN');
  }
  if (currentRole === 'HIMPUNAN') {
    return allowedRoles.includes('PENGURUS_HIMPUNAN');
  }
  return false;
}

test('isRoleAuthorized mendukung kompatibilitas Koordinator KP / PSI / PDLK', () => {
  const kpItemRoles = ['KOORDINATOR_KP', 'KAPRODI'];
  assert.equal(isRoleAuthorized(kpItemRoles, 'KOORDINATOR_KP_PSI_PDLK'), true);
  assert.equal(isRoleAuthorized(['KOORDINATOR_KP_PSI_PDLK'], 'KOORDINATOR_KP'), true);
  assert.equal(isRoleAuthorized(['KOORDINATOR_KP_PSI_PDLK'], 'KOORDINATOR_PSI'), true);
  assert.equal(isRoleAuthorized(['KOORDINATOR_KP_PSI_PDLK'], 'KOORDINATOR_PDLK'), true);
});

test('isRoleAuthorized mendukung kompatibilitas Mitra dan Pengelola Aduan', () => {
  assert.equal(isRoleAuthorized(['MITRA_EKSTERNAL'], 'MITRA'), true);
  assert.equal(isRoleAuthorized(['MITRA'], 'MITRA_EKSTERNAL'), true);
  assert.equal(isRoleAuthorized(['PETUGAS_KEKERASAN'], 'PENGELOLA_ADUAN'), true);
  assert.equal(isRoleAuthorized(['PENGELOLA_ADUAN'], 'PETUGAS_KEKERASAN'), true);
  assert.equal(isRoleAuthorized(['HIMPUNAN'], 'PENGURUS_HIMPUNAN'), true);
});

test('Semua 13 aktor kanonikal memiliki otorisasi tepat ke hak aksesnya sendiri', () => {
  for (const role of CANONICAL_ACTORS) {
    assert.equal(isRoleAuthorized([role], role), true, `${role} harus mengotorisasi dirinya sendiri`);
  }
});
