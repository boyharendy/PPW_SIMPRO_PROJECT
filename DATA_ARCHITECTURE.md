# Arsitektur Data & Integrasi Frontend (Next.js) - Backend (Golang)

Dokumen ini adalah panduan lengkap arsitektur komunikasi data antara **Frontend (Next.js 16)** dan **Backend (Golang REST API)** untuk proyek **SIMPRO**.

---

## 1. Arsitektur Tingkat Tinggi (High-Level Architecture)

```
┌─────────────────────────────────┐
│       NEXT.JS (FRONTEND)        │
│  - React 19 + TypeScript        │
│  - Tailwind CSS + App Router    │
│  - Token Storage (JWT)          │
│  - Centralized API Client Layer │
└────────────────┬────────────────┘
                 │ HTTP / HTTPS (JSON)
                 │ Bearer Token Authentication
                 ▼
┌─────────────────────────────────┐
│        GOLANG (BACKEND)         │
│  - Framework: Gin / Fiber / Chi │
│  - RESTful API (v1)             │
│  - JWT Middleware (RBAC)        │
│  - Clean Architecture           │
└────────────────┬────────────────┘
                 │ SQL / GORM / pgx
                 ▼
┌─────────────────────────────────┐
│       DATABASE RELASIONAL       │
│  - PostgreSQL / MySQL           │
└─────────────────────────────────┘
```

---

## 2. Struktur Data Layer di Frontend (Next.js)

Folder `src/lib/` telah dirombak dan distandarisasi untuk komunikasi dengan backend Golang:

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts         # HTTP Client (Fetch wrapper, interceptor auth, error class)
│   │   ├── endpoints.ts      # Daftar URL route endpoint backend terpusat
│   │   ├── index.ts          # Central export untuk API module
│   │   └── services/         # Layanan per domain/entitas
│   │       ├── auth.service.ts   # Autentikasi (login, register, getMe, refresh, logout)
│   │       └── user.service.ts   # CRUD Pengguna & profil
│   ├── hooks/
│   │   └── useApi.ts         # React hook untuk fetching data (loading, data, error, refetch)
│   ├── types/
│   │   └── api.ts            # Envelope response Go, pagination meta, auth types
│   ├── context.tsx           # Session state management (sinkronisasi token backend)
│   └── navigation.ts         # Konfigurasi menu navigasi
├── .env.example              # Template variabel lingkungan
└── .env.local                # Konfigurasi API URL lokal
```

---

## 3. Kontrak Respons API (Standard Response Envelope)

Backend Golang **wajib** mengembalikan format JSON yang konsisten agar dapat dibaca otomatis oleh frontend Next.js.

### A. Respons Sukses (`ApiResponse<T>`)
```json
{
  "success": true,
  "message": "Data berhasil dimuat",
  "data": {
    "id": "usr-123",
    "nama_lengkap": "Dr. Dosen, M.Kom",
    "email": "dosen@universitas.ac.id",
    "roles": ["DOSEN", "KAPRODI"],
    "active_role": "KAPRODI"
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_records": 48,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

### B. Respons Error (`ApiErrorResponse`)
```json
{
  "success": false,
  "message": "Validasi gagal",
  "code": "VALIDATION_ERROR",
  "errors": {
    "email": ["Email sudah digunakan oleh akun lain"],
    "password": ["Password minimal harus 8 karakter"]
  }
}
```

---

## 4. Konfigurasi Lingkungan (`.env.local`)

Di frontend, konfigurasi backend disimpan pada file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_TIMEOUT=15000
```

---

## 5. Rekomendasi Struktur Proyek Backend Golang

Untuk tim yang mengembangkan backend Golang, disarankan menggunakan **Clean Architecture** (atau Standard Go Project Layout):

```
backend-simpro/
├── cmd/
│   └── api/
│       └── main.go                  # Entry point aplikasi Go
├── internal/
│   ├── config/                      # Konfigurasi database, JWT, port server
│   ├── delivery/
│   │   └── http/
│   │       ├── middleware/          # Auth middleware (JWT), CORS, Logger
│   │       ├── handler/             # Controller handler (AuthHandler, UserHandler)
│   │       └── router.go            # Registrasi route API (/api/v1/...)
│   ├── usecase/                     # Logika bisnis (AuthUsecase, UserUsecase)
│   ├── repository/                  # Akses database (GORM / sqlx)
│   └── model/                       # Entity struct & DTOs
└── pkg/
    └── response/                    # Helper response JSON standard
```

### Contoh Helper Response di Golang (Gin Framework):

```go
package response

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

type Meta struct {
	Page         int  `json:"page,omitempty"`
	Limit        int  `json:"limit,omitempty"`
	TotalRecords int  `json:"total_records,omitempty"`
	TotalPages   int  `json:"total_pages,omitempty"`
}

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
	Errors  interface{} `json:"errors,omitempty"`
}

func Success(c *gin.Context, httpStatus int, message string, data interface{}, meta *Meta) {
	c.JSON(httpStatus, Response{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	})
}

func Error(c *gin.Context, httpStatus int, message string, errors interface{}) {
	c.JSON(httpStatus, Response{
		Success: false,
		Message: message,
		Errors:  errors,
	})
}
```

---

## 6. Cara Menggunakan API Client di Frontend Next.js

### A. Memanggil Service Secara Langsung
```typescript
import { authService } from '@/lib/api';

async function handleLogin() {
  try {
    const res = await authService.login({
      email: 'user@universitas.ac.id',
      password: 'mypassword',
    });
    console.log('Login sukses:', res.data.user);
  } catch (error) {
    console.error('Login gagal:', error.message);
  }
}
```

### B. Menggunakan React Hook `useApi` di Komponen
```tsx
'use client';

import { useApi } from '@/lib/hooks/useApi';
import { userService } from '@/lib/api';

export default function UserListPage() {
  const { data: users, loading, error, refetch } = useApi(
    () => userService.getUsers({ page: 1, limit: 10 })
  );

  if (loading) return <div>Memuat data dari Golang backend...</div>;
  if (error) return <div>Gagal memuat: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()} className="btn-secondary">Refresh</button>
      <ul>
        {users?.map(u => (
          <li key={u.id}>{u.nama_lengkap} ({u.email})</li>
        ))}
      </ul>
    </div>
  );
}
```

### C. Menambahkan Service Baru (Contoh: Modul Baru)
Cukup buat file baru di `src/lib/api/services/nama_fitur.service.ts`:
```typescript
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types/api';

export const namaFiturService = {
  getAll() {
    return apiClient.get('/nama-fitur');
  },
  create(payload: any) {
    return apiClient.post('/nama-fitur', payload);
  },
};
```
Lalu ekspor di `src/lib/api/index.ts`.
