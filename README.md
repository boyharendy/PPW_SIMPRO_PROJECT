# SIMPRO

SIMPRO (Sistem Informasi Manajemen Program Studi) adalah aplikasi web internal untuk memusatkan 14 modul operasional program studi dalam satu sistem terpadu.

## Menjalankan Aplikasi

Login SIMPRO menggunakan API Go. Siapkan Node.js, npm, dan Go 1.25 atau lebih baru. Dari direktori proyek, jalankan persiapan lokal sekali di PowerShell.

```powershell
npm install
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Jalankan API di terminal pertama. Biarkan proses ini aktif selama memakai aplikasi.

```sh
npm run dev:backend
```

Jika terminal tidak menemukan `go`, isi `SIMPRO_GO_EXE` di `backend/.env` dengan path lengkap ke executable Go yang tersedia di komputer.

Jalankan frontend di terminal kedua dari direktori proyek yang sama.

```sh
npm run dev
```

Buka [dashboard lokal](http://localhost:3000/dashboard). Akun Kaprodi untuk mode pengembangan tersedia di [panduan backend](backend/README.md#akun-demo-lokal). Untuk memeriksa apakah API berjalan, buka [status API lokal](http://localhost:8080/api/v1/health).

Untuk membuka dashboard tanpa mengisi formulir, set `NEXT_PUBLIC_DEV_AUTO_LOGIN=true` di `frontend/.env.local` dan jalankan ulang frontend. Selama sesi demo masih berlaku, dashboard mempertahankan peran yang dipilih. Saat sesi kedaluwarsa atau hilang setelah API dimulai ulang, membuka atau memuat ulang dashboard membuat sesi Kaprodi demo baru. Gunakan `false` dan jalankan ulang frontend untuk menguji formulir login. Masuk otomatis hanya tersedia dengan `next dev` dan alamat loopback pada frontend serta API.

## Perintah Tersedia

- `npm run dev` atau `npm run dev:frontend` - menjalankan frontend Next.js.
- `npm run dev:backend` - menjalankan API Go.
- `npm run lint` - memeriksa kode dengan ESLint.
- `npm run build` - membuat build produksi.
- `npm run start --prefix frontend` - menjalankan build frontend yang sudah dibuat.

