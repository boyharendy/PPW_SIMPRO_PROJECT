package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestComplaintUsecase(t *testing.T) {
	repo := repository.NewMemoryComplaintRepository()
	uc := usecase.NewComplaintUsecase(repo)

	// 1. Submit public sensitive complaint
	created, err := uc.CreatePublicComplaint(&model.PublicComplaintRequest{
		Kategori:   model.ComplaintCatPerundunganKekerasan,
		Judul:      "Laporan Sensitif Mahasiswa",
		IsiAduan:   "Rincian kejadian yang sangat rahasia",
		IsSensitif: true,
	})
	if err != nil {
		t.Fatalf("CreatePublicComplaint failed: %v", err)
	}
	if created.KodeTiket == "" {
		t.Errorf("expected generated ticket code")
	}

	// 2. Public tracking by ticket
	tracked, err := uc.GetPublicComplaint(created.KodeTiket)
	if err != nil || tracked.Judul != created.Judul {
		t.Fatalf("GetPublicComplaint failed: %v", err)
	}

	// 3. Sensitive Masking: Kaprodi viewing sensitive complaint
	kaprodiView, err := uc.GetComplaintByID(created.ID, model.RoleKaprodi)
	if err != nil {
		t.Fatalf("GetComplaintByID failed: %v", err)
	}
	if kaprodiView.IsiAduan != "[KONTEN DIRAHASIAKAN / KHUSUS SATGAS & PETUGAS KEKERASAN]" {
		t.Errorf("expected masked content for Kaprodi on sensitive complaints, got %s", kaprodiView.IsiAduan)
	}

	// 4. Petugas Kekerasan can see full details
	petugasView, err := uc.GetComplaintByID(created.ID, model.RolePetugasKekerasan)
	if err != nil {
		t.Fatalf("GetComplaintByID for petugas failed: %v", err)
	}
	if petugasView.IsiAduan != "Rincian kejadian yang sangat rahasia" {
		t.Errorf("expected full content for Petugas Kekerasan, got %s", petugasView.IsiAduan)
	}

	// 5. Update status
	err = uc.UpdateComplaintStatus(created.ID, model.ComplaintStatusDitindaklanjuti, "petugas-001")
	if err != nil {
		t.Fatalf("UpdateComplaintStatus failed: %v", err)
	}

	// 6. Recap
	recap, err := uc.GetRecap()
	if err != nil || recap.TotalSensitif != 1 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
