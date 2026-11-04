package model

import "time"

type AppSetting struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	Deskripsi string    `json:"deskripsi,omitempty"`
	Tipe      string    `json:"tipe,omitempty"` // STRING | NUMBER | BOOLEAN | JSON
	IsSecret  bool      `json:"is_secret"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AuditLog struct {
	ID        string                 `json:"id"`
	UserID    string                 `json:"user_id,omitempty"`
	NamaUser  string                 `json:"nama_user,omitempty"`
	Aksi      string                 `json:"aksi"`
	Tabel     string                 `json:"tabel"`
	RecordID  string                 `json:"record_id"`
	DataLama  map[string]interface{} `json:"data_lama,omitempty"`
	DataBaru  map[string]interface{} `json:"data_baru,omitempty"`
	CreatedAt time.Time              `json:"created_at"`
}

type UserRoleAssignment struct {
	ID                  string    `json:"id"`
	UserID              string    `json:"user_id"`
	NamaLengkap         string    `json:"nama_lengkap,omitempty"`
	Email               string    `json:"email,omitempty"`
	Role                string    `json:"role"`
	PenangananKekerasan bool      `json:"penanganan_kekerasan"`
	CreatedAt           time.Time `json:"created_at"`
}

