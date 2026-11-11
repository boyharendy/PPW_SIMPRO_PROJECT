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

	// 4. Milestone 2: Working Version & Optimistic Locking
	ver, err := uc.GetWorkingVersion("2026")
	if err != nil {
		t.Fatalf("GetWorkingVersion failed: %v", err)
	}
	if ver.RowVersion != 1 {
		t.Errorf("expected initial RowVersion 1, got %d", ver.RowVersion)
	}

	// Test conflict on wrong row_version
	_, errConflict := uc.UpdateWorkingVersion("2026", 999, map[string]interface{}{
		"catatan_perubahan": "Revisi sembarang",
	})
	if errConflict == nil {
		t.Fatalf("expected optimistic locking conflict, got nil")
	}

	// Update working version with correct version
	updatedVer, err := uc.UpdateWorkingVersion("2026", 1, map[string]interface{}{
		"catatan_perubahan": "Revisi anggaran bertambah",
		"budget_items": []map[string]interface{}{
			{"kode_mata_anggaran": "5.1", "nama_kegiatan": "Akreditasi", "anggaran_alokasi": 60000000},
		},
	})
	if err != nil {
		t.Fatalf("UpdateWorkingVersion failed: %v", err)
	}
	if updatedVer.RowVersion != 2 {
		t.Errorf("expected RowVersion 2, got %d", updatedVer.RowVersion)
	}

	// 5. Submit Working Version
	if err := uc.SubmitWorkingVersion("2026"); err != nil {
		t.Fatalf("SubmitWorkingVersion failed: %v", err)
	}

	// 6. Get Version Diff
	diff, err := uc.GetVersionDiff("2026", updatedVer.NomorVersi)
	if err != nil {
		t.Fatalf("GetVersionDiff failed: %v", err)
	}
	if diff["total_perubahan"].(int) != 1 {
		t.Errorf("expected 1 changed item in diff, got %v", diff["total_perubahan"])
	}

	// 7. Decide Version (Approval)
	if err := uc.DecideVersion("2026", updatedVer.NomorVersi, true, "kaprodi-1"); err != nil {
		t.Fatalf("DecideVersion failed: %v", err)
	}
	activeDoc, _ := uc.GetRkaByYear("2026")
	if activeDoc.PaguTotal != 60000000 {
		t.Errorf("expected updated PaguTotal 60000000, got %f", activeDoc.PaguTotal)
	}

	// 8. Close RKA
	if err := uc.CloseRka("2026"); err != nil {
		t.Fatalf("CloseRka failed: %v", err)
	}
	closedDoc, _ := uc.GetRkaByYear("2026")
	if closedDoc.Status != model.BudgetStatusDitutup {
		t.Errorf("expected status DITUTUP, got %s", closedDoc.Status)
	}
}
