package repository_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

func TestMemoryPublicationRepository(t *testing.T) {
	repo := repository.NewMemoryPublicationRepository()

	// 1. Create publication
	pub := &model.Publication{
		Judul:                "Machine Learning in Academic Advising",
		Tipe:                 model.PubJurnalInternasional,
		NamaJurnalKonferensi: "IEEE Access",
		TahunTerbit:          2024,
		DOI:                  "10.1109/ACCESS.2024.123456",
		CreatedBy:            "user-1",
		Authors: []*model.PublicationAuthor{
			{NamaPenulis: "Dr. Hendra Wijaya", Afiliasi: "Institut Teknologi Del", Urutan: 1, IsCorresponding: true},
		},
	}
	created, err := repo.Create(pub)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if created.Status != model.PubStatusDraf {
		t.Errorf("expected DRAF status, got %s", created.Status)
	}

	// 2. FindAll
	pubs, total, err := repo.FindAll("", "", 0, 10, 0)
	if err != nil || total != 1 || len(pubs) != 1 {
		t.Fatalf("FindAll failed: %v", err)
	}

	// 3. Update Status
	err = repo.UpdateStatus(created.ID, model.PubStatusDiterima)
	if err != nil {
		t.Fatalf("UpdateStatus failed: %v", err)
	}

	// 4. Add Review (FR-31)
	err = repo.AddReview(&model.PublicationReview{
		PublicationID: created.ID,
		ReviewerID:    "dosen-rev-01",
		Catatan:       "Format penulisan dan sitasi sangat rapi",
		Rekomendasi:   "LAYAK_DIAJUKAN",
	})
	if err != nil {
		t.Fatalf("AddReview failed: %v", err)
	}

	// 5. Verify publication record
	err = repo.VerifyPublicationRecord(created.ID, "dosen-verif-01", "TERVERIFIKASI", "Bukti valid")
	if err != nil {
		t.Fatalf("VerifyPublicationRecord failed: %v", err)
	}

	// 6. FindByID (status remains DITERIMA while status_verifikasi is TERVERIFIKASI)
	found, err := repo.FindByID(created.ID)
	if err != nil || found.Status != model.PubStatusDiterima || found.StatusVerifikasi != "TERVERIFIKASI" || len(found.Reviews) != 1 {
		t.Fatalf("FindByID check failed: %v", err)
	}

	// 7. Unverified student pub must be excluded from Recap
	unverifiedPub, err := repo.Create(&model.Publication{
		Judul:        "Draft Mahasiswa Belum Verifikasi",
		Tipe:         model.PubJurnal,
		TipePencatat: "MAHASISWA",
		TahunTerbit:  2025,
		CreatedBy:    "mhs-1",
	})
	if err != nil {
		t.Fatalf("Create student pub failed: %v", err)
	}
	if unverifiedPub.StatusVerifikasi != "MENUNGGU" {
		t.Errorf("expected MENUNGGU status_verifikasi, got %s", unverifiedPub.StatusVerifikasi)
	}

	// 8. Recap
	recap, err := repo.GetRecap()
	if err != nil || recap.TotalPublikasi != 1 || recap.Terverifikasi != 1 {
		t.Fatalf("GetRecap failed: got total=%d terverifikasi=%d err=%v", recap.TotalPublikasi, recap.Terverifikasi, err)
	}
}
