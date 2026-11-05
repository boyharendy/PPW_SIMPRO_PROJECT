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

	// 3. Assign Reviewer (bukan pengampu dosen-1)
	err = uc.AssignReviewers(created.ID, []string{"dosen-peer-1", "dosen-peer-2"})
	if err != nil {
		t.Fatalf("AssignReviewers failed: %v", err)
	}
	// Coba assign pengampu (harus error)
	err = uc.AssignReviewers(created.ID, []string{"dosen-1"})
	if err == nil {
		t.Errorf("expected error when assigning course instructor as reviewer")
	}

	// 4. Review 5 Komponen SPMI
	items := []*model.RpsReviewItem{
		{Komponen: model.RpsKomponenCplCpmk, Skor: 4.8, Sesuai: true, Catatan: "Kesesuaian CPL dan CPMK sangat presisi"},
		{Komponen: model.RpsKomponenBahanKajian, Skor: 4.5, Sesuai: true, Catatan: "Bahan kajian terstruktur"},
		{Komponen: model.RpsKomponenMetodePembelajaran, Skor: 4.7, Sesuai: true, Catatan: "Metode SCL PBL"},
		{Komponen: model.RpsKomponenSistemPenilaian, Skor: 4.6, Sesuai: true, Catatan: "Rubrik holistik"},
		{Komponen: model.RpsKomponenKemutakhiranPustaka, Skor: 4.9, Sesuai: true, Catatan: "Pustaka 5 tahun terakhir"},
	}
	err = uc.ReviewSubmissionWithChecklist(created.ID, "dosen-peer-1", "RPS komprehensif", "DISETUJUI", items)
	if err != nil {
		t.Fatalf("ReviewSubmissionWithChecklist failed: %v", err)
	}
	found, _ = uc.GetSubmissionByID(created.ID)
	if found.Status != model.RpsStatusDisetujuiGKM {
		t.Errorf("expected DISETUJUI_GKM, got %s", found.Status)
	}

	// 5. Update Tindak Lanjut Rencana Perbaikan (Improvement Plans)
	plans := []*model.CourseImprovementPlan{
		{
			ID:              "plan-1",
			CourseID:        "c1",
			Rekomendasi:     "Perbanyak studi kasus industri terkini",
			TindakLanjut:    "Menambahkan 2 studi kasus implementasi microservices",
			Status:          "SUDAH_DITERAPKAN",
			StatusPenerapan: "DITERAPKAN",
		},
	}
	err = uc.UpdateImprovementPlans(created.ID, plans)
	if err != nil {
		t.Fatalf("UpdateImprovementPlans failed: %v", err)
	}
	found, _ = uc.GetSubmissionByID(created.ID)
	if len(found.ImprovementPlans) != 1 {
		t.Errorf("expected 1 improvement plan, got %d", len(found.ImprovementPlans))
	}

	// 6. Kaprodi Ratify
	err = uc.RatifySubmission(created.ID)
	if err != nil {
		t.Fatalf("RatifySubmission failed: %v", err)
	}
	found, _ = uc.GetSubmissionByID(created.ID)
	if found.Status != model.RpsStatusDisahkanKaprodi {
		t.Errorf("expected DISAHKAN_KAPRODI, got %s", found.Status)
	}
}
