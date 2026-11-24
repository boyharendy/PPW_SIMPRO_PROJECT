import type { NavItem } from '@/lib/types';

export const NAV_ITEMS: NavItem[] = [
  // 1. Dashboard
  {
    title: 'Dashboard Utama',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: [
      'KAPRODI',
      'ADMIN_PRODI',
      'DOSEN',
      'DOSEN_VERIFIKATOR',
      'DOSEN_WALI',
      'DOSEN_PEMBINA',
      'KETUA_KELAS',
      'MAHASISWA',
      'PENGURUS_HIMPUNAN',
      'HIMPUNAN',
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
    badge: 2,
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
    badge: 1,
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
    badge: 1,
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
    roles: ['DOSEN_PEMBINA', 'KAPRODI'],
    category: 'Program Kerja Himpunan',
    badge: 2,
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
    badge: 2,
  },
  {
    title: 'Rekapitulasi & Masa Berlaku',
    href: '/dashboard/sertifikat/rekap',
    icon: 'PieChart',
    roles: ['KAPRODI', 'DOSEN_VERIFIKATOR', 'DOSEN', 'ADMIN_PRODI'],
    category: 'Sertifikat Mahasiswa',
  },

  // Pengaturan
  {
    title: 'Penetapan Peran',
    href: '/dashboard/pengaturan/peran',
    icon: 'Users',
    roles: ['KAPRODI', 'ADMIN_PRODI'],
    category: 'Pengaturan',
  },
];
