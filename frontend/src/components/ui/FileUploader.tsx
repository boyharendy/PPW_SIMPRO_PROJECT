'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, X } from 'lucide-react';

interface FileUploaderProps {
  label?: string;
  category?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileSelect?: (file: File, category?: string) => void;
  helperText?: string;
}

export default function FileUploader({
  label = 'Unggah Berkas Pendukung',
  category,
  accept = '.pdf,.jpg,.jpeg,.png,.docx,.xlsx',
  maxSizeMb = 10,
  onFileSelect,
  helperText = 'Format: PDF, JPG, PNG, DOCX, XLSX (Maks. 10 MB)',
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Ukuran berkas melebihi batas ${maxSizeMb} MB.`);
      return;
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
    });

    onFileSelect?.(file, category);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}

      {!selectedFile ? (
        <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group">
          <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
          <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
            Klik untuk memilih berkas atau seret ke sini
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-200 rounded-xl animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 size={12} /> Siap diunggah
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="w-7 h-7 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

