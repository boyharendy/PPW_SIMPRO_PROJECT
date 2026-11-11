package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/scheduler"
	"simpro-backend/internal/usecase"
)

func TestAdminUsecase(t *testing.T) {
	adminRepo := repository.NewMemoryAdminRepository()
	surveyRepo := repository.NewMemorySurveyRepository()
	pubRepo := repository.NewMemoryPublicationRepository()
	tripRepo := repository.NewMemoryTripRepository()
	rkaRepo := repository.NewMemoryRkaRepository()
	rpsRepo := repository.NewMemoryRpsRepository()
	evalRepo := repository.NewMemoryEvaluationRepository()
	complaintRepo := repository.NewMemoryComplaintRepository()

	sched := scheduler.NewScheduler(
		surveyRepo,
		pubRepo,
		tripRepo,
		rkaRepo,
		rpsRepo,
		evalRepo,
		complaintRepo,
		adminRepo,
	)

	uc := usecase.NewAdminUsecase(adminRepo, sched)

	// 1. Settings
	settings, err := uc.GetSettings()
	if err != nil || len(settings) == 0 {
		t.Fatalf("GetSettings failed: %v", err)
	}

	err = uc.UpdateSetting("sla_verifikasi_aduan_hari", "7")
	if err != nil {
		t.Fatalf("UpdateSetting failed: %v", err)
	}

	s, err := uc.GetSettingByKey("sla_verifikasi_aduan_hari")
	if err != nil || s.Value != "7" {
		t.Fatalf("expected updated value 7, got %v", s)
	}

	// 2. User Roles Assignment
	assignment := &model.UserRoleAssignment{
		UserID:              "dosen-test-1",
		NamaLengkap:         "Dosen Penguji",
		Email:               "penguji@simpro.ac.id",
		Role:                "DOSEN_VERIFIKATOR",
		PenangananKekerasan: false,
	}
	err = uc.AssignUserRole(assignment)
	if err != nil {
		t.Fatalf("AssignUserRole failed: %v", err)
	}

	roles, err := uc.GetUserRoles()
	if err != nil || len(roles) == 0 {
		t.Fatalf("GetUserRoles failed: %v", err)
	}

	err = uc.RevokeUserRole(assignment.ID)
	if err != nil {
		t.Fatalf("RevokeUserRole failed: %v", err)
	}

	// 3. Audit Logs
	_ = adminRepo.LogAudit(&model.AuditLog{
		UserID:   "admin-1",
		NamaUser: "Admin Prodi",
		Aksi:     "UPDATE",
		Tabel:    "app_settings",
		RecordID: "sla_verifikasi_aduan_hari",
	})

	logs, total, err := uc.GetAuditLogs(1, 10)
	if err != nil || total == 0 || len(logs) == 0 {
		t.Fatalf("GetAuditLogs failed: %v", err)
	}

	// 4. Trigger Scheduler Batch Execution
	results := uc.RunSchedulerJobs()
	if len(results) != 8 {
		t.Errorf("expected 8 scheduler jobs, got %d", len(results))
	}
}

