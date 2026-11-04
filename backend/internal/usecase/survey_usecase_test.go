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

	// 1. Create Survey Template
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

	// 2. Template Lifecycle: Activate, Duplicate, Archive
	err = uc.ActivateTemplate(created.ID)
	if err != nil {
		t.Fatalf("ActivateTemplate failed: %v", err)
	}

	dup, err := uc.DuplicateTemplate(created.ID, "koordinator-1")
	if err != nil || dup.ID == created.ID {
		t.Fatalf("DuplicateTemplate failed: %v", err)
	}

	err = uc.ArchiveTemplate(created.ID)
	if err != nil {
		t.Fatalf("ArchiveTemplate failed: %v", err)
	}

	// 3. Placements Picker Integration
	placements, err := uc.GetPlacements("KP", "2024-ganjil")
	if err != nil || len(placements) == 0 {
		t.Fatalf("GetPlacements failed: %v", err)
	}

	// 4. Create Invitation & Actions (Send, Remind, Resend, Cancel)
	inv, err := uc.CreateInvitation(&model.PartnerInvitation{
		SurveyID:       dup.ID,
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

	if err := uc.SendInvitation(inv.ID); err != nil {
		t.Fatalf("SendInvitation failed: %v", err)
	}
	if err := uc.RemindInvitation(inv.ID); err != nil {
		t.Fatalf("RemindInvitation failed: %v", err)
	}
	if err := uc.ResendInvitation(inv.ID); err != nil {
		t.Fatalf("ResendInvitation failed: %v", err)
	}

	// 5. Get Public Survey by Token
	survey, invitation, err := uc.GetPublicSurvey(inv.Token)
	if err != nil || invitation.EmailTujuan != "mitra@telkom.co.id" {
		t.Fatalf("GetPublicSurvey failed: %v", err)
	}

	// 6. Submit response
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

	// 7. Void Response
	err = uc.VoidResponse(inv.Token, "koordinator-1", "Pengisian uji coba tidak valid")
	if err != nil {
		t.Fatalf("VoidResponse failed: %v", err)
	}

	// 8. Recap
	recap, err := uc.GetRecap(dup.ID)
	if err != nil {
		t.Fatalf("GetRecap failed: %v", err)
	}
	_ = recap
}
