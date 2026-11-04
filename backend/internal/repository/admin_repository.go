package repository

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"simpro-backend/internal/database"
	"simpro-backend/internal/model"
)

type AdminRepository interface {
	GetSettings() ([]*model.AppSetting, error)
	GetSettingByKey(key string) (*model.AppSetting, error)
	UpdateSetting(key, value string) error
	GetUserRoles() ([]*model.UserRoleAssignment, error)
	AssignUserRole(assignment *model.UserRoleAssignment) error
	RevokeUserRole(id string) error
	GetAuditLogs(limit, offset int) ([]*model.AuditLog, int, error)
	LogAudit(log *model.AuditLog) error
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabaseAdminRepository struct {
	client *database.SupabaseClient
}

func NewSupabaseAdminRepository(client *database.SupabaseClient) AdminRepository {
	return &supabaseAdminRepository{client: client}
}

func (r *supabaseAdminRepository) GetSettings() ([]*model.AppSetting, error) {
	var list []*model.AppSetting
	err := r.client.Select("app_settings", map[string]string{
		"order": "key.asc",
	}, &list)
	if err != nil {
		return nil, fmt.Errorf("gagal query app_settings: %w", err)
	}
	return list, nil
}

func (r *supabaseAdminRepository) GetSettingByKey(key string) (*model.AppSetting, error) {
	var list []*model.AppSetting
	err := r.client.Select("app_settings", map[string]string{
		"key":   fmt.Sprintf("eq.%s", key),
		"limit": "1",
	}, &list)
	if err != nil || len(list) == 0 {
		return nil, errors.New("konfigurasi tidak ditemukan")
	}
	return list[0], nil
}

func (r *supabaseAdminRepository) UpdateSetting(key, value string) error {
	return r.client.Update("app_settings", map[string]string{
		"key": fmt.Sprintf("eq.%s", key),
	}, map[string]interface{}{
		"value":      value,
		"updated_at": time.Now().Format(time.RFC3339),
	}, nil)
}

func (r *supabaseAdminRepository) GetUserRoles() ([]*model.UserRoleAssignment, error) {
	var list []*model.UserRoleAssignment
	err := r.client.Select("user_roles", map[string]string{
		"order": "created_at.desc",
	}, &list)
	if err != nil {
		return nil, fmt.Errorf("gagal query user_roles: %w", err)
	}
	return list, nil
}

func (r *supabaseAdminRepository) AssignUserRole(assignment *model.UserRoleAssignment) error {
	if assignment.ID == "" {
		assignment.ID = uuid.New().String()
	}
	assignment.CreatedAt = time.Now()
	return r.client.Insert("user_roles", assignment, nil)
}

func (r *supabaseAdminRepository) RevokeUserRole(id string) error {
	return r.client.Delete("user_roles", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	})
}

func (r *supabaseAdminRepository) GetAuditLogs(limit, offset int) ([]*model.AuditLog, int, error) {
	if limit <= 0 {
		limit = 20
	}
	params := map[string]string{
		"order":  "created_at.desc",
		"limit":  fmt.Sprintf("%d", limit),
		"offset": fmt.Sprintf("%d", offset),
	}
	var list []*model.AuditLog
	err := r.client.Select("audit_logs", params, &list)
	if err != nil {
		return nil, 0, fmt.Errorf("gagal query audit_logs: %w", err)
	}
	total, _ := r.client.Count("audit_logs", map[string]string{})
	if total == 0 {
		total = len(list)
	}
	return list, total, nil
}

func (r *supabaseAdminRepository) LogAudit(log *model.AuditLog) error {
	if log.ID == "" {
		log.ID = uuid.New().String()
	}
	log.CreatedAt = time.Now()
	return r.client.Insert("audit_logs", log, nil)
}

// ============================================================
// In-Memory Mock Implementation
// ============================================================

type memoryAdminRepository struct {
	mu        sync.RWMutex
	settings  map[string]*model.AppSetting
	userRoles map[string]*model.UserRoleAssignment
	auditLogs []*model.AuditLog
}

