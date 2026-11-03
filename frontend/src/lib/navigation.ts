import type { NavItem } from '@/lib/types';

export const NAV_ITEMS: NavItem[] = [
  // 1. Dashboard
  {
    title: 'Dashboard Utama',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: [
      'KAPRODI', 'GKM', 'ADMIN_PRODI', 'DOSEN', 'KOORDINATOR_KP',
      'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'PENGELOLA_ADUAN',
      'PETUGAS_KEKERASAN', 'MAHASISWA'
    ],
    category: 'Utama',
  },

  // 2. Modul 7 — Kepuasan Mitra
  {
    title: 'Rekap Kepuasan Mitra',
    href: '/dashboard/kepuasan-mitra',
    icon: 'SmilePlus',
    roles: ['KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Kepuasan Mitra',
  },
  {
    title: 'Instrumen Kuesioner',
    href: '/dashboard/kepuasan-mitra/instrumen',
    icon: 'FileText',
    roles: ['KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Kepuasan Mitra',
  },
  {
    title: 'Pengiriman & Input Mitra',
    href: '/dashboard/kepuasan-mitra/pengiriman',
    icon: 'Handshake',
    roles: ['KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Kepuasan Mitra',
  },

  // 3. Modul 8 — Publikasi
  {
    title: 'Daftar Publikasi',
    href: '/dashboard/publikasi',
    icon: 'BookOpen',
    roles: ['DOSEN', 'MAHASISWA', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Publikasi',
  },
  {
    title: 'Verifikasi Publikasi',
    href: '/dashboard/publikasi/verifikasi',
    icon: 'FileCheck',
    roles: ['DOSEN', 'KAPRODI', 'ADMIN_PRODI'],
    category: 'Publikasi',
    badge: 1,
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
    roles: ['KAPRODI', 'ADMIN_PRODI'],
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
    badge: 1,
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
    badge: 1,
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
    badge: 2,
  },
  {
    title: 'Aduan Sensitif (Satgas)',
    href: '/dashboard/kelola/aduan/sensitif',
    icon: 'ShieldAlert',
    roles: ['PETUGAS_KEKERASAN', 'KAPRODI'],
    category: 'Layanan Aduan',
    badge: 1,
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
