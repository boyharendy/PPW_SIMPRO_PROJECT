import test from 'node:test';
import assert from 'node:assert/strict';

test('PRDnew.md: PGL-K is a designation on PENGELOLA_ADUAN with penanganan_kekerasan flag', () => {
  const pengelolaAduanRole = {
    user_id: 'u-pengelola',
    role: 'PENGELOLA_ADUAN',
    penanganan_kekerasan: true, // PGL-K
  };

  assert.equal(pengelolaAduanRole.role, 'PENGELOLA_ADUAN');
  assert.equal(pengelolaAduanRole.penanganan_kekerasan, true);

  // Constraint according to PRDnew Table 2 & Section 8.1:
  // CHECK (penanganan_kekerasan = false OR role = 'PENGELOLA_ADUAN')
  const isValidPglK = (r) => r.penanganan_kekerasan === false || r.role === 'PENGELOLA_ADUAN';
  assert.equal(isValidPglK(pengelolaAduanRole), true);

  const invalidRoleWithPglK = {
    user_id: 'u-dosen',
    role: 'DOSEN',
    penanganan_kekerasan: true,
  };
  assert.equal(isValidPglK(invalidRoleWithPglK), false);
});

test('PRDnew.md: Kaprodi appointments are strictly Pengelola Aduan and Dosen Verifikator', () => {
  const allowedKaprodiAppointments = ['PENGELOLA_ADUAN', 'DOSEN_VERIFIKATOR'];
  assert.equal(allowedKaprodiAppointments.includes('PENGELOLA_ADUAN'), true);
  assert.equal(allowedKaprodiAppointments.includes('DOSEN_VERIFIKATOR'), true);

  // Synchronized roles (SIAKAD & SIMPRO) should NOT be arbitrarily appointed from /pengaturan/peran
  const synchronizedRoles = ['DOSEN', 'MAHASISWA', 'ADMIN_PRODI', 'GKM', 'KOORDINATOR_KP'];
  for (const syncRole of synchronizedRoles) {
    assert.equal(allowedKaprodiAppointments.includes(syncRole), false);
  }
});

test('PRDnew.md Section 8.2: Role scoping for app_settings', () => {
  const canEditSetting = (role, settingKey) => {
    if (role === 'KAPRODI') return true;
    if (role === 'ADMIN_PRODI') return settingKey === 'max_upload_mb';
    return false;
  };

  // Kaprodi can edit all settings
  assert.equal(canEditSetting('KAPRODI', 'token_mitra_expiry_hari'), true);
  assert.equal(canEditSetting('KAPRODI', 'max_upload_mb'), true);
  assert.equal(canEditSetting('KAPRODI', 'aduan_mode'), true);

  // Admin Prodi can ONLY edit max_upload_mb (NF-08)
  assert.equal(canEditSetting('ADMIN_PRODI', 'max_upload_mb'), true);
  assert.equal(canEditSetting('ADMIN_PRODI', 'token_mitra_expiry_hari'), false);
  assert.equal(canEditSetting('ADMIN_PRODI', 'rps_review_default_days'), false);
});

test('PRDnew.md FR-50 & D1: Sensitive complaint visibility scoping', () => {
  const getComplaintVisibility = (role, isSensitif, penangananKekerasan) => {
    if (!isSensitif) return 'FULL';
    if (role === 'PENGELOLA_ADUAN' && penangananKekerasan) return 'FULL'; // PGL-K
    if (role === 'KAPRODI') return 'METADATA_ONLY'; // Kaprodi sees metadata without case text
    return 'DENIED';
  };

  // Regular complaint: full for both
  assert.equal(getComplaintVisibility('KAPRODI', false, false), 'FULL');
  assert.equal(getComplaintVisibility('PENGELOLA_ADUAN', false, false), 'FULL');

  // Sensitive complaint (FR-50)
  assert.equal(getComplaintVisibility('PENGELOLA_ADUAN', true, true), 'FULL'); // PGL-K has full case access
  assert.equal(getComplaintVisibility('PENGELOLA_ADUAN', true, false), 'DENIED'); // Regular PGL without designation cannot view
  assert.equal(getComplaintVisibility('KAPRODI', true, false), 'METADATA_ONLY'); // Kaprodi metadata view only
  assert.equal(getComplaintVisibility('DOSEN', true, false), 'DENIED');
  assert.equal(getComplaintVisibility('ADMIN_PRODI', true, false), 'DENIED');
});

