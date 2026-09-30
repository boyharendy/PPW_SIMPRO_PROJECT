# Tutorial Kolaborasi Git & GitHub (Alur Kerja Tim)

Dokumen ini adalah panduan langkah demi langkah tentang bagaimana kelompok kita akan bekerja sama menggunakan Git dan GitHub tanpa merusak kode satu sama lain.

## Aturan Emas 🌟
1. **DILARANG KERAS** melakukan *push* (mengirim kode) secara langsung ke branch `main`.
2. Setiap kali ingin mengerjakan fitur baru atau memperbaiki *bug*, wajib membuat **Branch Baru**.
3. Pastikan untuk selalu memperbarui branch `main` lokal Anda sebelum membuat branch baru.

---

## 1. Pertama Kali Bergabung ke Proyek (Untuk Anggota Baru)

Langkah ini hanya dilakukan V**satu kali** saat Anda baru pertama kali ingin mulai bekerja.

1. Buka Terminal / Git Bash di folder tempat Anda ingin menyimpan proyek.
2. *Clone* (download) repositori ke komputer Anda:
   ```bash
   git clone https://github.com/boyharendy/PPW_SIMPRO_PROJECT.git
   ```
3. Masuk ke dalam folder proyek:
   ```bash
   cd PPW_SIMPRO_PROJECT
   ```

---

## 2. Alur Kerja Harian (Wajib Diikuti Setiap Mengerjakan Fitur)

Ikuti siklus ini setiap kali Anda akan mulai bekerja (misalnya membuat halaman baru atau mengubah desain).

### A. Persiapan (Update & Buat Branch)
Sebelum mulai ngoding, pastikan Anda berada di branch `main` yang paling *update* (terbaru).

1. Pindah ke branch `main`:
   ```bash
   git checkout main
   ```
2. Ambil perubahan terbaru dari GitHub (jika ada teman yang baru saja menggabungkan kodenya):
   ```bash
   git pull origin main
   ```
3. Buat "ruang kerja" (branch) baru khusus untuk fitur yang akan Anda kerjakan. Beri nama yang jelas (contoh: `fitur-halaman-aset` atau `fix-bug-login`).
   ```bash
   git checkout -b nama-fitur-anda
   ```

### B. Mulai Ngoding & Simpan Perubahan
Sekarang Anda berada di *branch* Anda sendiri. Anda bebas melakukan perubahan tanpa takut merusak aplikasi utama.

1. Silakan lakukan kodingan Anda di VS Code.
2. Jika sudah selesai atau ingin menyimpan progres, cek file apa saja yang berubah:
   ```bash
   git status
   ```
3. Tambahkan semua file yang berubah untuk disimpan:
   ```bash
   git add .
   ```
4. Simpan (*commit*) perubahan dengan pesan yang jelas (menjelaskan apa yang Anda kerjakan):
   ```bash
   git commit -m "Menambahkan desain awal untuk halaman aset"
   ```
*(Ulangi langkah B ini sesering yang Anda perlukan sampai fitur tersebut benar-benar selesai)*

### C. Mengirim Pekerjaan ke GitHub
Jika fitur Anda sudah selesai dan tidak ada *error*, saatnya mengirim *branch* Anda ke GitHub agar bisa direview oleh teman.

1. Kirim (*push*) branch Anda ke GitHub:
   ```bash
   git push origin nama-fitur-anda
   ```
   *(Pastikan `nama-fitur-anda` sesuai dengan nama branch yang Anda buat di Langkah A.3)*

### D. Menggabungkan Kode (Pull Request)
Pekerjaan Anda sekarang sudah ada di GitHub, tetapi **belum** masuk ke branch `main`.

1. Buka halaman repositori di GitHub: `https://github.com/boyharendy/PPW_SIMPRO_PROJECT`
2. Akan muncul tombol hijau bertuliskan **"Compare & pull request"**. Klik tombol tersebut.
3. Beri judul dan deskripsi singkat tentang apa yang Anda kerjakan.
4. Klik **Create pull request**.
5. Beri tahu teman kelompok Anda di grup chat (misal: WhatsApp/Discord) untuk mengecek kodingan Anda.
6. Teman Anda akan mengecek. Jika disetujui dan tidak ada masalah, salah satu dari kalian bisa mengklik tombol **Merge pull request** di halaman tersebut.

**Selesai!** Fitur Anda sekarang sudah resmi bergabung dengan aplikasi utama di branch `main`.

---

## 3. Kembali ke Langkah A
Setelah kode Anda berhasil di-merge (digabung), jika Anda ingin mengerjakan tugas baru yang lain, kembalilah ke langkah **A** (Pindah ke `main`, lakukan `git pull`, lalu buat branch baru lagi).
