# SIMPRO Design System

Panduan ini mendefinisikan standar visual dan komponen UI untuk proyek SIMPRO (Sistem Informasi Manajemen Program Studi). Sistem desain ini beralih dari tema gelap (Dark Mode Glassmorphism) ke tema terang (Light Mode Clean Blue & White) yang lebih formal, bersih, dan profesional sesuai standar administrasi akademik.

## 1. Design Tokens & Palet Warna

- **Primary Brand**: `bg-blue-600` (#2563EB) - Digunakan untuk Sidebar, tombol utama, dan aksen interaktif.
- **Background Canvas**: `bg-slate-50` (#F8FAFC) - Warna latar belakang area konten utama. Sangat lembut dan kontras dengan kartu putih.
- **Card Background**: `bg-white` (#FFFFFF) - Digunakan untuk semua kontainer konten (Tabel, Form, Statistik).
- **Border / Divider**: `border-slate-200` (#E2E8F0) - Garis pembatas halus antar elemen.
- **Text Primary**: `text-slate-800` (#1E293B) - Untuk teks utama, judul, dan data penting.
- **Text Secondary**: `text-slate-500` (#64748B) - Untuk deskripsi, label tabel, dan placeholder.
- **Status Colors**:
  - Success: `text-emerald-600` / `bg-emerald-50`
  - Warning: `text-amber-600` / `bg-amber-50`
  - Danger: `text-rose-600` / `bg-rose-50`
  - Info: `text-blue-600` / `bg-blue-50`

## 2. Typography System

Menggunakan font modern Sans-Serif (Inter/Roboto default dari Tailwind).
- **H1 (Page Title)**: `text-2xl font-bold text-slate-800`
- **H2 (Section/Card Title)**: `text-lg font-semibold text-slate-800`
- **H3 (Modal/Small Title)**: `text-base font-semibold text-slate-800`
- **Body**: `text-sm text-slate-700`
- **Caption/Label**: `text-xs font-medium text-slate-500 uppercase tracking-wider`

## 3. Component Specs & Layout Rules

### Layout Blueprint
- **Sidebar**: Fixed kiri, `w-72` (desktop), `bg-blue-600`, teks putih. Item aktif menggunakan latar putih dengan teks biru `bg-white text-blue-600 rounded-xl`.
- **Header**: Sticky atas, `h-16`, `bg-white border-b border-slate-200`. Terdapat kolom pencarian dan profil user.
- **Main Canvas**: `overflow-y-auto bg-slate-50 p-4 lg:p-6`.

### Cards (`.card`)
Kontainer utama untuk konten.
- **Class default**: `bg-white rounded-2xl border border-slate-200 shadow-sm p-5`

### Buttons
- **Primary**: `bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-700 transition-colors font-medium`
- **Secondary**: `bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors font-medium`
- **Danger**: `bg-rose-500 text-white rounded-xl px-4 py-2 hover:bg-rose-600`

### Inputs (`.input-field`, `.select-field`)
- **Style**: `w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`
- Label di atas input menggunakan `text-sm font-medium text-slate-700 mb-1.5 block`.

### DataTable
- Header tabel: `bg-slate-50/50` dengan teks `text-xs font-semibold text-slate-500 uppercase`.
- Baris tabel: Latar transparan (putih), border bawah `border-slate-100`, hover effect `hover:bg-slate-50`.

## 4. New Feature Checklist

Saat menambahkan halaman atau fitur baru, pastikan mengikuti langkah berikut agar UI konsisten:
1. [ ] **Page Header**: Gunakan komponen `<PageHeader>` di bagian teratas.
2. [ ] **Cards**: Bungkus semua metrik, tabel, atau form dalam elemen `<div className="card">...</div>`. JANGAN meletakkan konten langsung di atas kanvas abu-abu.
3. [ ] **Tables**: Gunakan `<DataTable>` untuk semua list data. Jangan membuat tabel manual dengan <table> tag kecuali sangat spesifik.
4. [ ] **Forms/Modals**: Gunakan komponen `<Modal>`. Gunakan class `.input-field` dan `.label` dari `globals.css` untuk elemen form.
5. [ ] **Icons**: Gunakan `lucide-react`. Sesuaikan warna ikon dengan konteks (misal ikon biru untuk info, hijau untuk sukses).
6. [ ] **Spacing**: Gunakan spacing standar Tailwind (`gap-4`, `gap-6`, `mb-6`, `space-y-6`).
