'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/lib/context';
import { mockOfferings, mockArtifacts, mockPeriods } from '@/lib/mock-data';
import { Download, Upload, CheckCircle, AlertTriangle, Book, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import type { CourseOffering } from '@/lib/types';

const ARTIFACT_TYPES = ['RPS', 'BAHAN_AJAR', 'PRESENSI', 'SOAL_UJIAN'] as const;

export default function ArtefakPage() {
  const { user } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('p3');
  const [manageId, setManageId] = useState<string | null>(null);

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

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total MK', value: summary.total, color: 'text-slate-800', icon: Book },
          { label: 'Lengkap', value: summary.lengkap, color: 'text-emerald-500', icon: CheckCircle2 },
          { label: 'Perlu Revisi', value: summary.perluRevisi, color: 'text-amber-500', icon: AlertCircle },
          { label: 'Tidak Lengkap', value: summary.tidakLengkap, color: 'text-red-500', icon: XCircle },
          { label: 'Belum Diperiksa', value: summary.belum, color: 'text-slate-500', icon: Clock },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">{s.label}</p>
                <Icon size={18} className={`${s.color} opacity-80`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-500">Periode:</label>
        <select className="select-field w-auto" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
          {mockPeriods.map(p => (
            <option key={p.id} value={p.id}>{p.tahun_ajaran} — {p.semester}</option>
          ))}
        </select>
        <div className="ml-auto text-xs text-slate-500">
          Tenggat: <span className="text-amber-400 font-medium">{mockPeriods.find(p => p.id === selectedPeriod)?.tenggat_unggah_artefak}</span>
        </div>
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
          {
            key: 'aksi',
            header: '',
            render: (r) => {
              const o = r as unknown as CourseOffering;
              if (user.roles.includes('DOSEN') || user.roles.includes('GKM')) {
                return (
                  <button 
                    onClick={() => setManageId(o.id)} 
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Kelola
                  </button>
                );
              }
              return null;
            },
          }
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

      <Modal open={!!manageId} onClose={() => setManageId(null)} title="Kelola Artefak Perkuliahan">
        <div className="space-y-4">
          {user.roles.includes('DOSEN') && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
              <p className="text-sm font-medium text-slate-800">Dosen: Unggah Artefak (FR-03)</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {ARTIFACT_TYPES.map(t => (
                  <div key={t}>
                    <label className="text-xs text-slate-500 mb-1 block">{t.replace('_', ' ')}</label>
                    <input type="file" className="input-field text-xs" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {user.roles.includes('GKM') && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-sm font-medium text-slate-800">GKM: Verifikasi (FR-04)</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Status Pemeriksaan</label>
                  <select className="select-field">
                    <option value="BELUM_DIPERIKSA">Belum Diperiksa</option>
                    <option value="LENGKAP">Lengkap</option>
                    <option value="TIDAK_LENGKAP">Tidak Lengkap</option>
                    <option value="PERLU_REVISI">Perlu Revisi</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Catatan</label>
                  <textarea className="textarea-field" placeholder="Catatan revisi..."></textarea>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button className="btn-secondary" onClick={() => setManageId(null)}>Tutup</button>
            <button className="btn-primary" onClick={() => setManageId(null)}>Simpan</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
