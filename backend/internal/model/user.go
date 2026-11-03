package model

import "time"

type Role string

const (
	// 10 Peran Tetap Utama (PRD Bab 8.1)
	RoleKaprodi          Role = "KAPRODI"
	RoleGKM              Role = "GKM"
	RoleAdminProdi       Role = "ADMIN_PRODI"
	RoleDosen            Role = "DOSEN"
	RoleKoordKP          Role = "KOORDINATOR_KP"
	RoleKoordPSI         Role = "KOORDINATOR_PSI"
	RoleKoordPDLK        Role = "KOORDINATOR_PDLK"
	RolePengelolaAduan   Role = "PENGELOLA_ADUAN"
	RolePetugasKekerasan Role = "PETUGAS_KEKERASAN"
	RoleMahasiswa        Role = "MAHASISWA"

	// Peran Kompatibilitas Data Induk (PRD Bab 6.A poin 2)
	RolePengurusHimpunan Role = "PENGURUS_HIMPUNAN"
	RoleDosenWali        Role = "DOSEN_WALI"
	RoleDosenPembina     Role = "DOSEN_PEMBINA"
	RoleKetuaKelas       Role = "KETUA_KELAS"
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
