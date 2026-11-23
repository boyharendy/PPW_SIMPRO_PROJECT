# SIMPRO

SIMPRO (Sistem Informasi Manajemen Program Studi) adalah aplikasi web internal untuk memusatkan 14 modul operasional program studi dalam satu sistem terpadu.

## Menjalankan Aplikasi

### Pengembangan lokal tanpa login

Dari direktori proyek, siapkan frontend dengan Node.js dan npm. Perintah PowerShell berikut memakai konfigurasi contoh jika belum ada konfigurasi lokal.

```powershell
npm install
<<<<<<< HEAD

=======
if (!(Test-Path frontend/.env.local)) { Copy-Item frontend/.env.example frontend/.env.local }
>>>>>>> origin/MODUL-7---13
npm run dev
```

Pastikan `NEXT_PUBLIC_DEV_SKIP_LOGIN=true` di `frontend/.env.local`. Buka [dashboard lokal](http://localhost:3000/dashboard). Dashboard langsung menampilkan peran Kaprodi, termasuk saat API Go mati. Anda dapat mengganti peran melalui menu dashboard. Pilihan tersimpan saat tab yang sama dimuat ulang.

Mode ini berlaku saat menjalankan `next dev` melalui `localhost`, `127.0.0.1`, atau `[::1]`. Halaman dengan data contoh dapat digunakan secara lokal. Operasi yang membaca atau menyimpan data melalui endpoint terproteksi memerlukan API aktif dan sesi login. Build produksi selalu menggunakan autentikasi.

### Mengaktifkan kembali login untuk pengujian

1. Ubah `NEXT_PUBLIC_DEV_SKIP_LOGIN=true` menjadi `NEXT_PUBLIC_DEV_SKIP_LOGIN=false` di `frontend/.env.local`.
2. Siapkan Go 1.25 atau lebih baru. Dari root proyek, jalankan API di terminal terpisah.

   ```powershell
   if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
   npm run dev:backend
   ```

   Jika terminal tidak menemukan `go`, isi `SIMPRO_GO_EXE` di `backend/.env` dengan path lengkap ke executable Go, lalu jalankan ulang API. Periksa [status API lokal](http://localhost:8080/api/v1/health).

3. Hentikan frontend dengan `Ctrl+C`, lalu jalankan kembali `npm run dev`. Buka dashboard di jendela privat baru untuk melihat formulir login dan masuk dengan [akun demo lokal](backend/README.md#akun-demo-lokal).

Untuk kembali mengembangkan tampilan tanpa login, ubah nilainya menjadi `true` dan jalankan ulang frontend.

## Perintah Tersedia

- `npm run dev` atau `npm run dev:frontend` - menjalankan frontend Next.js.
- `npm run dev:backend` - menjalankan API Go.
- `npm run lint` - memeriksa kode dengan ESLint.
- `npm run build` - membuat build produksi.
- `npm run start --prefix frontend` - menjalankan build frontend yang sudah dibuat.

