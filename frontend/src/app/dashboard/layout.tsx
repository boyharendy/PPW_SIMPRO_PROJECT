import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import RoleGuard from '@/components/layout/RoleGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh lg:h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-dvh lg:h-screen overflow-x-clip">
        <Header />
        <main className="flex-1 p-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <RoleGuard>
            {children}
          </RoleGuard>
        </main>
      </div>
    </div>
  );
}
