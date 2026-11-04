package repository_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

func TestMemorySurveyRepository(t *testing.T) {
	repo := repository.NewMemorySurveyRepository()

	// 1. Create survey
	s := &model.PartnerSurvey{
		Judul:         "Survei Kepuasan KP 2024",
		Program:       model.ProgramKerjaPraktik,
		TahunAkademik: "2024/2025",
		IsActive:      true,
		Questions: []*model.SurveyQuestion{
			{Aspek: "Integritas & Etika", Pertanyaan: "Kedisiplinan mahasiswa di tempat kerja", Urutan: 1, SkalaMin: 1, SkalaMax: 5},
			{Aspek: "Keahlian Teknis", Pertanyaan: "Kemampuan menyelesaikan tugas pemrograman", Urutan: 2, SkalaMin: 1, SkalaMax: 5},
		},
	}
	created, err := repo.CreateSurvey(s)
	if err != nil {
		t.Fatalf("CreateSurvey failed: %v", err)
	}
	if created.ID == "" {
		t.Errorf("expected non-empty ID")
	}

	// 2. FindSurveys
	surveys, err := repo.FindSurveys()
	if err != nil || len(surveys) == 0 {
		t.Fatalf("FindSurveys failed: %v", err)
	}

	// 3. FindSurveyByID
	found, err := repo.FindSurveyByID(created.ID)
	if err != nil || found.Judul != "Survei Kepuasan KP 2024" {
		t.Fatalf("FindSurveyByID failed: %v", err)
	}
	if len(found.Questions) != 2 {
		t.Errorf("expected 2 questions, got %d", len(found.Questions))
	}

	// 4. Create Invitation & verify by token
	inv := &model.PartnerInvitation{
		SurveyID:       created.ID,
		PartnerID:      "p0000000-0000-0000-0000-000000000001",
		NamaPembimbing: "Pak Pembimbing",
		EmailTujuan:    "mitra@telkom.co.id",
		Token:          "token-kp-12345",
	}
	_, err = repo.CreateInvitation(inv)
	if err != nil {
		t.Fatalf("CreateInvitation failed: %v", err)
	}

	invFound, err := repo.FindInvitationByToken("token-kp-12345")
	if err != nil || invFound.EmailTujuan != "mitra@telkom.co.id" {
		t.Fatalf("FindInvitationByToken failed: %v", err)
	}

	// 5. Submit response
	err = repo.SubmitResponse(&model.PartnerResponseSubmission{
		InvitationToken: "token-kp-12345",
		NamaPengisi:     "Pak Pembimbing",
		SaranMasukan:    "Mahasiswa sangat kompeten",
		Answers: []*model.PartnerResponseAnswer{
			{QuestionID: found.Questions[0].ID, Nilai: 5},
			{QuestionID: found.Questions[1].ID, Nilai: 4},
		},
	})
	if err != nil {
		t.Fatalf("SubmitResponse failed: %v", err)
	}

	// 6. GetRecap
	recap, err := repo.GetRecap(created.ID)
	if err != nil {
		t.Fatalf("GetRecap failed: %v", err)
	}
	if recap.TotalResponden != 1 {
		t.Errorf("expected 1 respondent, got %d", recap.TotalResponden)
	}
	if recap.SkorRataRata != 4.5 {
		t.Errorf("expected avg score 4.5, got %f", recap.SkorRataRata)
	}
}
