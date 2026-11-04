package repository_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

func TestMemoryEvaluationRepository(t *testing.T) {
	repo := repository.NewMemoryEvaluationRepository()

	// 1. Save evaluation
	eval := &model.CourseEvaluation{
		CourseClassID:       "cc000000-0000-0000-0000-000000000001",
		IndeksKepuasanMhs:   4.25,
		PersentaseKelulusan: 92.5,
		Kendala:             "Pemahaman topik asinkronus memerlukan waktu lebih",
		Solusi:              "Menambahkan sesi tutorial praktikum",
		IsSubmitted:         true,
		CPMKList: []*model.CpmkEvaluation{
			{KodeCPMK: "CPMK-1", Deskripsi: "Mampu merancang UI/UX", TargetKetercapaian: 80, RealisasiKetercapaian: 85},
			{KodeCPMK: "CPMK-2", Deskripsi: "Mampu membangun REST API", TargetKetercapaian: 75, RealisasiKetercapaian: 78},
		},
	}
	_, err := repo.Save(eval)
	if err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	// 2. FindByClassID
	found, err := repo.FindByClassID("cc000000-0000-0000-0000-000000000001")
	if err != nil || len(found.CPMKList) != 2 || found.IndeksKepuasanMhs != 4.25 {
		t.Fatalf("FindByClassID failed: %v", err)
	}

	// 3. Recap
	recap, err := repo.GetRecap()
	if err != nil || recap.TotalEvaluasi != 1 || recap.RataRataKepuasan != 4.25 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
