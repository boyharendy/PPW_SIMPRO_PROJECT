'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { DUMMY_VERIFIER_LECTURERS } from '@/lib/publication-verifiers';

export function useLecturers() {
  const [rows, setRows] = useState<{ id: string; nama: string; nama_lengkap: string }[]>(
    DUMMY_VERIFIER_LECTURERS.map((d) => ({
      id: d.id,
      nama: d.nama,
      nama_lengkap: d.nama_lengkap || d.nama,
    }))
  );
  useEffect(() => {
    let active = true;
    apiClient
      .get<{ id: string; nama_lengkap: string }[]>('/ref/lecturers')
      .then((res) => {
        if (!active) return;
        const mapped = (res.data || []).map((d) => ({ ...d, nama: d.nama_lengkap }));
        if (mapped.length > 0) {
          setRows(mapped);
        }
      })
      .catch(() => {
        // Keep dummy fallback lecturers for local testing/offline mode.
      });
    return () => {
      active = false;
    };
  }, []);
  return rows;
}
