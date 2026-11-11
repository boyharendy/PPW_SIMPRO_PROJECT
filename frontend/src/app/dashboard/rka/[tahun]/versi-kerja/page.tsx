'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Send, Save, Calculator, Wallet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { formatRupiah } from '@/lib/utils';

interface PosItem {
  id: string;
  kodePos: string;
  namaPos: string;
  kategori: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  sumberDana: string;
}

interface KegiatanItem {
  id: string;
  kode: string;
  nama: string;
  indikator: string;
  pos: PosItem[];
}

const INITIAL_KEGIATAN: KegiatanItem[] = [
  {
    id: 'keg-1',
    kode: 'KG-01',
    nama: 'Penyusunan dan Review Kurikulum MBKM',
    indikator: '1 Dokumen kurikulum terevisi dan divalidasi senat fakultas',
    pos: [
      {
        id: 'pos-1',
        kodePos: 'POS-01-01',
        namaPos: 'Honorarium Pakar Eksternal Kurikulum',
        kategori: 'HONOR',
        volume: 4,
        satuan: 'Orang / Jam',
        hargaSatuan: 1500000,
        sumberDana: 'DANA_UNIVERSITAS',
      },
      {
        id: 'pos-2',
        kodePos: 'POS-01-02',
        namaPos: 'Konsumsi Rapat Pleno Review Kurikulum',
        kategori: 'BELANJA_BARANG',
        volume: 25,
        satuan: 'Paket Konsumsi',
        hargaSatuan: 60000,
        sumberDana: 'DANA_UNIVERSITAS',
      },
    ],
  },
  {
    id: 'keg-2',
    kode: 'KG-02',
    nama: 'Pengembangan Sarana Lab Komputasi Awan',
    indikator: '1 Server baru terpasang dan beroperasi di laboratorium',
    pos: [
      {
        id: 'pos-3',
        kodePos: 'POS-02-01',
        namaPos: 'Pengadaan Server Rak Komputasi Awan',
        kategori: 'BELANJA_BARANG',
        volume: 1,
        satuan: 'Unit Server',
        hargaSatuan: 45000000,
        sumberDana: 'PNBP',
      },
    ],
  },
];

export default function Page() {
  const { tahun } = useParams<{ tahun: string }>();
  const router = useRouter();

  const [alasanRevisi, setAlasanRevisi] = useState('Penyesuaian pagu anggaran sarana lab komputasi awan.');
  const [kegiatan, setKegiatan] = useState<KegiatanItem[]>(INITIAL_KEGIATAN);

  const calculateTotal = () => {
    return kegiatan.reduce((sumKeg, k) => {
      const sumPos = k.pos.reduce((sp, p) => sp + p.volume * p.hargaSatuan, 0);
      return sumKeg + sumPos;
    }, 0);
  };

  const handleAddPos = (kegId: string) => {
    setKegiatan(
      kegiatan.map((k) => {
        if (k.id !== kegId) return k;
        const newPos: PosItem = {
          id: `pos-${Date.now()}`,
          kodePos: `${k.kode}-0${k.pos.length + 1}`,
          namaPos: 'Pos Anggaran Baru',
          kategori: 'BELANJA_BARANG',
          volume: 1,
          satuan: 'Paket',
          hargaSatuan: 1000000,
          sumberDana: 'DANA_UNIVERSITAS',
        };
        return { ...k, pos: [...k.pos, newPos] };
      })
    );
  };

  const handleUpdatePos = (kegId: string, posId: string, field: keyof PosItem, value: any) => {
    setKegiatan(
      kegiatan.map((k) => {
        if (k.id !== kegId) return k;
        return {
          ...k,
          pos: k.pos.map((p) => (p.id === posId ? { ...p, [field]: value } : p)),
        };
      })
    );
  };

  const handleDeletePos = (kegId: string, posId: string) => {
    setKegiatan(
      kegiatan.map((k) => {
        if (k.id !== kegId) return k;
        return { ...k, pos: k.pos.filter((p) => p.id !== posId) };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Versi kerja RKA berhasil diajukan untuk ditinjau oleh Kaprodi.');
    router.push(`/dashboard/rka/${tahun || '2025'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/rka/${tahun || '2025'}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke RKA {tahun || '2025'}
        </Link>
      </div>

      <PageHeader
        title={`Penyusunan Versi Kerja RKA ${tahun || '2025'}`}
        description="Penyusunan dan pengeditan draft pagu RKA sebelum diajukan (FR-40)."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Total Pagu: <strong className="text-blue-700 font-mono text-sm">{formatRupiah(calculateTotal())}</strong>
            </span>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Catatan Alasan Revisi */}
        <div className="card space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Alasan Revisi / Penyusunan Versi Ini (Wajib untuk Versi &ge; 2)
          </label>
          <textarea
            rows={2}
            value={alasanRevisi}
            onChange={(e) => setAlasanRevisi(e.target.value)}
            placeholder="Tuliskan justifikasi perubahan kegiatan atau pos anggaran..."
            className="input-field text-xs resize-none"
            required
          />
        </div>

        {/* Daftar Kegiatan & Pos Anggaran Editor */}
        <div className="space-y-4">
          {kegiatan.map((k) => {
            const subtotal = k.pos.reduce((sum, p) => sum + p.volume * p.hargaSatuan, 0);

            return (
              <div key={k.id} className="card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {k.kode}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{k.nama}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Indikator: {k.indikator}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Subtotal Kegiatan</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{formatRupiah(subtotal)}</span>
                  </div>
                </div>

                {/* Tabel Pos Anggaran */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-400 font-semibold uppercase">
                        <th className="py-2 px-2">Kode Pos</th>
                        <th className="py-2 px-2">Uraian Pos Anggaran</th>
                        <th className="py-2 px-2 w-20">Volume</th>
                        <th className="py-2 px-2 w-24">Satuan</th>
                        <th className="py-2 px-2 w-32">Harga Satuan (Rp)</th>
                        <th className="py-2 px-2 text-right">Nominal Otomatis</th>
                        <th className="py-2 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {k.pos.map((p) => {
                        const nominal = p.volume * p.hargaSatuan;
                        return (
                          <tr key={p.id}>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={p.kodePos}
                                onChange={(e) => handleUpdatePos(k.id, p.id, 'kodePos', e.target.value)}
                                className="input-field py-1 px-2 text-xs font-mono"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={p.namaPos}
                                onChange={(e) => handleUpdatePos(k.id, p.id, 'namaPos', e.target.value)}
                                className="input-field py-1 px-2 text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min={1}
                                value={p.volume}
                                onChange={(e) => handleUpdatePos(k.id, p.id, 'volume', Number(e.target.value))}
                                className="input-field py-1 px-2 text-xs text-center"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={p.satuan}
                                onChange={(e) => handleUpdatePos(k.id, p.id, 'satuan', e.target.value)}
                                className="input-field py-1 px-2 text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                value={p.hargaSatuan}
                                onChange={(e) => handleUpdatePos(k.id, p.id, 'hargaSatuan', Number(e.target.value))}
                                className="input-field py-1 px-2 text-xs font-mono text-right"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-800">
                              {formatRupiah(nominal)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeletePos(k.id, p.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Hapus Pos"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddPos(k.id)}
                  className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                >
                  <Plus size={13} /> Tambah Pos Anggaran
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div>
            <div className="text-xs text-slate-500">Total Akumulasi Pagu RKA:</div>
            <div className="text-xl font-bold text-blue-700 font-mono">{formatRupiah(calculateTotal())}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5">
              <Send size={14} /> Ajukan Versi RKA
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
