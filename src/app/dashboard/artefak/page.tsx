'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { mockOfferings, mockArtifacts, mockPeriods } from '@/lib/mock-data';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import type { CourseOffering } from '@/lib/types';

const ARTIFACT_TYPES = ['RPS', 'BAHAN_AJAR', 'PRESENSI', 'SOAL_UJIAN'] as const;

export default function ArtefakPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('p3');

  const offerings = mockOfferings.filter(o => o.periode_id === selectedPeriod);

  const summary = {
    total: offerings.length,
    lengkap: offerings.filter(o => o.status_pemeriksaan === 'LENGKAP').length,
    perluRevisi: offerings.filter(o => o.status_pemeriksaan === 'PERLU_REVISI').length,
    tidakLengkap: offerings.filter(o => o.status_pemeriksaan === 'TIDAK_LENGKAP').length,
    belum: offerings.filter(o => o.status_pemeriksaan === 'BELUM_DIPERIKSA').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Artefak Perkuliahan"
        description="FR-03, FR-04, FR-05: Checklist artefak, status pemeriksaan GKM, dan pengingat tenggat"
        action={
          <button className="btn-secondary"><Download size={16} /> Ekspor</button>
        }
      />

      {/* Period filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-500">Periode:</label>
        <select className="select-field w-auto" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
          {mockPeriods.map(p => (
            <option key={p.id} value={p.id}>{p.tahun_ajaran} — {p.semester}</option>
          ))}
        </select>
        <div className="ml-auto text-xs text-slate-500">
          Tenggat: <span className="text-amber-400">{mockPeriods.find(p => p.id === selectedPeriod)?.tenggat_unggah_artefak}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total MK', value: summary.total, color: 'text-slate-800' },
          { label: 'Lengkap', value: summary.lengkap, color: 'text-emerald-400' },
          { label: 'Perlu Revisi', value: summary.perluRevisi, color: 'text-orange-400' },
          { label: 'Tidak Lengkap', value: summary.tidakLengkap, color: 'text-red-400' },
          { label: 'Belum Diperiksa', value: summary.belum, color: 'text-slate-500' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-3 text-center">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={[
          {
            key: 'kode_mk',
            header: 'Mata Kuliah',
            render: (r) => {
              const o = r as unknown as CourseOffering;
              return (
                <div>
                  <p className="font-medium text-slate-800">{o.course?.kode_mk} — {o.course?.nama_mk}</p>
                  <p className="text-xs text-slate-500">{o.course?.sks} SKS</p>
                </div>
              );
            },
          },
          {
            key: 'dosen',
            header: 'Dosen Pengampu',
            render: (r) => {
              const o = r as unknown as CourseOffering;
              return <span>{o.lecturer?.profile?.nama_lengkap || '-'}</span>;
            },
          },
          {
            key: 'artefak',
            header: 'Checklist Artefak',
            render: (r) => {
              const o = r as unknown as CourseOffering;
              const arts = mockArtifacts.filter(a => a.penawaran_id === o.id);
              return (
                <div className="flex gap-2">
                  {ARTIFACT_TYPES.map(t => {
                    const found = arts.find(a => a.jenis === t);
                    return (
                      <div key={t} title={`${t}: ${found ? (found.is_terverifikasi ? 'Terverifikasi' : 'Belum diverifikasi') : 'Belum diunggah'}`}>
                        {found ? (
                          found.is_terverifikasi ? (
                            <CheckCircle size={18} className="text-emerald-400" />
                          ) : (
                            <Upload size={18} className="text-amber-400" />
                          )
                        ) : (
                          <AlertTriangle size={18} className="text-slate-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            },
          },
          {
            key: 'status_pemeriksaan',
            header: 'Status',
            render: (r) => {
              const o = r as unknown as CourseOffering;
              return <StatusBadge status={o.status_pemeriksaan} />;
            },
          },
          {
            key: 'catatan',
            header: 'Catatan GKM',
            render: (r) => {
              const o = r as unknown as CourseOffering;
              return <span className="text-xs text-slate-500">{o.catatan_gkm || '-'}</span>;
            },
          },
        ]}
        data={offerings as unknown as Record<string, unknown>[]}
      />

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400" /> Terverifikasi</div>
        <div className="flex items-center gap-1.5"><Upload size={14} className="text-amber-400" /> Belum diverifikasi</div>
        <div className="flex items-center gap-1.5"><AlertTriangle size={14} className="text-slate-600" /> Belum diunggah</div>
        <div className="ml-auto">Jenis artefak: RPS, Bahan Ajar, Presensi, Soal Ujian</div>
      </div>
    </div>
  );
}
