import type { AuthorRole, AuthorType, PublicationRank } from '@/lib/types';

export type Penulis = {
  user_id?: string;
  nama: string;
  tipe: AuthorType;
  peran: AuthorRole;
  urutan: number;
};

export const DOSEN_LIST = [
  { id: 'u-dosen1', nama: 'Dr. Eng. Hendra Wijaya, M.Sc.' },
  { id: 'u-dosen2', nama: 'Dewi Lestari, M.T.' },
  { id: 'u-gkm', nama: 'Siti Rahmawati, M.Kom.' },
  { id: 'u-koordinator', nama: 'Ir. Agus Pratama, M.Kom.' },
];

export const PERINGKAT_OPTIONS: Record<string, { value: PublicationRank; label: string }[]> = {
  JURNAL: [
    { value: 'SINTA_1', label: 'SINTA 1' },
    { value: 'SINTA_2', label: 'SINTA 2' },
    { value: 'SINTA_3', label: 'SINTA 3' },
    { value: 'SINTA_4', label: 'SINTA 4' },
    { value: 'SINTA_5', label: 'SINTA 5' },
    { value: 'SINTA_6', label: 'SINTA 6' },
    { value: 'SCOPUS_Q1', label: 'Scopus Q1' },
    { value: 'SCOPUS_Q2', label: 'Scopus Q2' },
    { value: 'SCOPUS_Q3', label: 'Scopus Q3' },
    { value: 'SCOPUS_Q4', label: 'Scopus Q4' },
    { value: 'WOS', label: 'WoS' },
    { value: 'NON_PERINGKAT', label: 'Non-peringkat' },
  ],
  PROSIDING: [
    { value: 'SCOPUS_Q1', label: 'Scopus Q1' },
    { value: 'SCOPUS_Q2', label: 'Scopus Q2' },
    { value: 'SCOPUS_Q3', label: 'Scopus Q3' },
    { value: 'SCOPUS_Q4', label: 'Scopus Q4' },
    { value: 'NON_PERINGKAT', label: 'Non-peringkat' },
  ],
  BUKU: [{ value: 'NON_PERINGKAT', label: 'Non-peringkat' }],
  HKI: [{ value: 'NON_PERINGKAT', label: 'Non-peringkat' }],
};

export const PERAN_LABELS: Record<AuthorRole, string> = {
  PENULIS_PERTAMA: 'Penulis Pertama',
  KORESPONDENSI: 'Korespondensi',
  ANGGOTA: 'Anggota / Pendamping',
  PEMBIMBING: 'Pembimbing',
};

export const TIPE_LABELS: Record<AuthorType, string> = {
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
  EKSTERNAL: 'Eksternal',
};
