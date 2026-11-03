import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  if (!isModalOpen) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  }[size];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 transition-opacity" 
        onClick={onClose} 
      />
      <div className={`relative w-full ${sizeClass} bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
