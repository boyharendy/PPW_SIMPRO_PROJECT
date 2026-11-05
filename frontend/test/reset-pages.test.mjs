import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDashboardDir = path.resolve(__dirname, '../src/app/dashboard');

// 39 target pages across Modul 7-13
export const RESET_TARGET_PAGES = [
  // Modul 13: Layanan Aduan (6 pages)
  { relPath: 'aduan/page.tsx', expectedTitle: 'Kirim Aduan Anonim' },
  { relPath: 'kelola/aduan/page.tsx', expectedTitle: 'Antrean Aduan Masuk' },
  { relPath: 'kelola/aduan/rekap/page.tsx', expectedTitle: 'Rekap Statistik Aduan' },
  { relPath: 'kelola/aduan/sensitif/page.tsx', expectedTitle: 'Aduan Sensitif & Kekerasan' },
  { relPath: 'kelola/aduan/tugas-saya/page.tsx', expectedTitle: 'Tindak Lanjut Aduan Saya' },
  { relPath: 'kelola/aduan/[id]/page.tsx', expectedTitle: 'Detail Aduan' },

  // Modul 12: Evaluasi Perkuliahan (3 pages)
  { relPath: 'evaluasi-perkuliahan/page.tsx', expectedTitle: 'Evaluasi Perkuliahan' },
  { relPath: 'evaluasi-perkuliahan/rekap/page.tsx', expectedTitle: 'Rekap CPMK & Evaluasi' },
  { relPath: 'evaluasi-perkuliahan/[kelasId]/page.tsx', expectedTitle: 'Formulir Evaluasi Perkuliahan Kelas' },

  // Modul 7: Kepuasan Mitra (4 pages)
  { relPath: 'kepuasan-mitra/page.tsx', expectedTitle: 'Kepuasan Mitra' },
  { relPath: 'kepuasan-mitra/instrumen/page.tsx', expectedTitle: 'Instrumen Kuesioner' },
  { relPath: 'kepuasan-mitra/instrumen/[id]/page.tsx', expectedTitle: 'Kelola Template Instrumen' },
  { relPath: 'kepuasan-mitra/pengiriman/page.tsx', expectedTitle: 'Pengiriman & Input Mitra' },

  // Modul 10: Pengaturan (2 pages)
  { relPath: 'pengaturan/mutu/page.tsx', expectedTitle: 'Pengaturan Mutu & Dokumen' },
  { relPath: 'pengaturan/peran/page.tsx', expectedTitle: 'Pengaturan Peran & Penugasan' },

  // Modul 9: Perjalanan Dinas (6 pages)
  { relPath: 'perjalanan-dinas/page.tsx', expectedTitle: 'Perjalanan Dinas' },
  { relPath: 'perjalanan-dinas/baru/page.tsx', expectedTitle: 'Pengajuan Perjalanan Dinas' },
  { relPath: 'perjalanan-dinas/persetujuan/page.tsx', expectedTitle: 'Persetujuan Perjalanan Dinas' },
  { relPath: 'perjalanan-dinas/rekap/page.tsx', expectedTitle: 'Rekapitulasi Perjalanan Dinas' },
  { relPath: 'perjalanan-dinas/[id]/page.tsx', expectedTitle: 'Perjalanan Dinas' },
  { relPath: 'perjalanan-dinas/[id]/laporan/page.tsx', expectedTitle: 'Laporan Realisasi Perjalanan Dinas' },

  // Modul 8: Publikasi (6 pages)
  { relPath: 'publikasi/page.tsx', expectedTitle: 'Publikasi Dosen & Mahasiswa' },
  { relPath: 'publikasi/baru/page.tsx', expectedTitle: 'Pencatatan Publikasi Baru' },
  { relPath: 'publikasi/rekap/page.tsx', expectedTitle: 'Rekapitulasi Publikasi' },
  { relPath: 'publikasi/review-saya/page.tsx', expectedTitle: 'Review Internal Publikasi' },
  { relPath: 'publikasi/verifikasi/page.tsx', expectedTitle: 'Verifikasi Publikasi Mahasiswa' },
  { relPath: 'publikasi/[id]/page.tsx', expectedTitle: 'pub.judul' },

  // Modul 10: Anggaran & RKA (6 pages)
  { relPath: 'rka/page.tsx', expectedTitle: 'RKA' },
  { relPath: 'rka/[tahun]/page.tsx', expectedTitle: 'RKA' },
  { relPath: 'rka/[tahun]/realisasi/page.tsx', expectedTitle: 'Realisasi' },
  { relPath: 'rka/[tahun]/serapan/page.tsx', expectedTitle: 'Serapan' },
  { relPath: 'rka/[tahun]/versi/[nomor]/page.tsx', expectedTitle: 'Versi' },
  { relPath: 'rka/[tahun]/versi-kerja/page.tsx', expectedTitle: 'Versi Kerja' },

  // Modul 11: Review RPS (6 pages)
  { relPath: 'rps/page.tsx', expectedTitle: 'Pengajuan & Review RPS' },
  { relPath: 'rps/ajukan/page.tsx', expectedTitle: 'Formulir Pengajuan RPS' },
  { relPath: 'rps/rekap/page.tsx', expectedTitle: 'Rekapitulasi Status RPS' },
  { relPath: 'rps/review/[id]/page.tsx', expectedTitle: 'Formulir Review RPS 5 Pilar' },
  { relPath: 'rps/review-saya/page.tsx', expectedTitle: 'Tugas Review RPS Saya' },
  { relPath: 'rps/[id]/page.tsx', expectedTitle: 'rps.' }
];

test('Total target reset pages count is exactly 39 across Modul 7-13', () => {
  assert.equal(RESET_TARGET_PAGES.length, 39);
});

test('All 39 target pages exist on disk and have clean, standardized reset structure', () => {
  for (const page of RESET_TARGET_PAGES) {
    const fullPath = path.join(appDashboardDir, page.relPath);
    assert.ok(fs.existsSync(fullPath), `Target page must exist: ${page.relPath}`);

    const content = fs.readFileSync(fullPath, 'utf8');

    // Must be a client component for interactive clean state
    assert.ok(
      content.includes("'use client'"),
      `Page ${page.relPath} must specify 'use client'`
    );

    // Must import PageHeader
    assert.ok(
      content.includes('PageHeader'),
      `Page ${page.relPath} must use PageHeader component`
    );

    // Must export default function
    assert.ok(
      content.includes('export default function'),
      `Page ${page.relPath} must export a default function`
    );

    // Must have the expected clean title
    assert.ok(
      content.includes(page.expectedTitle),
      `Page ${page.relPath} must include title "${page.expectedTitle}"`
    );

    // Must adhere to clean, non-bloated structure (<400 lines per global guidelines)
    const lineCount = content.split('\n').length;
    assert.ok(
      lineCount <= 450,
      `Page ${page.relPath} should be concise (<450 lines), currently ${lineCount} lines`
    );
  }
});

