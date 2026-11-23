'use client';

import PageHeader from '@/components/ui/PageHeader';
import CaseList from '@/components/aduan/CaseList';

export default function Page() {
  return <div className="space-y-5"><PageHeader title="Antrean Aduan Masuk" /><CaseList /></div>;
}
