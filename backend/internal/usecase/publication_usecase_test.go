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

	// 1. Create student publication (status starts DRAF, status_verifikasi MENUNGGU)
	pub := &model.Publication{
		Judul:        "Deep Learning for NLP in Indonesian",
		Tipe:         model.PubJurnalInternasional,
		TipePencatat: "MAHASISWA",
		TahunTerbit:  2024,
	}
	created, err := uc.CreatePublication("mhs-b", pub)
	if err != nil {
		t.Fatalf("CreatePublication failed: %v", err)
	}
	if created.Status != model.PubStatusDraf {
		t.Errorf("expected DRAF, got %s", created.Status)
	}
	if created.StatusVerifikasi != "MENUNGGU" {
		t.Errorf("expected MENUNGGU status_verifikasi, got %s", created.StatusVerifikasi)
	}

	// Unverified student publication must not appear in Recap yet
	recapBefore, err := uc.GetRecap()
	if err != nil || recapBefore.TotalPublikasi != 0 {
		t.Fatalf("expected 0 publications in recap before verification, got %d (err: %v)", recapBefore.TotalPublikasi, err)
	}

	// 2. Validate Authors Percentage (Must sum to exactly 100%)
	invalidAuthors := []*model.PublicationAuthor{
		{NamaPenulis: "Dosen A", UserID: "dosen-a", TipePenulis: "DOSEN", Peran: "PEMBIMBING", PersentaseKontribusi: 60.0, Urutan: 1},
		{NamaPenulis: "Mahasiswa B", UserID: "mhs-b", TipePenulis: "MAHASISWA", Peran: "PENULIS_UTAMA", PersentaseKontribusi: 30.0, Urutan: 2},
	}
	err = uc.UpdateAuthors(created.ID, invalidAuthors)
	if err == nil {
		t.Errorf("expected error when author contribution total is not 100%%")
	}

	validAuthors := []*model.PublicationAuthor{
		{NamaPenulis: "Dosen A", UserID: "dosen-a", TipePenulis: "DOSEN", Peran: "PEMBIMBING", PersentaseKontribusi: 60.0, Urutan: 1},
		{NamaPenulis: "Mahasiswa B", UserID: "mhs-b", TipePenulis: "MAHASISWA", Peran: "PENULIS_UTAMA", PersentaseKontribusi: 40.0, Urutan: 2},
	}
	err = uc.UpdateAuthors(created.ID, validAuthors)
	if err != nil {
		t.Fatalf("UpdateAuthors failed for 100%% total: %v", err)
	}

	// 3. Assign Verifier (FR-31: Dosen pembimbing/pendamping allowed, Mahasiswa rejected)
	err = uc.AssignVerifier(created.ID, "mhs-b")
	if err == nil {
		t.Errorf("expected error when assigning student author as verifier")
	}

	err = uc.AssignVerifier(created.ID, "dosen-a")
	if err != nil {
		t.Fatalf("AssignVerifier failed for supervising lecturer: %v", err)
	}

	// 4. FR-31 Internal Review (Reviewer cannot be an author)
	err = uc.AssignReviewer(created.ID, "mhs-b", &model.PublicationReview{
		ReviewerID: "dosen-a",
	})
	if err == nil {
		t.Errorf("expected error when assigning author as internal reviewer")
	}

	review := &model.PublicationReview{
		ID:            "rev-1",
		ReviewerID:    "dosen-reviewer",
		ReviewerNama:  "Dr. Reviewer Internal",
		TenggatReview: "2025-11-30",
	}
	err = uc.AssignReviewer(created.ID, "mhs-b", review)
	if err != nil {
		t.Fatalf("AssignReviewer failed: %v", err)
	}
	found, _ := uc.GetPublicationByID(created.ID)
	if found.Status != model.PubStatusReviewInternal {
		t.Errorf("expected REVIEW_INTERNAL after assigning reviewer, got %s", found.Status)
	}

	err = uc.CompleteReview("rev-1", "LAYAK_DIAJUKAN", "Naskah siap diajukan ke jurnal target")
	if err != nil {
		t.Fatalf("CompleteReview failed: %v", err)
	}

	// 5. Publisher updates publication status (non-publisher / Kaprodi rejected)
	_, err = uc.UpdatePublicationStatus(created.ID, "kaprodi-1", model.PubStatusDiajukan, "Coba ubah", "")
	if err == nil {
		t.Errorf("expected error when non-publisher updates publication status")
	}

	err = uc.AddStageLog(created.ID, "kaprodi-1", &model.PublicationStageLog{
		Tahap: model.PubStatusDiajukan,
	})
	if err == nil {
		t.Errorf("expected error when non-publisher adds stage log")
	}

	updated, err := uc.UpdatePublicationStatus(created.ID, "mhs-b", model.PubStatusDiajukan, "Submit naskah ke jurnal", "https://example.com/submit")
	if err != nil || updated.Status != model.PubStatusDiajukan {
		t.Fatalf("UpdatePublicationStatus by publisher failed: %v (status: %v)", err, updated)
	}

	// Student updates progress stage all the way to TERBIT
	_, err = uc.UpdatePublicationStatus(created.ID, "mhs-b", model.PubStatusDalamReview, "Masuk peer review jurnal", "")
	if err != nil {
		t.Fatalf("UpdatePublicationStatus to DALAM_REVIEW failed: %v", err)
	}
	_, err = uc.UpdatePublicationStatus(created.ID, "mhs-b", model.PubStatusDiterima, "LoA diterima", "LoA.pdf")
	if err != nil {
		t.Fatalf("UpdatePublicationStatus to DITERIMA failed: %v", err)
	}
	_, err = uc.UpdatePublicationStatus(created.ID, "mhs-b", model.PubStatusTerbit, "Artikel resmi terbit", "https://doi.org/10.1234/test")
	if err != nil {
		t.Fatalf("UpdatePublicationStatus to TERBIT failed: %v", err)
	}

	// Must still be in verification queue until dosen pembimbing/pendamping verifies it
	queue, err := uc.GetVerificationQueue("dosen-a")
	if err != nil || len(queue) == 0 {
		t.Fatalf("GetVerificationQueue failed: %v", err)
	}

	// 6. Verify student publication by supervising lecturer (FR-31)
	err = uc.VerifyPublication(created.ID, model.PubStatusDitolak, "dosen-a", "")
	if err == nil {
		t.Errorf("expected error when rejecting without notes")
	}

	err = uc.VerifyPublication(created.ID, model.PubStatusTerverifikasi, "dosen-a", "Sesuai dan valid untuk rekap")
	if err != nil {
		t.Fatalf("VerifyPublication failed: %v", err)
	}
	found, _ = uc.GetPublicationByID(created.ID)
	if found.Status != model.PubStatusTerbit {
		t.Errorf("expected stage status TERBIT to remain preserved, got %s", found.Status)
	}
	if found.StatusVerifikasi != "TERVERIFIKASI" {
		t.Errorf("expected status_verifikasi TERVERIFIKASI, got %s", found.StatusVerifikasi)
	}

	// 7. Recap includes verified student publication
	recapAfter, err := uc.GetRecap()
	if err != nil || recapAfter.TotalPublikasi != 1 || recapAfter.Terverifikasi != 1 {
		t.Fatalf("GetRecap failed after verification: %+v (err: %v)", recapAfter, err)
	}

	// 8. Lecturer publication: lecturer directly updates own status without verification gate
	dosenPub, err := uc.CreatePublication("dosen-1", &model.Publication{
		Judul:        "Publikasi Mandiri Dosen",
		Tipe:         model.PubJurnal,
		TipePencatat: "DOSEN",
		TahunTerbit:  2025,
	})
	if err != nil {
		t.Fatalf("CreatePublication for dosen failed: %v", err)
	}
	if dosenPub.StatusVerifikasi != "TIDAK_PERLU" {
		t.Errorf("expected TIDAK_PERLU for dosen publication, got %s", dosenPub.StatusVerifikasi)
	}
	dosenUpdated, err := uc.UpdatePublicationStatus(dosenPub.ID, "dosen-1", model.PubStatusDalamReview, "Sedang direview penerbit", "")
	if err != nil || dosenUpdated.Status != model.PubStatusDalamReview {
		t.Fatalf("Dosen failed to update own publication status: %v", err)
	}
}
