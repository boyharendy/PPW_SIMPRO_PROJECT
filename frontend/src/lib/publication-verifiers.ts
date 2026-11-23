export interface VerifierOption {
  id: string;
  nama: string;
  nama_lengkap?: string;
}

export const DUMMY_VERIFIER_LECTURERS: VerifierOption[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    nama: 'Ir. Hendra Wijaya, M.Sc.',
    nama_lengkap: 'Ir. Hendra Wijaya, M.Sc.',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    nama: 'Dr. Siti Nurhaliza, M.Kom.',
    nama_lengkap: 'Dr. Siti Nurhaliza, M.Kom.',
  },
  {
    id: 'u-verif-1',
    nama: 'Budi Hartono, M.Kom.',
    nama_lengkap: 'Budi Hartono, M.Kom.',
  },
  {
    id: 'u-verif-2',
    nama: 'Dr. Rina Fitriani, M.Kom.',
    nama_lengkap: 'Dr. Rina Fitriani, M.Kom.',
  },
];

export function resolveEligibleVerifiers(
  lecturers: VerifierOption[],
  currentUserId: string,
  authors: Array<{ nama: string; tipe: string; peran: string }>
): VerifierOption[] {
  const backendCandidates = lecturers.filter((d) => Boolean(d.id) && d.id !== currentUserId);
  const candidates =
    backendCandidates.length > 0
      ? backendCandidates
      : DUMMY_VERIFIER_LECTURERS.filter((d) => d.id !== currentUserId);

  const supervisorNames = new Set(
    authors
      .filter((p) => p.tipe === 'DOSEN' && (p.peran === 'ANGGOTA' || p.peran === 'PEMBIMBING'))
      .map((p) => p.nama.trim().toLowerCase())
      .filter(Boolean)
  );

  if (supervisorNames.size === 0) {
    return candidates;
  }

  const matched = candidates.filter((d) => supervisorNames.has(d.nama.trim().toLowerCase()));
  return matched.length > 0 ? matched : candidates;
}

export function ensureVerifierAuthor<
  T extends {
    id?: string;
    user_id?: string;
    nama_penulis: string;
    tipe_penulis: string;
    peran: string;
    urutan: number;
  }
>(authors: T[], selectedVerifier?: VerifierOption): T[] {
  if (!selectedVerifier) {
    return authors;
  }

  const targetName = selectedVerifier.nama.trim().toLowerCase();
  const supervisingRoles = new Set(['PEMBIMBING', 'ANGGOTA', 'PENULIS_PENDAMPING']);

  const alreadyValid = authors.some(
    (a) =>
      a.user_id === selectedVerifier.id &&
      a.tipe_penulis === 'DOSEN' &&
      supervisingRoles.has(a.peran)
  );
  if (alreadyValid) {
    return authors;
  }

  let matchedByName = false;
  const updated = authors.map((a) => {
    if (
      !matchedByName &&
      a.tipe_penulis === 'DOSEN' &&
      a.nama_penulis.trim().toLowerCase() === targetName
    ) {
      matchedByName = true;
      return {
        ...a,
        user_id: selectedVerifier.id,
        peran: supervisingRoles.has(a.peran) ? a.peran : 'PEMBIMBING',
      };
    }
    return a;
  });

  if (matchedByName) {
    return updated;
  }

  return [
    ...updated,
    {
      id: '',
      user_id: selectedVerifier.id,
      nama_penulis: selectedVerifier.nama,
      tipe_penulis: 'DOSEN',
      peran: 'PEMBIMBING',
      urutan: updated.length + 1,
    } as T,
  ];
}
