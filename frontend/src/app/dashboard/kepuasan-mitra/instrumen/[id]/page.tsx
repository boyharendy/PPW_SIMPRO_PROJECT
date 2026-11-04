  'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockSurveyTemplates } from '@/lib/mock-data';
import { surveyService } from '@/lib/api/services/survey.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { PartnerSurveyTemplate, PartnerSurveyAspect } from '@/lib/types';
import { ArrowLeft, Plus, Trash2, Check, AlertCircle, Save } from 'lucide-react';
import Link from 'next/link';

export default function DetailInstrumenPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<PartnerSurveyTemplate>(() => {
    const list = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
    return list.find((t) => t.id === templateId) || mockSurveyTemplates[0];
  });
  const [aspects, setAspects] = useState<PartnerSurveyAspect[]>(() => {
    const list = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
    const found = list.find((t) => t.id === templateId);
    return found?.aspek || mockSurveyTemplates[0].aspek || [];
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    surveyService
      .getSurveyById(templateId)
      .then((res) => {
        if (active && res.data) {
          setTemplate(res.data);
          if (res.data.aspek && res.data.aspek.length > 0) {
            setAspects(res.data.aspek);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [templateId]);

  const totalBobot = aspects.reduce((sum, a) => sum + (Number(a.bobot) || 0), 0);

  const handleAddAspect = () => {
    const newAspect: PartnerSurveyAspect = {
      id: `asp-new-${Date.now()}`,
      template_id: template.id,
      nama_aspek: 'Aspek Penilaian Baru',
      deskripsi: 'Deskripsi indikator penilaian untuk mitra',
      bobot: 10,
      urutan: aspects.length + 1,
      is_active: true,
    };
    setAspects([...aspects, newAspect]);
  };

  const handleUpdateAspect = (id: string, field: keyof PartnerSurveyAspect, value: unknown) => {
    setAspects(aspects.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const handleRemoveAspect = (id: string) => {
    setAspects(aspects.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    const updated = { ...template, aspek: aspects };
    setTemplate(updated);
    storageSync.update(STORAGE_KEYS.SURVEYS, template.id, { aspek: aspects }, mockSurveyTemplates);
    try {
      await surveyService.updateSurvey(template.id, { aspek: aspects });
    } catch {
      // Offline fallback
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleActivate = async () => {
    const updated: PartnerSurveyTemplate = { ...template, status: 'AKTIF', aspek: aspects };
    setTemplate(updated);
    storageSync.update(STORAGE_KEYS.SURVEYS, template.id, { status: 'AKTIF', aspek: aspects }, mockSurveyTemplates);
    try {
      await surveyService.updateSurvey(template.id, { status: 'AKTIF', aspek: aspects });
    } catch {
      // Offline fallback
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/kepuasan-mitra/instrumen"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Instrumen</span>
        </Link>
      </div>

      <PageHeader
        title={template.nama}
        description={`Program ${template.program} • Skala Penilaian: 1 s.d. ${template.skala_maks}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={template.status} size="md" />
            {template.status === 'DRAF' && (
              <button
                type="button"
                onClick={handleActivate}
                className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Aktifkan Template</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        }
      />

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          <span>Pengaturan instrumen berhasil disimpan!</span>
        </div>
      )}

      {/* Info Card & Weight Checker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2 space-y-2">
          <h3 className="text-xs font-bold uppercase text-slate-400">Aturan Instrumen</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Template kuesioner yang telah memiliki respons mitra akan otomatis terkunci. Bila ingin melakukan perubahan besar setelah kuesioner disebarkan, gunakan fitur duplikasi untuk membuat instrumen versi baru.
          </p>
        </div>

        <div className="card space-y-2">
          <h3 className="text-xs font-bold uppercase text-slate-400">Total Akumulasi Bobot</h3>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                totalBobot === 100 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {totalBobot}%
            </span>
            <span className="text-xs text-slate-400">/ 100%</span>
          </div>
          {totalBobot !== 100 && (
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <AlertCircle size={12} />
              Total bobot disarankan tepat 100%
            </p>
          )}
        </div>
      </div>

      {/* Aspects Table Editor */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Daftar Aspek Penilaian Kuesioner</h3>
            <p className="text-xs text-slate-500">Sesuaikan butir pertanyaan dan bobot yang akan dinilai oleh pihak mitra</p>
          </div>
          <button
            type="button"
            onClick={handleAddAspect}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus size={14} />
            <span>Tambah Aspek</span>
          </button>
        </div>

        <div className="space-y-3">
          {aspects.map((asp, idx) => (
            <div
              key={asp.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={asp.nama_aspek}
                    onChange={(e) => handleUpdateAspect(asp.id, 'nama_aspek', e.target.value)}
                    placeholder="Nama Aspek Penilaian..."
                    className="input-field text-xs font-semibold py-1.5"
                  />
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">Bobot:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={asp.bobot}
                      onChange={(e) =>
                        handleUpdateAspect(asp.id, 'bobot', Number(e.target.value) || 0)
                      }
                      className="input-field text-xs w-16 py-1.5 text-right font-bold"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>

                  {aspects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAspect(asp.id)}
                      className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                      title="Hapus Aspek"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={asp.deskripsi || ''}
                  onChange={(e) => handleUpdateAspect(asp.id, 'deskripsi', e.target.value)}
                  placeholder="Deskripsi penjelasan butir aspek yang ditampilkan kepada mitra saat mengisi kuesioner..."
                  className="textarea-field text-xs py-1.5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

