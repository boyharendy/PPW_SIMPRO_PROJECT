package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestSurveyUsecase(t *testing.T) {
	repo := repository.NewMemorySurveyRepository()
	uc := usecase.NewSurveyUsecase(repo)

	// Create Survey
	s := &model.PartnerSurvey{
		Judul:         "Survei KP 2024",
		Program:       model.ProgramKerjaPraktik,
		TahunAkademik: "2024/2025",
		Questions: []*model.SurveyQuestion{
			{Aspek: "Teknis", Pertanyaan: "Kemampuan koding", Urutan: 1, SkalaMin: 1, SkalaMax: 5},
		},
	}
	created, err := uc.CreateSurvey(s)
	if err != nil {
		t.Fatalf("CreateSurvey failed: %v", err)
	}

	// Create Invitation
	inv, err := uc.CreateInvitation(&model.PartnerInvitation{
		SurveyID:       created.ID,
		PartnerID:      "p1",
		NamaPembimbing: "Pak Pembimbing",
		EmailTujuan:    "mitra@telkom.co.id",
	})
	if err != nil {
		t.Fatalf("CreateInvitation failed: %v", err)
	}
	if inv.Token == "" {
		t.Fatalf("expected auto-generated token")
	}

	// Get Public Survey by Token
	survey, invitation, err := uc.GetPublicSurvey(inv.Token)
	if err != nil || survey.Judul != "Survei KP 2024" || invitation.EmailTujuan != "mitra@telkom.co.id" {
		t.Fatalf("GetPublicSurvey failed: %v", err)
	}

	// Submit response
	err = uc.SubmitPublicResponse(&model.PartnerResponseSubmission{
		InvitationToken: inv.Token,
		NamaPengisi:     "Pak Pembimbing",
		Answers: []*model.PartnerResponseAnswer{
			{QuestionID: survey.Questions[0].ID, Nilai: 5},
		},
	})
	if err != nil {
		t.Fatalf("SubmitPublicResponse failed: %v", err)
	}

	// Double submit should fail
	err = uc.SubmitPublicResponse(&model.PartnerResponseSubmission{
		InvitationToken: inv.Token,
		NamaPengisi:     "Pak Pembimbing",
	})
	if err == nil {
		t.Errorf("expected error on double submission, got nil")
	}

	// Recap
	recap, err := uc.GetRecap(created.ID)
	if err != nil || recap.TotalResponden != 1 || recap.SkorRataRata != 5.0 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
