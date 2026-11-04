package model

import "time"

type Role string

const (
	// 13 Aktor Utama SIMPRO (Spesifikasi Resmi Pengguna)
	RoleKaprodi          Role = "KAPRODI"
	RoleGKM              Role = "GKM"
	RoleAdminProdi       Role = "ADMIN_PRODI"
	RoleDosen            Role = "DOSEN"
	RoleDosenVerifikator Role = "DOSEN_VERIFIKATOR"
	RoleDosenWali        Role = "DOSEN_WALI"
	RoleDosenPembina     Role = "DOSEN_PEMBINA"
	RoleKetuaKelas       Role = "KETUA_KELAS"
	RoleMahasiswa        Role = "MAHASISWA"
	RolePengurusHimpunan Role = "PENGURUS_HIMPUNAN"
	RoleKoordKP_PSI_PDLK Role = "KOORDINATOR_KP_PSI_PDLK"
	RolePengelolaAduan   Role = "PENGELOLA_ADUAN"
	RoleMitra            Role = "MITRA"

	// Alias Kompatibilitas Sistem & Data Induk
	RoleKoordKP          Role = "KOORDINATOR_KP"
	RoleKoordPSI         Role = "KOORDINATOR_PSI"
	RoleKoordPDLK        Role = "KOORDINATOR_PDLK"
	RolePetugasKekerasan Role = "PETUGAS_KEKERASAN"
	RoleMitraEksternal   Role = "MITRA_EKSTERNAL"
	RoleHimpunan         Role = "HIMPUNAN"
)

type User struct {
	ID          string    `json:"id"`
	NamaLengkap string    `json:"nama_lengkap"`
	Email       string    `json:"email"`
	Password    string    `json:"-"` // Hidden from JSON serialization
	Roles       []Role    `json:"roles"`
	ActiveRole  Role      `json:"active_role"`
	AvatarURL   string    `json:"avatar_url,omitempty"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
