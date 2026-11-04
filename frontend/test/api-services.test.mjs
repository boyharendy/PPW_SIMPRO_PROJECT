import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('endpoints.ts defines all routes for Modul 7-13 and cross-module', () => {
  const filePath = path.resolve('src/lib/api/endpoints.ts');
  assert.equal(fs.existsSync(filePath), true, 'endpoints.ts must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify Modul 7: Kepuasan Mitra
  assert.match(content, /SURVEYS:\s*\{/);
  assert.match(content, /LIST:\s*['"]\/surveys['"]/);
  assert.match(content, /INVITATIONS:\s*['"]\/surveys\/invitations['"]/);
  assert.match(content, /\/surveys\/\$\{id\}\/recap/);

  // Verify Modul 8: Publikasi Ilmiah
  assert.match(content, /PUBLICATIONS:\s*\{/);
  assert.match(content, /LIST:\s*['"]\/publications['"]/);
  assert.match(content, /RECAP:\s*['"]\/publications\/recap['"]/);
  assert.match(content, /\/publications\/\$\{id\}\/verify/);

  // Verify Modul 9: Perjalanan Dinas
  assert.match(content, /TRIPS:\s*\{/);
  assert.match(content, /LIST:\s*['"]\/trips['"]/);
  assert.match(content, /RECAP:\s*['"]\/trips\/recap['"]/);
  assert.match(content, /\/trips\/\$\{id\}\/approve/);

  // Verify Modul 10: RKA Prodi
  assert.match(content, /RKA:\s*\{/);
  assert.match(content, /LIST:\s*['"]\/rka['"]/);
  assert.match(content, /\/rka\/\$\{tahun\}\/serapan/);

  // Verify Modul 11: Review RPS
  assert.match(content, /RPS:\s*\{/);
  assert.match(content, /LIST:\s*['"]\/rps['"]/);
  assert.match(content, /\/rps\/\$\{id\}\/ratify/);

  // Verify Modul 12: Evaluasi Perkuliahan
  assert.match(content, /EVALUATIONS:\s*\{/);
  assert.match(content, /LIST:\s*['"]\/evaluations['"]/);
  assert.match(content, /\/evaluations\/class\/\$\{classId\}/);

  // Verify Modul 13: Layanan Aduan
  assert.match(content, /COMPLAINTS:\s*\{/);
  assert.match(content, /LIST:\s*['"]\/complaints['"]/);
  assert.match(content, /RECAP:\s*['"]\/complaints\/recap['"]/);
  assert.match(content, /\/complaints\/\$\{id\}\/dispositions/);

  // Verify Public Routes
  assert.match(content, /PUBLIC:\s*\{/);
  assert.match(content, /COMPLAINT_CREATE:\s*['"]\/public\/complaints['"]/);
  assert.match(content, /SURVEY_SUBMIT/);
});
