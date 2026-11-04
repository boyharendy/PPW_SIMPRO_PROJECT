package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestTripUsecase(t *testing.T) {
	repo := repository.NewMemoryTripRepository()
	uc := usecase.NewTripUsecase(repo)

	// 1. Create trip
	trip := &model.TravelOrder{
		NomorSuratTugas:    "ST/2024/09/002",
		Tujuan:             "Medan",
		Keperluan:          "Workshop Kurikulum OBE",
		TanggalBerangkat:   "2024-11-01",
		TanggalKembali:     "2024-11-03",
		TotalEstimasiBiaya: 2500000,
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

	// 4. Submit Report
	err = uc.SubmitReport(created.ID, "dosen-1", "Kegiatan workshop sukses", "https://drive.google.com/doc", 2400000)
	if err != nil {
		t.Fatalf("SubmitReport failed: %v", err)
	}
	found, _ = uc.GetTripByID(created.ID)
	if found.Status != model.TripStatusLaporanTerverifikasi {
		t.Errorf("expected LAPORAN_TERVERIFIKASI, got %s", found.Status)
	}
}
