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

	// 2. Validate Authors Percentage (Must sum to exactly 100%)
	invalidAuthors := []*model.PublicationAuthor{
		{NamaPenulis: "Dosen A", UserID: "dosen-a", PersentaseKontribusi: 60.0, Urutan: 1},
		{NamaPenulis: "Mahasiswa B", UserID: "mhs-b", PersentaseKontribusi: 30.0, Urutan: 2}, // Total 90%
	}
	err = uc.UpdateAuthors(created.ID, invalidAuthors)
	if err == nil {
		t.Errorf("expected error when author contribution total is not 100%%")
	}

	validAuthors := []*model.PublicationAuthor{
		{NamaPenulis: "Dosen A", UserID: "dosen-a", PersentaseKontribusi: 60.0, Urutan: 1},
		{NamaPenulis: "Mahasiswa B", UserID: "mhs-b", PersentaseKontribusi: 40.0, Urutan: 2}, // Total 100%
	}
	err = uc.UpdateAuthors(created.ID, validAuthors)
	if err != nil {
		t.Fatalf("UpdateAuthors failed for 100%% total: %v", err)
	}

	// 3. Assign Verifier (Verifier cannot be an author)
	err = uc.AssignVerifier(created.ID, "dosen-a")
	if err == nil {
		t.Errorf("expected error when assigning author as verifier")
	}

	err = uc.AssignVerifier(created.ID, "dosen-independent")
	if err != nil {
		t.Fatalf("AssignVerifier failed for independent verifier: %v", err)
	}

	// 4. Submit for verification
	err = uc.SubmitPublication(created.ID)
	if err != nil {
		t.Fatalf("SubmitPublication failed: %v", err)
	}
	found, _ := uc.GetPublicationByID(created.ID)
	if found.Status != model.PubStatusMenungguVerifikasi {
		t.Errorf("expected MENUNGGU_VERIFIKASI, got %s", found.Status)
	}

	// 5. Verification Queue
	queue, err := uc.GetVerificationQueue("dosen-independent")
	if err != nil || len(queue) == 0 {
		t.Fatalf("GetVerificationQueue failed: %v", err)
	}

	// 6. Stage Logging & Stage Verification
	stageLog := &model.PublicationStageLog{
		ID:           "stage-1",
		Tahap:        model.PubStatusDiterima,
		TanggalTahap: "2024-11-04",
		JenisBukti:   "LOA",
	}
	err = uc.AddStageLog(created.ID, "dosen-a", stageLog)
	if err != nil {
		t.Fatalf("AddStageLog failed: %v", err)
	}

	err = uc.VerifyStage("stage-1", "dosen-independent", "TERVERIFIKASI", "LoA resmi terkonfirmasi dari penerbit jurnal")
	if err != nil {
		t.Fatalf("VerifyStage failed: %v", err)
	}

	// 7. Review Internal Completion
	err = uc.AddReview(created.ID, "dosen-reviewer", "Naskah sangat baik", "LAYAK_DIAJUKAN")
	if err != nil {
		t.Fatalf("AddReview failed: %v", err)
	}

	// 8. Verify publication status
	err = uc.VerifyPublication(created.ID, model.PubStatusTerverifikasi, "gkm-1", "Sesuai standar")
	if err != nil {
		t.Fatalf("VerifyPublication failed: %v", err)
	}
	found, _ = uc.GetPublicationByID(created.ID)
	if found.Status != model.PubStatusTerverifikasi {
		t.Errorf("expected TERVERIFIKASI, got %s", found.Status)
	}

	// 9. Recap
	recap, err := uc.GetRecap()
	if err != nil || recap.Terverifikasi != 1 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
