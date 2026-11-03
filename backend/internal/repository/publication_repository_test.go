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
	if created.Status != model.PubStatusDraft {
		t.Errorf("expected DRAFT status, got %s", created.Status)
	}

	// 2. FindAll
	pubs, total, err := repo.FindAll("", "", 0, 10, 0)
	if err != nil || total != 1 || len(pubs) != 1 {
		t.Fatalf("FindAll failed: %v", err)
	}

	// 3. Update Status
	err = repo.UpdateStatus(created.ID, model.PubStatusTerverifikasi)
	if err != nil {
		t.Fatalf("UpdateStatus failed: %v", err)
	}

	// 4. Add Review
	err = repo.AddReview(&model.PublicationReview{
		PublicationID: created.ID,
		ReviewerID:    "gkm-01",
		Catatan:       "Format penulisan dan sitasi sangat rapi",
		Rekomendasi:   "DITERIMA",
	})
	if err != nil {
		t.Fatalf("AddReview failed: %v", err)
	}

	// 5. FindByID
	found, err := repo.FindByID(created.ID)
	if err != nil || found.Status != model.PubStatusTerverifikasi || len(found.Reviews) != 1 {
		t.Fatalf("FindByID check failed: %v", err)
	}

	// 6. Recap
	recap, err := repo.GetRecap()
	if err != nil || recap.TotalPublikasi != 1 || recap.Terverifikasi != 1 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
