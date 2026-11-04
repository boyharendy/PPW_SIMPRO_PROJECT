package scheduler_test

import (
	"testing"
	"time"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/scheduler"
)

func TestSchedulerRunAllJobs(t *testing.T) {
	adminRepo := repository.NewMemoryAdminRepository()
	surveyRepo := repository.NewMemorySurveyRepository()
	pubRepo := repository.NewMemoryPublicationRepository()
	tripRepo := repository.NewMemoryTripRepository()
	rkaRepo := repository.NewMemoryRkaRepository()
	rpsRepo := repository.NewMemoryRpsRepository()
	evalRepo := repository.NewMemoryEvaluationRepository()
	complaintRepo := repository.NewMemoryComplaintRepository()

	// Seed an expired survey invitation (> 30 days)
	t31DaysAgo := time.Now().Add(-31 * 24 * time.Hour)
	_, _ = surveyRepo.CreateInvitation(&model.PartnerInvitation{
		ID:          "inv-expired",
		SurveyID:    "srv-1",
		EmailTujuan: "mitra.lama@company.com",
		Status:      "TERKIRIM",
		CreatedAt:   t31DaysAgo,
		ExpiredAt:   &t31DaysAgo,
	})

	// Seed an overdue complaint (> 5 days) for escalation
	t6DaysAgo := time.Now().Add(-6 * 24 * time.Hour).Format("2006-01-02")
	_, _ = complaintRepo.Create(&model.Complaint{
		ID:               "comp-escalate",
		Judul:            "Keluhan Terlambat Ditindaklanjuti",
		IsiAduan:         "Sudah lebih dari 5 hari kerja tanpa respon",
		Kategori:         model.ComplaintCatAkademik,
		Status:           model.ComplaintStatusDiterima,
		TanggalDiterima:  t6DaysAgo,
		TanggalPengaduan: t6DaysAgo,
	})

	// Seed a resolved complaint (> 14 days) for auto-close
	t15DaysAgo := time.Now().Add(-15 * 24 * time.Hour).Format("2006-01-02")
	_, _ = complaintRepo.Create(&model.Complaint{
		ID:                  "comp-autoclose",
		Judul:               "Keluhan Terselesaikan",
		IsiAduan:            "Solusi sudah diberikan 15 hari lalu",
		Kategori:            model.ComplaintCatFasilitas,
		Status:              model.ComplaintStatusSelesai,
		TanggalSelesai:      t15DaysAgo,
		TanggalPenyelesaian: &t15DaysAgo,
	})

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

	// Run all jobs
	results := sched.RunAllJobs()

	if results["expire_invitations"] < 1 {
		t.Errorf("expected at least 1 expired invitation, got %d", results["expire_invitations"])
	}
	if results["escalate_complaints"] < 1 {
		t.Errorf("expected at least 1 escalated complaint, got %d", results["escalate_complaints"])
	}
	if results["autoclose_complaints"] < 1 {
		t.Errorf("expected at least 1 auto-closed complaint, got %d", results["autoclose_complaints"])
	}

	// Verify state in repository
	comp, err := complaintRepo.FindByID("comp-autoclose")
	if err != nil || comp.Status != model.ComplaintStatusDitutup {
		t.Errorf("expected complaint to be auto-closed (DITUTUP), got %v", comp.Status)
	}
}

