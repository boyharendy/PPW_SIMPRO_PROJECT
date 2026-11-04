package repository_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

func TestMemoryComplaintRepository(t *testing.T) {
	repo := repository.NewMemoryComplaintRepository()

	// 1. Create complaint
	c := &model.Complaint{
		KodeTiket:  "TKT-2024-001",
		Kategori:   model.ComplaintCatFasilitas,
		Judul:      "AC Laboratorium Komputer 2 Rusak",
		IsiAduan:   "Suhu ruangan panas sehingga komputer sering overheat",
		IsSensitif: false,
	}
	created, err := repo.Create(c)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if created.Status != model.ComplaintStatusDiterima {
		t.Errorf("expected initial status DITERIMA, got %s", created.Status)
	}

	// 2. FindByTicket
	found, err := repo.FindByTicket("TKT-2024-001")
	if err != nil || found.Judul != c.Judul {
		t.Fatalf("FindByTicket failed: %v", err)
	}

	// 3. Add Message
	err = repo.AddMessage(&model.ComplaintMessage{
		ComplaintID: created.ID,
		SenderType:  "PETUGAS",
		Pesan:       "Aduan sedang kami verifikasi",
	})
	if err != nil {
		t.Fatalf("AddMessage failed: %v", err)
	}

	// 4. Update status & add disposition
	err = repo.UpdateStatus(created.ID, model.ComplaintStatusDidisposisikan, "petugas-001")
	if err != nil {
		t.Fatalf("UpdateStatus failed: %v", err)
	}

	err = repo.AddDisposition(&model.ComplaintDisposition{
		ComplaintID:      created.ID,
		DariPetugasID:    "petugas-001",
		KepadaPetugasID:  "teknisi-002",
		CatatanDisposisi: "Mohon segera diperbaiki teknisi AC",
	})
	if err != nil {
		t.Fatalf("AddDisposition failed: %v", err)
	}

	// 5. Verify detail has messages and dispositions
	detail, err := repo.FindByID(created.ID)
	if err != nil {
		t.Fatalf("FindByID failed: %v", err)
	}
	if len(detail.Messages) != 1 {
		t.Errorf("expected 1 message, got %d", len(detail.Messages))
	}
	if len(detail.Dispositions) != 1 {
		t.Errorf("expected 1 disposition, got %d", len(detail.Dispositions))
	}

	// 6. GetRecap
	recap, err := repo.GetRecap()
	if err != nil {
		t.Fatalf("GetRecap failed: %v", err)
	}
	if recap.TotalAduan != 1 {
		t.Errorf("expected total aduan 1, got %d", recap.TotalAduan)
	}
}
