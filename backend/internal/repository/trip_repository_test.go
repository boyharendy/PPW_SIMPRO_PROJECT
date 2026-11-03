package repository_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

func TestMemoryTripRepository(t *testing.T) {
	repo := repository.NewMemoryTripRepository()

	// 1. Create trip
	trip := &model.TravelOrder{
		NomorSuratTugas:    "ST/2024/09/001",
		Tujuan:             "Jakarta",
		Keperluan:          "Konferensi Nasional Pendidikan Tinggi",
		TanggalBerangkat:   "2024-10-10",
		TanggalKembali:     "2024-10-12",
		TotalEstimasiBiaya: 5000000,
		DiajukanOleh:       "dosen-01",
		Members: []*model.TravelMember{
			{UserID: "dosen-01", PeranTugas: "Pemakalah Utama"},
		},
		Costs: []*model.TravelCost{
			{Komponen: "Tiket Pesawat", NominalEstimasi: 3000000},
			{Komponen: "Akomodasi Hotel", NominalEstimasi: 2000000},
		},
	}
	created, err := repo.Create(trip)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if created.Status != model.TripStatusDraft {
		t.Errorf("expected DRAFT status, got %s", created.Status)
	}

	// 2. FindAll
	trips, total, err := repo.FindAll("", "", 10, 0)
	if err != nil || total != 1 || len(trips) != 1 {
		t.Fatalf("FindAll failed: %v", err)
	}

	// 3. Update Status (Kaprodi approval)
	err = repo.UpdateStatus(created.ID, model.TripStatusDisetujuiKaprodi, "kaprodi-01")
	if err != nil {
		t.Fatalf("UpdateStatus failed: %v", err)
	}

	// 4. Submit Report & Realization
	err = repo.SubmitReport(&model.TravelReport{
		TravelOrderID:  created.ID,
		RingkasanHasil: "Mempresentasikan paper dan menjalin kerja sama riset",
		VerifiedBy:     "kaprodi-01",
	}, 4850000)
	if err != nil {
		t.Fatalf("SubmitReport failed: %v", err)
	}

	// 5. FindByID
	found, err := repo.FindByID(created.ID)
	if err != nil || found.Report == nil || found.TotalRealisasiBiaya != 4850000 {
		t.Fatalf("FindByID check failed: %v", err)
	}

	// 6. Recap
	recap, err := repo.GetRecap()
	if err != nil || recap.TotalPerjalanan != 1 || recap.TotalRealisasiBiaya != 4850000 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
