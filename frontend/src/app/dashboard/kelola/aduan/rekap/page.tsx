'use client';

import PageHeader from '@/components/ui/PageHeader';
import { useCaseData } from '@/components/aduan/CaseList';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';

interface Recap { total_aduan: number; total_selesai: number; rata_rata_waktu_penyelesaian_hari: number; rata_rata_kepuasan_pelapor: number; kategori_distribusi: Record<string,number>; status_distribusi: Record<string,number> }
export default function Page() {
  const { data, error } = useCaseData<Recap>('/aduan/recap');
  return <div className="space-y-5"><PageHeader title="Rekap Statistik Aduan" />
    {error ? <p role="alert">{error}</p> : !data ? <p>Memuat rekap...</p> : <MotionCard as="section" index={0} interactive={false} className="card space-y-3">
      <p>{data.total_aduan} aduan, {data.total_selesai} selesai</p>
      <p>Rata-rata waktu penyelesaian {data.rata_rata_waktu_penyelesaian_hari.toFixed(1)} hari</p>
      <p>Rata-rata penilaian {data.rata_rata_kepuasan_pelapor.toFixed(1)} dari 5</p>
      {[['Kategori',data.kategori_distribusi],['Status',data.status_distribusi]].map(([title, values]) =>
        <div key={String(title)}><WordRevealHeading as="h2" text={String(title)} className="font-semibold" />
          {Object.entries(values).map(([key,n]) => <p key={key}>{key.replaceAll('_',' ')} &middot; {n}</p>)}</div>)}
    </MotionCard>}
  </div>;
}
