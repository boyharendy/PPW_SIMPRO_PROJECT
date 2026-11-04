package repository_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

func TestMemoryRkaRepository(t *testing.T) {
	repo := repository.NewMemoryRkaRepository()

	// 1. Create RKA document with budget item
	doc := &model.RkaDocument{
		TahunAnggaran: "2025",
		PaguTotal:     100000000,
		Status:        model.BudgetStatusDraft,
		BudgetItems: []*model.RkaBudgetItem{
			{KodeMataAnggaran: "5.2.1.01", NamaKegiatan: "Seminar Nasional", Kategori: "Akademik", AnggaranAlokasi: 40000000},
			{KodeMataAnggaran: "5.2.1.02", NamaKegiatan: "Pengadaan Lisensi Software", Kategori: "Fasilitas", AnggaranAlokasi: 60000000},
		},
	}
	_, err := repo.Create(doc)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// 2. FindByYear
	found, err := repo.FindByYear("2025")
	if err != nil || len(found.BudgetItems) != 2 {
		t.Fatalf("FindByYear failed: %v", err)
	}

	// 3. Add Realization
	item := found.BudgetItems[0]
	err = repo.AddRealization(&model.RkaRealization{
		BudgetItemId:    item.ID,
		Uraian:           "Pembayaran narasumber dan konsumsi",
		Nominal:          15000000,
		TanggalRealisasi: "2025-03-15",
	})
	if err != nil {
		t.Fatalf("AddRealization failed: %v", err)
	}

	// 4. Verify Serapan
	serapan, err := repo.GetSerapan("2025")
	if err != nil {
		t.Fatalf("GetSerapan failed: %v", err)
	}
	if serapan.TotalTerpakai != 15000000 || serapan.PersentaseSerapan != 15.0 {
		t.Errorf("expected 15000000 and 15%%, got %f and %f%%", serapan.TotalTerpakai, serapan.PersentaseSerapan)
	}
}
