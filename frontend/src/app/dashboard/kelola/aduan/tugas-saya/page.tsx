'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Send,
  Calendar,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUser } from '@/lib/context';
import { mockComplaints } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import type { Complaint } from '@/lib/types';

export default function DisposisiTugasSayaPage() {
  const { user } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);

  // Filter tasks where there is a disposition assigned to current user, or for demo show all assigned tasks
  const myTasks = complaints.flatMap((c) => {
    if (!c.dispositions) return [];
    return c.dispositions.map((d) => ({
      ...d,
      complaint: c,
    }));
  });

  const [selectedTask, setSelectedTask] = useState<{
    dispId: string;
    complaintId: string;
    nomor: string;
  } | null>(null);
  const [progressNote, setProgressNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSimpanProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === selectedTask.complaintId) {
          const newMsg = {
            id: `cm-prog-${Date.now()}`,
            complaint_id: c.id,
            urutan: (c.messages?.length || 0) + 1,
            pengirim: 'PETUGAS' as const,
            sender_name: user?.name || 'Petugas Penanggung Jawab',
            isi: `Update Progres Tugas: ${progressNote}`,
            is_catatan_internal: false,
            tanggal: new Date().toISOString(),
          };
          return {
            ...c,
            messages: [...(c.messages || []), newMsg],
          };
        }
        return c;
      })
    );

    setToastMessage(`Progres untuk ${selectedTask.nomor} berhasil dilaporkan.`);
    setSelectedTask(null);
    setProgressNote('');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const columns = [
    {
      key: 'nomor',
      header: 'Nomor Aduan',
      render: (item: any) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm">{item.complaint.nomor_aduan}</span>
          <div className="font-mono text-xs text-slate-500">{item.complaint.kode_tiket}</div>
        </div>
      ),
    },
    {
      key: 'judul',
      header: 'Judul Aduan',
      render: (item: any) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.complaint.judul}</p>
          <span className="text-xs text-slate-500">
            Kategori: {item.complaint.kategori.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'tenggat',
      header: 'Tenggat Waktu',
      render: (item: any) => {
        const isPast = new Date(item.tenggat) < new Date();
        return (
          <div>
            <span
              className={`text-xs font-semibold ${
                isPast ? 'text-red-600' : 'text-slate-700'
              }`}
            >
              {formatDate(item.tenggat)}
            </span>
            <div className="text-[11px] text-slate-400">
              {isPast ? 'Melewati batas' : 'Sesuai jadwal'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'instruksi',
      header: 'Instruksi Disposisi',
      render: (item: any) => (
        <p className="text-xs text-slate-600 line-clamp-2 max-w-sm">{item.catatan}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status Aduan',
      render: (item: any) => <StatusBadge status={item.complaint.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (item: any) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() =>
              setSelectedTask({
                dispId: item.id,
                complaintId: item.complaint.id,
                nomor: item.complaint.nomor_aduan,
              })
            }
            className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Update Progres
          </button>
          <Link
            href={`/dashboard/kelola/aduan/${item.complaint.id}`}
            className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
          >
            Lihat Detail
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disposisi Tugas Saya"
        subtitle="Daftar aduan mahasiswa yang ditugaskan kepada Anda untuk ditindaklanjuti secara langsung."
        badge={
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            Penugasan
          </span>
        }
      />

      {toastMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tugas Aktif</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{myTasks.length}</p>
          <p className="mt-1 text-xs text-slate-500">Perlu tindak lanjut teknis</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Batas Waktu Pekan Ini</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {myTasks.filter((t) => t.status === 'AKTIF').length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Prioritaskan penyelesaian</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tuntas Diselesaikan</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {complaints.filter((c) => c.status === 'SELESAI').length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Telah diverifikasi tuntas</p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={myTasks}
        searchKey="instruksi"
        emptyMessage="Tidak ada tugas disposisi yang ditugaskan kepada Anda saat ini."
      />

      {/* Modal Update Progres */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Laporkan Progres Tugas</h3>
                <p className="text-xs text-slate-500">{selectedTask.nomor}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanProgress} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Progres Lapangan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  required
                  placeholder="Deskripsikan tindakan yang telah Anda lakukan (misal: telah memeriksa kabel, teknisi sudah dijadwalkan)..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  Kirim Progres
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