func NewMemoryAdminRepository() AdminRepository {
	repo := &memoryAdminRepository{
		settings:  make(map[string]*model.AppSetting),
		userRoles: make(map[string]*model.UserRoleAssignment),
		auditLogs: make([]*model.AuditLog, 0),
	}

	// Seed default settings from PRD Bab 11
	defaultSettings := []*model.AppSetting{
		{Key: "sla_verifikasi_aduan_hari", Value: "5", Deskripsi: "SLA verifikasi awal aduan mahasiswa (hari kerja)", Tipe: "NUMBER"},
		{Key: "tenggat_laporan_sppd_hari", Value: "7", Deskripsi: "Batas waktu unggah berkas SPJ setelah tanggal kembali (hari)", Tipe: "NUMBER"},
		{Key: "tenggat_review_rps_hari", Value: "14", Deskripsi: "Batas waktu dosen reviewer menyelesaikan review RPS (hari)", Tipe: "NUMBER"},
		{Key: "tenggat_survei_mitra_hari", Value: "30", Deskripsi: "Masa berlaku tautan token kuesioner mitra sebelum kedaluwarsa (hari)", Tipe: "NUMBER"},
		{Key: "autoclose_aduan_hari", Value: "14", Deskripsi: "Penutupan otomatis tiket aduan setelah status SELESAI tanpa respon (hari)", Tipe: "NUMBER"},
		{Key: "max_upload_mb", Value: "10", Deskripsi: "Ukuran maksimal unggahan dokumen lampiran (MB)", Tipe: "NUMBER"},
	}

	for _, s := range defaultSettings {
		s.UpdatedAt = time.Now()
		repo.settings[s.Key] = s
	}

	// Seed default special role assignments
	defaultRoles := []*model.UserRoleAssignment{
		{
			ID:                  "ur-001",
			UserID:              "dosen-verifikator-1",
			NamaLengkap:         "Dr. Indah Wahyuni, M.T.",
			Email:               "indah@simpro.ac.id",
			Role:                "DOSEN_VERIFIKATOR",
			PenangananKekerasan: false,
			CreatedAt:           time.Now(),
		},
		{
			ID:                  "ur-002",
			UserID:              "petugas-aduan-1",
			NamaLengkap:         "Siti Rahmawati, S.Kom.",
			Email:               "siti.aduan@simpro.ac.id",
			Role:                "PENGELOLA_ADUAN",
			PenangananKekerasan: true, // Petugas Kekerasan (PGL-K)
			CreatedAt:           time.Now(),
		},
	}

	for _, r := range defaultRoles {
		repo.userRoles[r.ID] = r
	}

	return repo
}

func (r *memoryAdminRepository) GetSettings() ([]*model.AppSetting, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []*model.AppSetting
	for _, s := range r.settings {
		list = append(list, s)
	}
	return list, nil
}

func (r *memoryAdminRepository) GetSettingByKey(key string) (*model.AppSetting, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, ok := r.settings[key]
	if !ok {
		return nil, errors.New("konfigurasi tidak ditemukan")
	}
	return s, nil
}

func (r *memoryAdminRepository) UpdateSetting(key, value string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	s, ok := r.settings[key]
	if !ok {
		s = &model.AppSetting{Key: key, Tipe: "STRING"}
		r.settings[key] = s
	}
	s.Value = value
	s.UpdatedAt = time.Now()
	return nil
}

func (r *memoryAdminRepository) GetUserRoles() ([]*model.UserRoleAssignment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []*model.UserRoleAssignment
	for _, ur := range r.userRoles {
		list = append(list, ur)
	}
	return list, nil
}

func (r *memoryAdminRepository) AssignUserRole(assignment *model.UserRoleAssignment) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if assignment.ID == "" {
		assignment.ID = uuid.New().String()
	}
	assignment.CreatedAt = time.Now()
	r.userRoles[assignment.ID] = assignment
	return nil
}

func (r *memoryAdminRepository) RevokeUserRole(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.userRoles[id]; !ok {
		return errors.New("penugasan peran tidak ditemukan")
	}
	delete(r.userRoles, id)
	return nil
}

func (r *memoryAdminRepository) GetAuditLogs(limit, offset int) ([]*model.AuditLog, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	total := len(r.auditLogs)
	if offset >= total {
		return []*model.AuditLog{}, total, nil
	}
	end := offset + limit
	if end > total || limit <= 0 {
		end = total
	}
	return r.auditLogs[offset:end], total, nil
}

func (r *memoryAdminRepository) LogAudit(log *model.AuditLog) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if log.ID == "" {
		log.ID = uuid.New().String()
	}
	log.CreatedAt = time.Now()
	r.auditLogs = append([]*model.AuditLog{log}, r.auditLogs...)
	return nil
}

