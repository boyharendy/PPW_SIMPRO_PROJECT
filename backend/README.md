# SIMPRO - Golang Backend Service

Backend RESTful API untuk Sistem Informasi Manajemen Program Studi (SIMPRO), dibangun menggunakan **Go (Golang)** dengan **Gin Web Framework** dan arsitektur modular (*Clean Architecture*).

---

## 🚀 Persyaratan Sistem
- [Go (Golang)](https://go.dev/dl/) versi 1.21 ke atas.

---

## 🛠️ Cara Menjalankan Backend

### 1. Masuk ke direktori backend
```bash
cd backend
```

### 2. Unduh dependensi (Go Modules)
```bash
go mod tidy
```

### 3. Salin file konfigurasi environment
```bash
cp .env.example .env
```

### 4. Jalankan Server
```bash
go run cmd/api/main.go
```
Server akan aktif di: **`http://localhost:8080/api/v1`**

---

## 🧪 Endpoint Pengujian Cepat

| Metode | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/api/v1/health` | Status kesehatan backend | Publik |
| `POST` | `/api/v1/auth/login` | Login user & dapatkan token JWT | Publik |
| `POST` | `/api/v1/auth/register` | Pendaftaran user baru | Publik |
| `GET` | `/api/v1/auth/me` | Profil user aktif | Bearer Token |
| `POST` | `/api/v1/auth/switch-role` | Ganti peran aktif | Bearer Token |
| `GET` | `/api/v1/users` | List pengguna (paginasi & search) | Bearer Token |

### Kredensial Uji Coba Default:
- **Email**: `kaprodi@universitas.ac.id`
- **Password**: `password123`
- **Peran**: Kaprodi, Dosen, GKM, dll.

---

## 📂 Struktur Direktori

```
backend/
├── cmd/
│   └── api/
│       └── main.go                  # Titik masuk utama server Go
├── internal/
│   ├── config/                      # Konfigurasi aplikasi & environment
│   ├── delivery/
│   │   └── http/
│   │       ├── handler/             # Handler request/response HTTP (Controller)
│   │       ├── middleware/          # JWT Auth, CORS, RBAC Middleware
│   │       └── router.go            # Registrasi router & endpoint
│   ├── model/                       # Definisi struct entitas & DTO
│   ├── repository/                  # Akses layer data / database
│   └── usecase/                     # Logika bisnis aplikasi
├── pkg/
│   ├── response/                    # Standard JSON response helper
│   └── utils/                       # Utility JWT token & hashing
├── .env.example
├── go.mod
└── README.md
```
