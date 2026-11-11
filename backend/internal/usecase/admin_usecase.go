package usecase

import (
	"errors"
	"strings"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/scheduler"
)

type AdminUsecase interface {
	GetSettings() ([]*model.AppSetting, error)
	GetSettingByKey(key string) (*model.AppSetting, error)
	UpdateSetting(key, value string) error
	GetUserRoles() ([]*model.UserRoleAssignment, error)
	AssignUserRole(assignment *model.UserRoleAssignment) error
	RevokeUserRole(id string) error
	GetAuditLogs(page, limit int) ([]*model.AuditLog, int, error)
	RunSchedulerJobs() map[string]int
}

type adminUsecase struct {
	repo      repository.AdminRepository
	scheduler scheduler.Scheduler
}

func NewAdminUsecase(repo repository.AdminRepository, sched scheduler.Scheduler) AdminUsecase {
	return &adminUsecase{
		repo:      repo,
		scheduler: sched,
	}
}

func (u *adminUsecase) GetSettings() ([]*model.AppSetting, error) {
	return u.repo.GetSettings()
}

func (u *adminUsecase) GetSettingByKey(key string) (*model.AppSetting, error) {
	return u.repo.GetSettingByKey(key)
}

func (u *adminUsecase) UpdateSetting(key, value string) error {
	if strings.TrimSpace(key) == "" {
		return errors.New("key konfigurasi tidak boleh kosong")
	}
	return u.repo.UpdateSetting(key, value)
}

func (u *adminUsecase) GetUserRoles() ([]*model.UserRoleAssignment, error) {
	return u.repo.GetUserRoles()
}

func (u *adminUsecase) AssignUserRole(assignment *model.UserRoleAssignment) error {
	if assignment.UserID == "" || assignment.Role == "" {
		return errors.New("user_id dan role wajib diisi")
	}
	return u.repo.AssignUserRole(assignment)
}

func (u *adminUsecase) RevokeUserRole(id string) error {
	return u.repo.RevokeUserRole(id)
}

func (u *adminUsecase) GetAuditLogs(page, limit int) ([]*model.AuditLog, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit
	return u.repo.GetAuditLogs(limit, offset)
}

func (u *adminUsecase) RunSchedulerJobs() map[string]int {
	if u.scheduler != nil {
		return u.scheduler.RunAllJobs()
	}
	return make(map[string]int)
}

