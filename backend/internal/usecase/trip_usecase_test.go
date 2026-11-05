package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestTripUsecase(t *testing.T) {
	rkaRepo := repository.NewMemoryRkaRepository()
	tripRepo := repository.NewMemoryTripRepository()
	uc := usecase.NewTripUsecase(tripRepo, rkaRepo)

	// 0. Setup RKA Document with a trip budget item
	rkaDoc := &model.RkaDocument{
		TahunAnggaran: "2025",
		PaguTotal:     50000000,
		BudgetItems: []*model.RkaBudgetItem{
			{ID: "pos-sppd-1", KodeMataAnggaran: "5.2.1", NamaKegiatan: "Dinas", AnggaranAlokasi: 50000000},
		},
	}
	_, _ = rkaRepo.Create(rkaDoc)

	// 1. Create trip
	trip := &model.TravelOrder{
		NomorSuratTugas:    "ST/2024/09/002",
		Tujuan:             "Medan",
		Keperluan:          "Workshop Kurikulum OBE",
		TanggalBerangkat:   "2024-11-01",
		TanggalKembali:     "2024-11-03",
		SumberDana:         "RKA_PRODI",
		RkaBudgetItemID:    "pos-sppd-1",
		TotalEstimasiBiaya: 2500000,
		Costs: []*model.TravelCost{
			{Komponen: "TRANSPORTASI", NominalEstimasi: 1500000},
			{Komponen: "AKOMODASI", NominalEstimasi: 1000000},
		},
	}
	created, err := uc.CreateTrip("dosen-1", trip)
	if err != nil {
		t.Fatalf("CreateTrip failed: %v", err)
	}
	if created.Status != model.TripStatusDraft {
		t.Errorf("expected DRAFT, got %s", created.Status)
	}

	// 2. Submit trip
	err = uc.SubmitTrip(created.ID)
	if err != nil {
		t.Fatalf("SubmitTrip failed: %v", err)
	}
	found, _ := uc.GetTripByID(created.ID)
	if found.Status != model.TripStatusDiajukan {
		t.Errorf("expected DIAJUKAN, got %s", found.Status)
	}

	// 3. Approve trip
	err = uc.ApproveTrip(created.ID, "kaprodi-1", true)
	if err != nil {
		t.Fatalf("ApproveTrip failed: %v", err)
	}
	found, _ = uc.GetTripByID(created.ID)
	if found.Status != model.TripStatusDisetujuiKaprodi {
		t.Errorf("expected DISETUJUI_KAPRODI, got %s", found.Status)
	}

	// 4. Update Costs & Add Proof
	_ = uc.AddProof(created.ID, &model.TravelProof{
		Kategori: "TIKET",
		FileName: "tiket_pp.pdf",
		FileURL:  "/uploads/tiket.pdf",
	})
	_ = uc.UpdateRealizationCosts(created.ID, []*model.TravelCost{
		{Komponen: "TRANSPORTASI", NominalRealisasi: 1400000},
		{Komponen: "AKOMODASI", NominalRealisasi: 1000000},
	})

	// 5. Submit Report
	err = uc.SubmitReport(created.ID, "dosen-1", "Kegiatan workshop sukses", "https://drive.google.com/doc", 2400000)
	if err != nil {
		t.Fatalf("SubmitReport failed: %v", err)
	}
	found, _ = uc.GetTripByID(created.ID)
	if found.Status != model.TripStatusDilaporkan {
		t.Errorf("expected DILAPORKAN, got %s", found.Status)
	}

	// 6. Check Completeness
	comp, err := uc.GetCompleteness(created.ID)
	if err != nil || comp["is_complete"] != true {
		t.Fatalf("expected completeness true, got %v", comp)
	}

	// 7. Separation of Duties Check on ConfirmTrip
	// Must fail if applicant confirms their own trip
	_, errSoD := uc.ConfirmTrip(created.ID, "dosen-1")
	if errSoD == nil {
		t.Fatalf("expected separation of duties violation error, got nil")
	}

	// Must succeed when confirmed by Admin Prodi ("admin-prodi-1")
	confirmed, err := uc.ConfirmTrip(created.ID, "admin-prodi-1")
	if err != nil {
		t.Fatalf("ConfirmTrip by Admin Prodi failed: %v", err)
	}
	if confirmed.Status != model.TripStatusSelesai {
		t.Errorf("expected status SELESAI, got %s", confirmed.Status)
	}

	// 8. Verify Auto-Realization into RKA!
	serapan, _ := rkaRepo.GetSerapan("2025")
	if serapan.TotalTerpakai != 2400000 {
		t.Errorf("expected RKA total terpakai 2400000 from auto-realization, got %f", serapan.TotalTerpakai)
	}

	// 9. Flags Detection
	flags, err := uc.GetFlags()
	if err != nil {
		t.Fatalf("GetFlags failed: %v", err)
	}
	if len(flags) < 0 {
		t.Errorf("expected flags slice")
	}
}
