import type { Role, NavItem } from '@/lib/types';

// Check if role is authorized (including backward compatibility aliases)
export const isRoleAuthorized = (allowedRoles: Role[], currentRole: Role): boolean => {
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
};

export const NAV_ITEMS: NavItem[] = [
  // 1. Dashboard
  {
    title: 'Dashboard Utama',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: [
      'KAPRODI', 'GKM', 'ADMIN_PRODI', 'DOSEN', 'DOSEN_VERIFIKATOR',
      'DOSEN_WALI', 'DOSEN_PEMBINA', 'KETUA_KELAS', 'MAHASISWA',
      'PENGURUS_HIMPUNAN', 'KOORDINATOR_KP_PSI_PDLK', 'PENGELOLA_ADUAN',
      'KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'PETUGAS_KEKERASAN', 'HIMPUNAN'
    ],
    category: 'Utama',
  },

  // Modul 1 — Laporan Perwalian
  {
    title: 'Laporan Perwalian',
    href: '/dashboard/perwalian',
    icon: 'Users',
    roles: ['KETUA_KELAS', 'DOSEN_WALI', 'KAPRODI'],
    category: 'Laporan Perwalian',
  },
  {
    title: 'Rekap & Isu Perwalian',
    href: '/dashboard/perwalian/rekap',
    icon: 'PieChart',
    roles: ['KAPRODI', 'DOSEN_WALI'],
    category: 'Laporan Perwalian',
  },

  // Modul 2 — Beasiswa & Jam Karya
  {
    title: 'Penerima Beasiswa',
    href: '/dashboard/beasiswa',
    icon: 'Award',
    roles: ['ADMIN_PRODI', 'KAPRODI'],
    category: 'Beasiswa & Jam Karya',
  },
  {
    title: 'Catat Jam Karya',
    href: '/dashboard/beasiswa/jam-karya',
    icon: 'Clock',
    roles: ['MAHASISWA'],
    category: 'Beasiswa & Jam Karya',
  },
  {
    title: 'Verifikasi Jam Karya',
    href: '/dashboard/beasiswa/verifikasi',
    icon: 'FileCheck',
    roles: ['DOSEN_VERIFIKATOR', 'DOSEN_WALI'],
    category: 'Beasiswa & Jam Karya',
  },
  {
    title: 'Rekap Pemenuhan Jam',
    href: '/dashboard/beasiswa/rekap',
    icon: 'PieChart',
    roles: ['ADMIN_PRODI', 'KAPRODI'],
    category: 'Beasiswa & Jam Karya',
  },

  // Modul 3 — Pelanggaran & Sanksi Sosial
  {
    title: 'Data Pelanggaran',
    href: '/dashboard/pelanggaran',
    icon: 'ShieldAlert',
    roles: ['KAPRODI', 'DOSEN_WALI'],
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
    roles: ['DOSEN_VERIFIKATOR', 'DOSEN_WALI'],
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
    roles: ['ADMIN_PRODI', 'DOSEN_PEMBINA', 'MAHASISWA', 'KAPRODI'],
    category: 'Unit Kegiatan Mahasiswa',
  },
  {
    title: 'Keanggotaan UKM',
    href: '/dashboard/ukm/keanggotaan',
    icon: 'Users',
    roles: ['MAHASISWA', 'DOSEN_PEMBINA'],
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
    roles: ['DOSEN_PEMBINA', 'KAPRODI'],
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
    roles: ['MAHASISWA', 'DOSEN_VERIFIKATOR', 'KAPRODI'],
    category: 'Sertifikat Mahasiswa',
  },
  {
    title: 'Verifikasi Sertifikat',
    href: '/dashboard/sertifikat/verifikasi',
    icon: 'FileCheck',
    roles: ['DOSEN_VERIFIKATOR', 'DOSEN_WALI'],
    category: 'Sertifikat Mahasiswa',
  },
  {
    title: 'Rekapitulasi & Masa Berlaku',
    href: '/dashboard/sertifikat/rekap',
    icon: 'PieChart',
    roles: ['KAPRODI', 'DOSEN_VERIFIKATOR'],
    category: 'Sertifikat Mahasiswa',
  },

  // 2. Modul 7 — Kepuasan Mitra
  {
    title: 'Rekap Kepuasan Mitra',
    href: '/dashboard/kepuasan-mitra',
    icon: 'SmilePlus',
    roles: ['KOORDINATOR_KP_PSI_PDLK', 'KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'KAPRODI'],
    category: 'Kepuasan Mitra',
  },
  {
    title: 'Instrumen Kuesioner',
    href: '/dashboard/kepuasan-mitra/instrumen',
    icon: 'FileText',
    roles: ['KOORDINATOR_KP_PSI_PDLK', 'KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'KAPRODI'],
    category: 'Kepuasan Mitra',
  },
  {
    title: 'Pengiriman & Input Mitra',
    href: '/dashboard/kepuasan-mitra/pengiriman',
    icon: 'Handshake',
    roles: ['KOORDINATOR_KP_PSI_PDLK', 'KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK', 'KAPRODI'],
    category: 'Kepuasan Mitra',
  },

  // 3. Modul 8 — Publikasi
  {
    title: 'Daftar Publikasi',
    href: '/dashboard/publikasi',
    icon: 'BookOpen',
    roles: ['DOSEN', 'MAHASISWA', 'KAPRODI'],
    category: 'Publikasi',
  },
  {
    title: 'Verifikasi Publikasi',
    href: '/dashboard/publikasi/verifikasi',
    icon: 'FileCheck',
    roles: ['DOSEN_VERIFIKATOR', 'DOSEN'],
    category: 'Publikasi',
  },
  {
    title: 'Review Internal Publikasi',
    href: '/dashboard/publikasi/review-saya',
    icon: 'ClipboardCheck',
    roles: ['DOSEN'],
    category: 'Publikasi',
  },
  {
    title: 'Rekap Publikasi',
    href: '/dashboard/publikasi/rekap',
    icon: 'PieChart',
    roles: ['KAPRODI'],
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
    roles: ['ADMIN_PRODI', 'KAPRODI'],
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
    roles: ['DOSEN', 'GKM', 'KAPRODI'],
    category: 'Mutu Pembelajaran',
  },
  {
    title: 'Review RPS Saya',
    href: '/dashboard/rps/review-saya',
    icon: 'ClipboardCheck',
    roles: ['DOSEN'],
    category: 'Mutu Pembelajaran',
  },
  {
    title: 'Rekap Status RPS',
    href: '/dashboard/rps/rekap',
    icon: 'PieChart',
    roles: ['GKM', 'KAPRODI'],
    category: 'Mutu Pembelajaran',
  },
  {
    title: 'Evaluasi Perkuliahan',
    href: '/dashboard/evaluasi-perkuliahan',
    icon: 'GraduationCap',
    roles: ['DOSEN', 'GKM', 'KAPRODI'],
    category: 'Mutu Pembelajaran',
  },
  {
    title: 'Rekap CPMK & Evaluasi',
    href: '/dashboard/evaluasi-perkuliahan/rekap',
    icon: 'PieChart',
    roles: ['GKM', 'KAPRODI'],
    category: 'Mutu Pembelajaran',
  },

  // 7. Modul 13 — Layanan Aduan Mahasiswa
  {
    title: 'Kirim Aduan Anonim',
    href: '/dashboard/aduan',
    icon: 'MessageSquareHeart',
    roles: ['MAHASISWA'],
    category: 'Layanan Aduan',
  },
  {
    title: 'Antrean Aduan',
    href: '/dashboard/kelola/aduan',
    icon: 'MessageSquareHeart',
    roles: ['PENGELOLA_ADUAN', 'KAPRODI'],
    category: 'Layanan Aduan',
  },
  {
    title: 'Aduan Sensitif (Satgas)',
    href: '/dashboard/kelola/aduan/sensitif',
    icon: 'ShieldAlert',
    roles: ['PENGELOLA_ADUAN', 'PETUGAS_KEKERASAN'],
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
    roles: ['PENGELOLA_ADUAN', 'KAPRODI'],
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

/**
 * Checks whether a given role is allowed to access a URL path under /dashboard.
 * Public routes (outside /dashboard) are universally allowed.
 * Within /dashboard, match the longest prefix from NAV_ITEMS.
 * Deny by default if no rule matches.
 */
export function canAccess(pathname: string, currentRole: Role): boolean {
  if (!pathname || !pathname.startsWith('/dashboard')) {
    return true;
  }

  // Exact match first
  const exact = NAV_ITEMS.find(item => item.href === pathname);
  if (exact) {
    return isRoleAuthorized(exact.roles, currentRole);
  }

  // Find longest matching prefix (excluding exact /dashboard match for child routes)
  const prefixMatches = NAV_ITEMS.filter(item => {
    if (item.href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(item.href + '/') || pathname.startsWith(item.href + '?');
  });

  if (prefixMatches.length > 0) {
    prefixMatches.sort((a, b) => b.href.length - a.href.length);
    return isRoleAuthorized(prefixMatches[0].roles, currentRole);
  }

  // If path is exactly /dashboard, check dashboard nav item
  if (pathname === '/dashboard') {
    const dash = NAV_ITEMS.find(item => item.href === '/dashboard');
    return dash ? isRoleAuthorized(dash.roles, currentRole) : false;
  }

  // Deny by default for any unknown routes under /dashboard
  return false;
}
