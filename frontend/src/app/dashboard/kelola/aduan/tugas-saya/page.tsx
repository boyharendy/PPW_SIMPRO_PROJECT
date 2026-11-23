'use client';

import PageHeader from '@/components/ui/PageHeader';
import CaseList from '@/components/aduan/CaseList';

export default function Page() {
  return <div className="space-y-5"><PageHeader title="Tindak Lanjut Aduan Saya" /><CaseList assigned /></div>;
}
