'use client';

import StatCard from '@/components/ui/StatCard';
import { mockDashboardStats, mockTrenPMB, mockKepuasanPerLayanan, mockNotifications } from '@/lib/mock-data';
import { Users, GraduationCap, Handshake, Trophy, BarChart3, SmilePlus, Clock, GitBranch, Building, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { formatDateTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const { user } = useApp();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-6 lg:p-8 relative overflow-hidden animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <p className="text-blue-600 font-semibold mb-1 flex items-center gap-2">
            Good Morning, 👋
          </p>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{user.nama_lengkap.split(',')[0]}!</h1>
          <p className="text-slate-600 text-sm md:text-base">Stay updated with your academic journey today.</p>
        </div>
        
        {/* Decorative elements: Books & Plant */}
        <div className="hidden sm:block relative z-10 mr-4">
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
            <style>
              {`
                @keyframes float {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-4px); }
                }
                @keyframes cloudMove {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(8px); }
                }
                @keyframes birdFly {
                  0%, 100% { transform: translateY(0) translateX(0); }
                  25% { transform: translateY(-2px) translateX(2px); }
                  75% { transform: translateY(2px) translateX(-1px); }
                }
                .anim-float { animation: float 5s ease-in-out infinite; }
                .anim-cloud { animation: cloudMove 12s ease-in-out infinite; }
                .anim-cloud-slow { animation: cloudMove 18s ease-in-out infinite reverse; }
                .anim-bird { animation: birdFly 4s ease-in-out infinite; }
                .anim-bird-delayed { animation: birdFly 5s ease-in-out infinite 1s; }
              `}
            </style>
            
            {/* Background Clouds */}
            <g className="anim-cloud">
              <path d="M30 110a12 12 0 0 1 12-12 18 18 0 0 1 34 0 12 12 0 0 1 12 12h-58z" fill="#cbd5e1" opacity="0.3"/>
            </g>
            <g className="anim-cloud-slow">
              <path d="M200 100a10 10 0 0 1 10-10 15 15 0 0 1 28 0 10 10 0 0 1 10 10h-48z" fill="#cbd5e1" opacity="0.3"/>
            </g>

            {/* Birds */}
            <g className="anim-bird">
              <path d="M190 40 q 6 -6 12 0 q 6 -6 12 0" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </g>
            <g className="anim-bird-delayed">
              <path d="M220 25 q 4 -4 8 0 q 4 -4 8 0" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </g>

            {/* Ground Shadow */}
            <ellipse cx="130" cy="115" rx="100" ry="8" fill="#e2e8f0" opacity="0.7"/>

            {/* Plant Pot */}
            <g transform="translate(45, 75)" className="anim-float">
              {/* Leaves */}
              <path d="M25,20 Q10,-10 0,5 Q10,15 25,20" fill="#4ade80"/>
              <path d="M25,20 Q40,-10 50,5 Q40,15 25,20" fill="#22c55e"/>
              <path d="M25,20 Q20,-20 30,-30 Q35,-5 25,20" fill="#16a34a"/>
              {/* Pot */}
              <path d="M10,40 L15,15 L35,15 L40,40 Z" fill="#ffffff" stroke="#f1f5f9" strokeWidth="2"/>
              <path d="M15,15 L35,15 L40,40 L10,40 Z" fill="#f8fafc" opacity="0.5"/>
            </g>

            {/* Main Books Stack Group */}
            <g className="anim-float" style={{ animationDelay: '0.5s' }}>
              {/* Book 3 (Bottom) */}
              <g transform="translate(95, 92) rotate(-1.5)">
                <rect x="0" y="0" width="110" height="22" rx="3" fill="#2563eb"/>
                <rect x="8" y="3" width="98" height="16" fill="#f8fafc"/>
                <rect x="0" y="0" width="12" height="22" rx="3" fill="#1d4ed8"/>
              </g>

              {/* Book 2 (Middle) */}
              <g transform="translate(100, 72) rotate(2)">
                <rect x="0" y="0" width="95" height="20" rx="3" fill="#fbbf24"/>
                <rect x="8" y="3" width="83" height="14" fill="#f8fafc"/>
                <rect x="0" y="0" width="12" height="20" rx="3" fill="#f59e0b"/>
                <rect x="50" y="0" width="8" height="28" rx="2" fill="#ef4444" opacity="0.9"/>
              </g>

              {/* Book 1 (Top) */}
              <g transform="translate(105, 54) rotate(-2)">
                <rect x="0" y="0" width="80" height="18" rx="3" fill="#3b82f6"/>
                <rect x="8" y="3" width="68" height="12" fill="#f8fafc"/>
                <rect x="0" y="0" width="12" height="18" rx="3" fill="#2563eb"/>
              </g>

              {/* Cute Coffee Cup on Top */}
              <g transform="translate(135, 36) rotate(3)">
                <rect x="0" y="0" width="20" height="18" rx="2" fill="#ffffff"/>
                <path d="M20,5 A5,5 0 0 1 20,13" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
                {/* Steam */}
                <path d="M5,-2 Q8,-7 4,-12" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12,-5 Q15,-10 11,-15" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
              </g>
            </g>
            
            {/* Sparkles */}
            <g className="anim-float" style={{ animationDelay: '1s' }}>
              <circle cx="230" cy="50" r="3" fill="#fbbf24" opacity="0.8"/>
              <circle cx="90" cy="40" r="2" fill="#4ade80" opacity="0.8"/>
              <path d="M210,70 L212,74 L216,76 L212,78 L210,82 L208,78 L204,76 L208,74 Z" fill="#fde047" opacity="0.8"/>
            </g>
          </svg>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in animate-fade-in-delay-1">
          <StatCard
            title="Total Mahasiswa Aktif"
            value={stats.totalMahasiswa}
            icon={<Users size={20} />}
            gradient="bg-blue-50 text-blue-600"
            trend={{ value: 5.2, label: 'dari tahun lalu' }}
          />
        </div>
        <div className="animate-fade-in animate-fade-in-delay-2">
          <StatCard
            title="Total Dosen"
            value={stats.totalDosen}
            icon={<GraduationCap size={20} />}
            gradient="from-emerald-500 to-teal-600"
            subtitle={`${stats.totalDosen - 4} DTPS`}
          />
        </div>
        <div className="animate-fade-in animate-fade-in-delay-3">
          <StatCard
            title="Lembaga Mitra Aktif"
            value={stats.totalMitra}
            icon={<Handshake size={20} />}
            gradient="from-amber-500 to-orange-600"
            trend={{ value: 8.3, label: 'dari tahun lalu' }}
          />
        </div>
        <div className="animate-fade-in animate-fade-in-delay-4">
          <StatCard
            title="Prestasi Mahasiswa"
            value={stats.totalPrestasi}
            subtitle="Tahun akademik ini"
            icon={<Trophy size={20} />}
            gradient="from-rose-500 to-pink-600"
            trend={{ value: 12, label: 'dari tahun lalu' }}
          />
        </div>
      </div>

      {/* Second Row - Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Rasio Keketatan PMB"
          value={`1:${stats.rasioKeketatan.toFixed(1)}`}
          icon={<BarChart3 size={20} />}
          gradient="from-sky-500 to-blue-600"
        />
        <StatCard
          title="Indeks Kepuasan"
          value={stats.indeksKepuasan.toFixed(2)}
          subtitle="Skala 1-5"
          icon={<SmilePlus size={20} />}
          gradient="from-violet-500 to-purple-600"
        />
        <StatCard
          title="Waktu Tunggu Kerja"
          value={`${stats.waktuTungguRata} bln`}
          subtitle="Rata-rata lulusan"
          icon={<Clock size={20} />}
          gradient="from-cyan-500 to-teal-600"
        />
        <StatCard
          title="Keterlibatan Mahasiswa"
          value={`${stats.persenKeterlibatan}%`}
          subtitle="dalam Penelitian/PkM"
          icon={<GitBranch size={20} />}
          gradient="from-fuchsia-500 to-pink-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* PMB Trend */}
        <div className="card">
          <h3 className="text-slate-800 font-semibold mb-1">Tren PMB Antar Tahun</h3>
          <p className="text-xs text-slate-500 mb-4">FR-02: Rasio keketatan dan persentase daftar ulang</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockTrenPMB} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="tahun" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ color: '#1E293B', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend />
              <Bar dataKey="pendaftar" name="Pendaftar" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lulus" name="Lulus Seleksi" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="daftar_ulang" name="Daftar Ulang" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Kepuasan */}
        <div className="card">
          <h3 className="text-slate-800 font-semibold mb-1">Indeks Kepuasan per Layanan</h3>
          <p className="text-xs text-slate-500 mb-4">FR-15: Indeks kepuasan dan tren antar periode</p>
          <div className="space-y-4">
            {mockKepuasanPerLayanan.map((item, i) => {
              const pct = (item.indeks / 5) * 100;
              const diff = item.indeks - item.prev;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600 font-medium">{item.layanan}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{item.indeks.toFixed(2)}</span>
                      <span className={`text-xs font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {diff >= 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Rata-rata</span>
            <span className="text-lg font-bold text-slate-800">
              {(mockKepuasanPerLayanan.reduce((a, b) => a + b.indeks, 0) / mockKepuasanPerLayanan.length).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row - More indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Integrasi & Pemanfaatan Mitra */}
        <div className="card">
          <h3 className="text-slate-800 font-semibold mb-4">Indikator Prodi Lainnya</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm text-slate-600 font-medium">Integrasi Penelitian/PkM</span>
                <span className="text-sm font-semibold text-slate-800">{stats.persenIntegrasi}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${stats.persenIntegrasi}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm text-slate-600 font-medium">Pemanfaatan Mitra</span>
                <span className="text-sm font-semibold text-slate-800">{stats.persenPemanfaatanMitra}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${stats.persenPemanfaatanMitra}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm text-slate-600 font-medium">Daftar Ulang PMB</span>
                <span className="text-sm font-semibold text-slate-800">{stats.persenDaftarUlang}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.persenDaftarUlang}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="lg:col-span-2 card">
          <h3 className="text-slate-800 font-semibold mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-3">
            {mockNotifications.slice(0, 5).map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                  n.is_dibaca ? 'bg-white opacity-70' : 'bg-blue-50/50 border border-blue-100/50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  n.is_dibaca ? 'bg-slate-300' : 'bg-blue-600'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{n.judul}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.isi}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
