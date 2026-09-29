import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context';

export const metadata: Metadata = {
  title: 'SIMPRO — Sistem Informasi Manajemen Program Studi',
  description: 'Aplikasi web internal untuk memusatkan 14 modul operasional program studi dalam satu sistem terpadu.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
