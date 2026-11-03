package model

import "time"

type Role string

const (
	RoleKaprodi     Role = "KAPRODI"
	RoleGKM         Role = "GKM"
	RoleKoordKP     Role = "KOORD_KP"
	RoleKoordTA     Role = "KOORD_TA"
	RoleKoordMagang Role = "KOORD_MAGANG"
	RoleHimpunan    Role = "HIMPUNAN"
	RoleDosen       Role = "DOSEN"
	RoleMahasiswa   Role = "MAHASISWA"
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
