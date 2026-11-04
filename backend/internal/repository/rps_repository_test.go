package repository_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

func TestMemoryRpsRepository(t *testing.T) {
	repo := repository.NewMemoryRpsRepository()

	// 1. Create RPS submission
	sub := &model.RpsSubmission{
		CourseID:         "c0000000-0000-0000-0000-000000000001",
		AcademicPeriodID: "b0000000-0000-0000-0000-000000000001",
		DosenPenyusunID:  "dosen-01",
		DokumenURL:       "https://simpro.id/rps/if3110.pdf",
		NomorVersi:       1,
	}
	created, err := repo.Create(sub)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// 2. Add Review
	err = repo.AddReview(&model.RpsReview{
		RpsSubmissionID: created.ID,
		ReviewerID:      "gkm-01",
		Komentar:        "CPMK sudah selaras dengan CPL Prodi",
		Rekomendasi:     "DISETUJUI_GKM",
	})
	if err != nil {
		t.Fatalf("AddReview failed: %v", err)
	}

	// 3. Update Status
	err = repo.UpdateStatus(created.ID, model.RpsStatusDisahkanKaprodi)
	if err != nil {
		t.Fatalf("UpdateStatus failed: %v", err)
	}

	// 4. FindByID
	found, err := repo.FindByID(created.ID)
	if err != nil || found.Status != model.RpsStatusDisahkanKaprodi || len(found.Reviews) != 1 {
		t.Fatalf("FindByID failed: %v", err)
	}

	// 5. Recap
	recap, err := repo.GetRecap()
	if err != nil || recap.TotalDisetujui != 1 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
