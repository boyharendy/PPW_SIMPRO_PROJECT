import type { NavItem } from '@/lib/types';

export const NAV_ITEMS: NavItem[] = [
  // 1. Dashboard
  {
    title: 'Dashboard Utama',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: [
      'KAPRODI', 'GKM', 'ADMIN_PRODI', 'DOSEN', 'DOSEN_VERIFIKATOR',
      'DOSEN_WALI', 'DOSEN_PEMBINA', 'KETUA_KELAS', 'MAHASISWA',
      'PENGURUS_HIMPUNAN', 'KOORDINATOR_KP_PSI_PDLK', 'PENGELOLA_ADUAN', 'MITRA',
      'KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'PETUGAS_KEKERASAN', 'HIMPUNAN'
    ],
    category: 'Utama',
  },

  // Modul 1 — Laporan Perwalian
  {
    title: 'Laporan Perwalian',
    href: '/dashboard/perwalian',
    icon: 'Users',
    roles: ['KETUA_KELAS', 'DOSEN_WALI', 'DOSEN', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Laporan Perwalian',
  },
  {
    title: 'Rekap & Isu Perwalian',
    href: '/dashboard/perwalian/rekap',
    icon: 'PieChart',
    roles: ['KAPRODI', 'DOSEN_WALI', 'DOSEN', 'ADMIN_PRODI'],
    category: 'Laporan Perwalian',
  },

  // Modul 2 — Beasiswa & Jam Karya
  {
    title: 'Penerima Beasiswa',
    href: '/dashboard/beasiswa',
    icon: 'Award',
    roles: ['ADMIN_PRODI', 'KAPRODI', 'DOSEN_VERIFIKATOR', 'DOSEN'],
    category: 'Beasiswa & Jam Karya',
  },
  {
    title: 'Catat Jam Karya',
    href: '/dashboard/beasiswa/jam-karya',
    icon: 'Clock',
    roles: ['MAHASISWA', 'KAPRODI'],
    category: 'Beasiswa & Jam Karya',
  },
  {
    title: 'Verifikasi Jam Karya',
    href: '/dashboard/beasiswa/verifikasi',
    icon: 'FileCheck',
    roles: ['DOSEN_VERIFIKATOR', 'DOSEN_WALI', 'DOSEN', 'KAPRODI'],
    category: 'Beasiswa & Jam Karya',
  },
  {
    title: 'Rekap Pemenuhan Jam',
    href: '/dashboard/beasiswa/rekap',
    icon: 'PieChart',
    roles: ['ADMIN_PRODI', 'KAPRODI', 'DOSEN_VERIFIKATOR', 'DOSEN'],
    category: 'Beasiswa & Jam Karya',
  },

  // Modul 3 — Pelanggaran & Sanksi Sosial
  {
    title: 'Data Pelanggaran',
    href: '/dashboard/pelanggaran',
    icon: 'ShieldAlert',
    roles: ['KAPRODI', 'DOSEN_WALI', 'DOSEN', 'DOSEN_VERIFIKATOR'],
    category: 'Pelanggaran & Sanksi',
  },
  {
    title: 'Sanksi Sosial Saya',
    href: '/dashboard/pelanggaran/sanksi-saya',
    icon: 'Clock',
    roles: ['MAHASISWA'],
    category: 'Pelanggaran & Sanksi',
  },
  {
    title: 'Verifikasi Sanksi Sosial',
    href: '/dashboard/pelanggaran/verifikasi',
    icon: 'FileCheck',
    roles: ['DOSEN_VERIFIKATOR', 'DOSEN_WALI', 'DOSEN', 'KAPRODI'],
    category: 'Pelanggaran & Sanksi',
  },
  {
    title: 'Log Retensi (UU PDP)',
    href: '/dashboard/pelanggaran/retensi',
    icon: 'FileText',
    roles: ['KAPRODI'],
    category: 'Pelanggaran & Sanksi',
  },

  // Modul 4 — Unit Kegiatan Mahasiswa (UKM)
  {
    title: 'Direktori UKM',
    href: '/dashboard/ukm',
    icon: 'Compass',
    roles: ['ADMIN_PRODI', 'DOSEN_PEMBINA', 'DOSEN', 'MAHASISWA', 'KAPRODI'],
    category: 'Unit Kegiatan Mahasiswa',
  },
  {
    title: 'Keanggotaan UKM',
    href: '/dashboard/ukm/keanggotaan',
    icon: 'Users',
    roles: ['MAHASISWA', 'DOSEN_PEMBINA', 'DOSEN', 'ADMIN_PRODI', 'KAPRODI'],
    category: 'Unit Kegiatan Mahasiswa',
  },
  {
    title: 'Rekap Partisipasi UKM',
    href: '/dashboard/ukm/rekap',
    icon: 'PieChart',
    roles: ['ADMIN_PRODI', 'DOSEN_PEMBINA', 'KAPRODI'],
    category: 'Unit Kegiatan Mahasiswa',
  },

  // Modul 5 — Program Kerja Himpunan
  {
    title: 'Ringkasan Himpunan',
    href: '/dashboard/himpunan',
    icon: 'Layers',
    roles: ['PENGURUS_HIMPUNAN', 'HIMPUNAN', 'DOSEN_PEMBINA', 'KAPRODI'],
    category: 'Program Kerja Himpunan',
  },
  {
    title: 'Program Kerja (Proker)',
    href: '/dashboard/himpunan/proker',
    icon: 'Calendar',
    roles: ['PENGURUS_HIMPUNAN', 'HIMPUNAN', 'DOSEN_PEMBINA', 'KAPRODI'],
    category: 'Program Kerja Himpunan',
  },
  {
    title: 'Proposal Kegiatan',
    href: '/dashboard/himpunan/proposal',
    icon: 'FileText',
    roles: ['PENGURUS_HIMPUNAN', 'HIMPUNAN', 'DOSEN_PEMBINA', 'KAPRODI'],
    category: 'Program Kerja Himpunan',
  },
  {
    title: 'Pengunggahan LPJ',
    href: '/dashboard/himpunan/lpj',
    icon: 'FileSpreadsheet',
    roles: ['PENGURUS_HIMPUNAN', 'HIMPUNAN', 'DOSEN_PEMBINA', 'KAPRODI'],
    category: 'Program Kerja Himpunan',
  },
  {
    title: 'Verifikasi Proker & LPJ',
    href: '/dashboard/himpunan/verifikasi',
    icon: 'FileCheck',
    roles: ['DOSEN_PEMBINA', 'DOSEN', 'KAPRODI'],
    category: 'Program Kerja Himpunan',
  },
  {
    title: 'Analisis Deviasi Proker',
    href: '/dashboard/himpunan/analisis',
    icon: 'PieChart',
    roles: ['KAPRODI', 'DOSEN_PEMBINA', 'PENGURUS_HIMPUNAN', 'HIMPUNAN'],
    category: 'Program Kerja Himpunan',
  },

  // Modul 6 — Sertifikat Bahasa & Profesi
  {
    title: 'Sertifikat Mahasiswa',
    href: '/dashboard/sertifikat',
    icon: 'FileBadge',
    roles: ['MAHASISWA', 'DOSEN', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Sertifikat Mahasiswa',
  },
  {
    title: 'Verifikasi Sertifikat',
    href: '/dashboard/sertifikat/verifikasi',
    icon: 'FileCheck',
    roles: ['DOSEN_VERIFIKATOR', 'DOSEN_WALI', 'DOSEN', 'KAPRODI'],
    category: 'Sertifikat Mahasiswa',
  },
  {
    title: 'Rekapitulasi & Masa Berlaku',
    href: '/dashboard/sertifikat/rekap',
    icon: 'PieChart',
    roles: ['KAPRODI', 'DOSEN_VERIFIKATOR', 'DOSEN', 'ADMIN_PRODI'],
    category: 'Sertifikat Mahasiswa',
  },

  // 2. Modul 7 — Kepuasan Mitra
  {
    title: 'Rekap Kepuasan Mitra',
    href: '/dashboard/kepuasan-mitra',
    icon: 'SmilePlus',
    roles: ['KOORDINATOR_KP_PSI_PDLK', 'KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'KAPRODI', 'ADMIN_PRODI', 'GKM'],
    category: 'Kepuasan Mitra',
  },
  {
    title: 'Instrumen Kuesioner',
    href: '/dashboard/kepuasan-mitra/instrumen',
    icon: 'FileText',
    roles: ['KOORDINATOR_KP_PSI_PDLK', 'KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Kepuasan Mitra',
  },
  {
    title: 'Pengiriman & Input Mitra',
    href: '/dashboard/kepuasan-mitra/pengiriman',
    icon: 'Handshake',
    roles: ['KOORDINATOR_KP_PSI_PDLK', 'KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'MITRA', 'MITRA_EKSTERNAL', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Kepuasan Mitra',
  },

  // 3. Modul 8 — Publikasi
  {
    title: 'Daftar Publikasi',
    href: '/dashboard/publikasi',
    icon: 'BookOpen',
    roles: ['DOSEN', 'DOSEN_VERIFIKATOR', 'MAHASISWA', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Publikasi',
  },
  {
    title: 'Verifikasi Publikasi',
    href: '/dashboard/publikasi/verifikasi',
    icon: 'FileCheck',
    roles: ['DOSEN_VERIFIKATOR', 'DOSEN', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Publikasi',
  },
  {
    title: 'Review Internal Publikasi',
    href: '/dashboard/publikasi/review-saya',
    icon: 'ClipboardCheck',
    roles: ['DOSEN', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Publikasi',
  },
  {
    title: 'Rekap Publikasi',
    href: '/dashboard/publikasi/rekap',
    icon: 'PieChart',
    roles: ['KAPRODI', 'ADMIN_PRODI', 'GKM'],
    category: 'Publikasi',
  },

  // 4. Modul 9 — Perjalanan Dinas
  {
    title: 'Perjalanan Dinas',
    href: '/dashboard/perjalanan-dinas',
    icon: 'Plane',
    roles: ['DOSEN', 'ADMIN_PRODI', 'KAPRODI'],
    category: 'Perjalanan Dinas',
  },
  {
    title: 'Persetujuan Perjalanan',
    href: '/dashboard/perjalanan-dinas/persetujuan',
    icon: 'FileCheck',
    roles: ['KAPRODI'],
    category: 'Perjalanan Dinas',
  },
  {
    title: 'Rekap Perjalanan & Biaya',
    href: '/dashboard/perjalanan-dinas/rekap',
    icon: 'FileSpreadsheet',
    roles: ['ADMIN_PRODI', 'KAPRODI', 'DOSEN'],
    category: 'Perjalanan Dinas',
  },

  // 5. Modul 10 — RKA Prodi
  {
    title: 'Dokumen RKA',
    href: '/dashboard/rka',
    icon: 'Wallet',
    roles: ['ADMIN_PRODI', 'KAPRODI'],
    category: 'Anggaran & RKA',
  },
  {
    title: 'Realisasi Anggaran RKA',
    href: '/dashboard/rka/2025/realisasi',
    icon: 'FileText',
    roles: ['ADMIN_PRODI', 'KAPRODI'],
    category: 'Anggaran & RKA',
  },
  {
    title: 'Monitoring Serapan',
    href: '/dashboard/rka/2025/serapan',
    icon: 'PieChart',
    roles: ['ADMIN_PRODI', 'KAPRODI'],
    category: 'Anggaran & RKA',
  },

  // 6. Modul 11 & 12 — Mutu Pembelajaran
  {
    title: 'Pengajuan & Review RPS',
    href: '/dashboard/rps',
    icon: 'BookCheck',
    roles: ['DOSEN', 'GKM', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Mutu Pembelajaran',
  },
  {
    title: 'Review RPS Saya',
    href: '/dashboard/rps/review-saya',
    icon: 'ClipboardCheck',
    roles: ['DOSEN', 'GKM', 'KAPRODI'],
    category: 'Mutu Pembelajaran',
  },
  {
    title: 'Rekap Status RPS',
    href: '/dashboard/rps/rekap',
    icon: 'PieChart',
    roles: ['KAPRODI', 'GKM', 'ADMIN_PRODI'],
    category: 'Mutu Pembelajaran',
  },
  {
    title: 'Evaluasi Perkuliahan',
    href: '/dashboard/evaluasi-perkuliahan',
    icon: 'GraduationCap',
    roles: ['DOSEN', 'GKM', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Mutu Pembelajaran',
  },
  {
    title: 'Rekap CPMK & Evaluasi',
    href: '/dashboard/evaluasi-perkuliahan/rekap',
    icon: 'PieChart',
    roles: ['GKM', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Mutu Pembelajaran',
  },

  // 7. Modul 13 — Layanan Aduan Mahasiswa
  {
    title: 'Kirim Aduan Anonim',
    href: '/dashboard/aduan',
    icon: 'MessageSquareHeart',
    roles: ['MAHASISWA', 'KAPRODI', 'ADMIN_PRODI', 'DOSEN'],
    category: 'Layanan Aduan',
  },
  {
    title: 'Antrean Aduan',
    href: '/dashboard/kelola/aduan',
    icon: 'MessageSquareHeart',
    roles: ['PENGELOLA_ADUAN', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Layanan Aduan',
  },
  {
    title: 'Aduan Sensitif (Satgas)',
    href: '/dashboard/kelola/aduan/sensitif',
    icon: 'ShieldAlert',
    roles: ['PENGELOLA_ADUAN', 'PETUGAS_KEKERASAN', 'KAPRODI'],
    category: 'Layanan Aduan',
  },
  {
    title: 'Disposisi Tugas Saya',
    href: '/dashboard/kelola/aduan/tugas-saya',
    icon: 'ClipboardCheck',
    roles: ['DOSEN', 'ADMIN_PRODI', 'PENGELOLA_ADUAN', 'KAPRODI'],
    category: 'Layanan Aduan',
  },
  {
    title: 'Rekap & Eskalasi Aduan',
    href: '/dashboard/kelola/aduan/rekap',
    icon: 'PieChart',
    roles: ['PENGELOLA_ADUAN', 'PETUGAS_KEKERASAN', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Layanan Aduan',
  },

  // 8. Pengaturan
  {
    title: 'Pengaturan Mutu & Ambang',
    href: '/dashboard/pengaturan/mutu',
    icon: 'Settings',
    roles: ['KAPRODI', 'ADMIN_PRODI'],
    category: 'Pengaturan',
  },
  {
    title: 'Penetapan Peran',
    href: '/dashboard/pengaturan/peran',
    icon: 'Users',
    roles: ['KAPRODI'],
    category: 'Pengaturan',
  },
];
