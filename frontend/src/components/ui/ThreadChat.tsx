'use client';

import React, { useState } from 'react';
import type { ComplaintMessage } from '@/lib/types';
import { Send, Lock, User, ShieldCheck } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

interface ThreadChatProps {
  messages: ComplaintMessage[];
  isStaff?: boolean;
  onSendMessage?: (text: string, isInternal: boolean) => void;
  readOnly?: boolean;
}

export default function ThreadChat({
  messages,
  isStaff = false,
  onSendMessage,
  readOnly = false,
}: ThreadChatProps) {
  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // If not staff, filter out internal notes
  const visibleMessages = isStaff
    ? messages
    : messages.filter((m) => !m.is_catatan_internal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage?.(inputText.trim(), isInternalNote);
    setInputText('');
    setIsInternalNote(false);
  };

  return (
    <div className="space-y-4">
      {/* Message List */}
      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
        {visibleMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada pesan dalam utas ini.
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isReporter = msg.pengirim === 'PELAPOR';

            if (msg.is_catatan_internal) {
              return (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1 animate-fade-in"
                >
                  <div className="flex items-center justify-between font-semibold text-amber-800">
                    <span className="flex items-center gap-1.5">
                      <Lock size={12} className="text-amber-700" />
                      Catatan Internal Petugas (Kerahasiaan Khusus)
                    </span>
                    <span className="text-[10px] text-amber-600 font-normal">
                      {formatDateShort(msg.tanggal)}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.isi}</p>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  isReporter ? 'mr-auto' : 'ml-auto flex-row-reverse'
                } animate-fade-in`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isReporter
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {isReporter ? <User size={14} /> : <ShieldCheck size={14} />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs space-y-1 shadow-2xs ${
                    isReporter
                      ? 'bg-slate-100 text-slate-800 rounded-tl-xs'
                      : 'bg-blue-600 text-white rounded-tr-xs'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-3 text-[10px] font-semibold ${
                      isReporter ? 'text-slate-500' : 'text-blue-100'
                    }`}
                  >
                    <span>{isReporter ? 'Pelapor Anonim' : msg.sender_name || 'Petugas Prodi'}</span>
                    <span className="font-normal opacity-80">{formatDateShort(msg.tanggal)}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.isi}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      {!readOnly && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-slate-100">
          {isStaff && (
            <label className="flex items-center gap-2 text-xs text-slate-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={isInternalNote}
                onChange={(e) => setIsInternalNote(e.target.checked)}
                className="checkbox-field"
              />
              <span className="flex items-center gap-1 font-medium">
                <Lock size={12} className="text-amber-600" />
                Kirim sebagai Catatan Internal (Hanya terlihat petugas)
              </span>
            </label>
          )}

          <div className="flex gap-2">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isInternalNote
                  ? 'Tulis catatan koordinasi internal petugas...'
                  : 'Tulis balasan atau tindak lanjut...'
              }
              className="textarea-field text-xs py-2"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="btn-primary flex-shrink-0 px-4 self-end h-10"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

