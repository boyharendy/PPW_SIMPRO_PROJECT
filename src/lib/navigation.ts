import type { NavItem } from '@/lib/types';

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['KAPRODI', 'GKM', 'KOORD_KP', 'KOORD_TA', 'KOORD_MAGANG', 'HIMPUNAN', 'DOSEN', 'MAHASISWA'] },
  { title: 'PMB', href: '/dashboard/pmb', icon: 'UserPlus', roles: ['KAPRODI'] },
  { title: 'Artefak Perkuliahan', href: '/dashboard/artefak', icon: 'FileCheck', roles: ['KAPRODI', 'GKM', 'DOSEN'] },
  { title: 'Kinerja Dosen', href: '/dashboard/kinerja-dosen', icon: 'Briefcase', roles: ['KAPRODI', 'DOSEN'] },
  { title: 'Prestasi Mahasiswa', href: '/dashboard/prestasi', icon: 'Trophy', roles: ['KAPRODI', 'HIMPUNAN', 'MAHASISWA'] },
  { title: 'Pendanaan Lomba', href: '/dashboard/pendanaan', icon: 'Wallet', roles: ['KAPRODI', 'MAHASISWA'] },
  { title: 'Kepuasan Mahasiswa', href: '/dashboard/kepuasan', icon: 'SmilePlus', roles: ['GKM', 'MAHASISWA'] },
  { title: 'Tracer Study', href: '/dashboard/tracer-study', icon: 'Search', roles: ['KAPRODI'] },
  { title: 'Repositori SK', href: '/dashboard/sk', icon: 'FileText', roles: ['KAPRODI'] },
  { title: 'Inventaris Aset', href: '/dashboard/aset', icon: 'Package', roles: ['KAPRODI'] },
  { title: 'Kerja Praktik', href: '/dashboard/kp', icon: 'Building', roles: ['KAPRODI', 'KOORD_KP', 'DOSEN', 'MAHASISWA'] },
  { title: 'Tugas Akhir', href: '/dashboard/ta', icon: 'GraduationCap', roles: ['KAPRODI', 'KOORD_TA', 'DOSEN', 'MAHASISWA'] },
  { title: 'Magang', href: '/dashboard/magang', icon: 'Laptop', roles: ['KAPRODI', 'KOORD_MAGANG', 'DOSEN', 'MAHASISWA'] },
  { title: 'Keterlibatan Mahasiswa', href: '/dashboard/keterlibatan', icon: 'Users', roles: ['KAPRODI', 'DOSEN'] },
  { title: 'Integrasi Pembelajaran', href: '/dashboard/integrasi', icon: 'BookOpen', roles: ['KAPRODI', 'DOSEN'] },
  { title: 'Lembaga Mitra', href: '/dashboard/mitra', icon: 'Handshake', roles: ['KAPRODI', 'KOORD_KP', 'KOORD_TA', 'KOORD_MAGANG'] },
  { title: 'Pengaturan Akun', href: '/dashboard/pengaturan', icon: 'Settings', roles: ['KAPRODI'] },
];
