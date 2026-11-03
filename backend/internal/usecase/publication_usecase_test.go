package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestPublicationUsecase(t *testing.T) {
	repo := repository.NewMemoryPublicationRepository()
	uc := usecase.NewPublicationUsecase(repo)

	// 1. Create publication
	pub := &model.Publication{
		Judul:       "Deep Learning for NLP in Indonesian",
		Tipe:        model.PubJurnalInternasional,
		TahunTerbit: 2024,
	}
	created, err := uc.CreatePublication("user-1", pub)
	if err != nil {
		t.Fatalf("CreatePublication failed: %v", err)
	}
	if created.Status != model.PubStatusDraft {
		t.Errorf("expected DRAFT, got %s", created.Status)
	}

	// 2. Submit for verification
	err = uc.SubmitPublication(created.ID)
	if err != nil {
		t.Fatalf("SubmitPublication failed: %v", err)
	}
	found, _ := uc.GetPublicationByID(created.ID)
	if found.Status != model.PubStatusMenungguVerifikasi {
		t.Errorf("expected MENUNGGU_VERIFIKASI, got %s", found.Status)
	}

	// 3. Verify publication
	err = uc.VerifyPublication(created.ID, model.PubStatusTerverifikasi, "gkm-1", "Sesuai standar")
	if err != nil {
		t.Fatalf("VerifyPublication failed: %v", err)
	}
	found, _ = uc.GetPublicationByID(created.ID)
	if found.Status != model.PubStatusTerverifikasi {
		t.Errorf("expected TERVERIFIKASI, got %s", found.Status)
	}

	// 4. Recap
	recap, err := uc.GetRecap()
	if err != nil || recap.Terverifikasi != 1 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
