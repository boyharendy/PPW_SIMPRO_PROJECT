package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestRpsUsecase(t *testing.T) {
	repo := repository.NewMemoryRpsRepository()
	uc := usecase.NewRpsUsecase(repo)

	// 1. Create submission
	sub := &model.RpsSubmission{
		CourseID:         "c1",
		AcademicPeriodID: "p1",
		DokumenURL:       "https://rps.url",
	}
	created, err := uc.CreateSubmission("dosen-1", sub)
	if err != nil {
		t.Fatalf("CreateSubmission failed: %v", err)
	}
	if created.Status != model.RpsStatusDraft {
		t.Errorf("expected DRAFT, got %s", created.Status)
	}

	// 2. Submit for review
	err = uc.SubmitForReview(created.ID)
	if err != nil {
		t.Fatalf("SubmitForReview failed: %v", err)
	}
	found, _ := uc.GetSubmissionByID(created.ID)
	if found.Status != model.RpsStatusDiajukan {
		t.Errorf("expected DIAJUKAN, got %s", found.Status)
	}

	// 3. GKM Review
	err = uc.ReviewSubmission(created.ID, "gkm-1", "Sangat bagus dan lengkap", "DISETUJUI_GKM")
	if err != nil {
		t.Fatalf("ReviewSubmission failed: %v", err)
	}
	found, _ = uc.GetSubmissionByID(created.ID)
	if found.Status != model.RpsStatusDisetujuiGKM {
		t.Errorf("expected DISETUJUI_GKM, got %s", found.Status)
	}

	// 4. Kaprodi Ratify
	err = uc.RatifySubmission(created.ID)
	if err != nil {
		t.Fatalf("RatifySubmission failed: %v", err)
	}
	found, _ = uc.GetSubmissionByID(created.ID)
	if found.Status != model.RpsStatusDisahkanKaprodi {
		t.Errorf("expected DISAHKAN_KAPRODI, got %s", found.Status)
	}
}
