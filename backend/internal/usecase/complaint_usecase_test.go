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

	// 1. Issue Permit (FR-48)
	token, exp, err := uc.IssuePermit("mhs-12345")
	if err != nil {
		t.Fatalf("IssuePermit failed: %v", err)
	}
	if token == "" || exp.IsZero() {
		t.Fatalf("expected non-empty permit token and expiration")
	}

	// 2. Submit public sensitive complaint with valid permit
	created, err := uc.CreatePublicComplaint(&model.PublicComplaintRequest{
		PermitToken: token,
		Kategori:    model.ComplaintCatPerundunganKekerasan,
		Judul:       "Laporan Sensitif Mahasiswa",
		IsiAduan:    "Rincian kejadian yang sangat rahasia",
		IsSensitif:  true,
	})
	if err != nil {
		t.Fatalf("CreatePublicComplaint failed: %v", err)
	}
	if created.KodeTiket == "" {
		t.Errorf("expected generated ticket code")
	}

	// 3. Replay token should fail
	_, err = uc.CreatePublicComplaint(&model.PublicComplaintRequest{
		PermitToken: token,
		Kategori:    model.ComplaintCatAkademik,
		Judul:       "Laporan Kedua",
		IsiAduan:    "Percobaan pemakaian permit yang sama",
	})
	if err == nil {
		t.Errorf("expected error when reusing permit token")
	}

	// 4. Public tracking by ticket
	tracked, err := uc.GetPublicComplaint(created.KodeTiket)
	if err != nil || tracked.Judul != created.Judul {
		t.Fatalf("GetPublicComplaint failed: %v", err)
	}

	// 5. Sensitive Masking: Kaprodi (without violence handler flag) viewing sensitive complaint
	kaprodiView, err := uc.GetComplaintByID(created.ID, model.RoleKaprodi, false)
	if err != nil {
		t.Fatalf("GetComplaintByID failed: %v", err)
	}
	if kaprodiView.IsiAduan != "[KONTEN DIRAHASIAKAN / KHUSUS SATGAS & PETUGAS KEKERASAN]" {
		t.Errorf("expected masked content for Kaprodi on sensitive complaints, got %s", kaprodiView.IsiAduan)
	}

	// 6. Petugas Kekerasan (PGL-K) can see full details
	petugasView, err := uc.GetComplaintByID(created.ID, model.RolePengelolaAduan, true)
	if err != nil {
		t.Fatalf("GetComplaintByID for petugas failed: %v", err)
	}
	if petugasView.IsiAduan != "Rincian kejadian yang sangat rahasia" {
		t.Errorf("expected full content for Petugas Kekerasan, got %s", petugasView.IsiAduan)
	}

	// 7. Verify Complaint
	err = uc.VerifyComplaint(created.ID, "petugas-001")
	if err != nil {
		t.Fatalf("VerifyComplaint failed: %v", err)
	}
	vCheck, _ := uc.GetComplaintByID(created.ID, model.RolePengelolaAduan, true)
	if vCheck.Status != model.ComplaintStatusDiverifikasi {
		t.Errorf("expected status DIVERIFIKASI, got %s", vCheck.Status)
	}

	// 8. Resolve Complaint
	err = uc.ResolveComplaint(created.ID, "petugas-001", "Telah didampingi dan dilakukan mediasi resmi")
	if err != nil {
		t.Fatalf("ResolveComplaint failed: %v", err)
	}
	rCheck, _ := uc.GetComplaintByID(created.ID, model.RolePengelolaAduan, true)
	if rCheck.Status != model.ComplaintStatusSelesai {
		t.Errorf("expected status SELESAI, got %s", rCheck.Status)
	}

	// 9. Close Complaint
	err = uc.CloseComplaint(created.ID, "petugas-001", "Pelapor telah menerima hasil dan menandatangani berita acara")
	if err != nil {
		t.Fatalf("CloseComplaint failed: %v", err)
	}
	cCheck, _ := uc.GetComplaintByID(created.ID, model.RolePengelolaAduan, true)
	if cCheck.Status != model.ComplaintStatusDitutup {
		t.Errorf("expected status DITUTUP, got %s", cCheck.Status)
	}

	// 10. Escalation metadata view
	escalations, err := uc.GetEscalations()
	if err != nil || len(escalations) == 0 {
		t.Fatalf("GetEscalations failed: %v", err)
	}
	if escalations[0].ID != created.ID {
		t.Errorf("expected escalation record to match created ID")
	}

	// 11. Recap
	recap, err := uc.GetRecap()
	if err != nil || recap.TotalSensitif != 1 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
