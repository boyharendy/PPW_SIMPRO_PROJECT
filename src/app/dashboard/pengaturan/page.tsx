'use client';

import PageHeader from '@/components/ui/PageHeader';
import { useApp } from '@/lib/context';
import { User, Shield, Key, Bell, Save } from 'lucide-react';

export default function PengaturanPage() {
  const { user } = useApp();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Pengaturan Akun"
        description="Kelola profil, keamanan, dan preferensi notifikasi"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          {[
            { id: 'profile', icon: <User size={18} />, label: 'Profil Saya' },
            { id: 'security', icon: <Shield size={18} />, label: 'Keamanan' },
            { id: 'notifications', icon: <Bell size={18} />, label: 'Notifikasi' },
          ].map(t => (
            <button key={t.id} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-800 font-medium border border-slate-200 hover:bg-white/5 transition-colors">
              <span className="text-indigo-400">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Informasi Profil</h3>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold shadow-sm">
                {user.nama_lengkap.charAt(0)}
              </div>
              <div>
                <button className="btn-secondary text-xs mb-2">Ubah Foto</button>
                <p className="text-xs text-slate-500">JPG, GIF atau PNG. Maks 2MB.</p>
              </div>
            </div>

            <form className="space-y-5">
              <div>
                <label className="label">Nama Lengkap</label>
                <input className="input-field" defaultValue={user.nama_lengkap} />
              </div>
              <div>
                <label className="label">Email Institusi</label>
                <input className="input-field" defaultValue={user.email} disabled />
                <p className="text-xs text-slate-500 mt-1">Email SSO institusi tidak dapat diubah.</p>
              </div>
              <div>
                <label className="label">Peran Aktif Saat Ini</label>
                <input className="input-field text-indigo-300 font-medium bg-indigo-500/5 border-indigo-500/20" defaultValue={user.activeRole} disabled />
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200">
                <button type="button" className="btn-primary">
                  <Save size={16} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Ganti Password</h3>
            <form className="space-y-4">
              <div>
                <label className="label">Password Lama</label>
                <input className="input-field" type="password" />
              </div>
              <div>
                <label className="label">Password Baru</label>
                <input className="input-field" type="password" />
              </div>
              <div>
                <label className="label">Konfirmasi Password Baru</label>
                <input className="input-field" type="password" />
              </div>
              <div className="pt-2">
                <button type="button" className="btn-secondary">
                  <Key size={16} /> Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
