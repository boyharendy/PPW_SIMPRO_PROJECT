package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestRkaUsecase(t *testing.T) {
	repo := repository.NewMemoryRkaRepository()
	uc := usecase.NewRkaUsecase(repo)

	// 1. Create RKA
	doc := &model.RkaDocument{
		TahunAnggaran: "2026",
		PaguTotal:     50000000,
		BudgetItems: []*model.RkaBudgetItem{
			{KodeMataAnggaran: "5.1", NamaKegiatan: "Akreditasi", Kategori: "Mutu", AnggaranAlokasi: 50000000},
		},
	}
	created, err := uc.CreateRka(doc)
	if err != nil {
		t.Fatalf("CreateRka failed: %v", err)
	}

	// 2. Add realization
	item := created.BudgetItems[0]
	err = uc.AddRealization("2026", &model.RkaRealization{
		BudgetItemId:    item.ID,
		Uraian:           "Konsumsi Asesor",
		Nominal:          10000000,
		TanggalRealisasi: "2026-05-01",
	})
	if err != nil {
		t.Fatalf("AddRealization failed: %v", err)
	}

	// 3. Get Serapan
	serapan, err := uc.GetSerapan("2026")
	if err != nil || serapan.TotalTerpakai != 10000000 || serapan.PersentaseSerapan != 20.0 {
		t.Fatalf("GetSerapan failed: %v", err)
	}
}
