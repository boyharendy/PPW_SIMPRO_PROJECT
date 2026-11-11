package usecase

import (
	"errors"
	"strings"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type SurveyUsecase interface {
	GetSurveys() ([]*model.PartnerSurvey, error)
	GetSurveyByID(id string) (*model.PartnerSurvey, error)
	CreateSurvey(survey *model.PartnerSurvey) (*model.PartnerSurvey, error)
	UpdateSurvey(id string, survey *model.PartnerSurvey) (*model.PartnerSurvey, error)
	DeleteSurvey(id string) error
	CreateInvitation(inv *model.PartnerInvitation) (*model.PartnerInvitation, error)
	GetInvitations(surveyID string) ([]*model.PartnerInvitation, error)
	GetPublicSurvey(token string) (*model.PartnerSurvey, *model.PartnerInvitation, error)
	SubmitPublicResponse(sub *model.PartnerResponseSubmission) error
	SubmitManualResponse(userID string, sub *model.PartnerResponseSubmission) error
	GetRecap(surveyID string) (*model.SurveyRecap, error)

	// PRD Milestone 5 Methods
	ActivateTemplate(id string) error
	DuplicateTemplate(id string, createdBy string) (*model.PartnerSurvey, error)
	ArchiveTemplate(id string) error
	SendInvitation(id string) error
	RemindInvitation(id string) error
	ResendInvitation(id string) error
	CancelInvitation(id string) error
	GetPlacements(program, academicPeriodID string) ([]*model.StudentPlacement, error)
	VoidResponse(id string, voidedBy, alasan string) error
}

type surveyUsecase struct {
	repo repository.SurveyRepository
}

func NewSurveyUsecase(repo repository.SurveyRepository) SurveyUsecase {
	return &surveyUsecase{repo: repo}
}

func (u *surveyUsecase) GetSurveys() ([]*model.PartnerSurvey, error) {
	return u.repo.FindSurveys()
}

func (u *surveyUsecase) GetSurveyByID(id string) (*model.PartnerSurvey, error) {
	return u.repo.FindSurveyByID(id)
}

func (u *surveyUsecase) CreateSurvey(survey *model.PartnerSurvey) (*model.PartnerSurvey, error) {
	if strings.TrimSpace(survey.Judul) == "" {
		return nil, errors.New("judul survei wajib diisi")
	}
	if survey.Program == "" {
		survey.Program = model.ProgramKerjaPraktik
	}
	survey.IsActive = true
	return u.repo.CreateSurvey(survey)
}

func (u *surveyUsecase) UpdateSurvey(id string, survey *model.PartnerSurvey) (*model.PartnerSurvey, error) {
	return u.repo.UpdateSurvey(id, survey)
}

func (u *surveyUsecase) DeleteSurvey(id string) error {
	return u.repo.DeleteSurvey(id)
}

func (u *surveyUsecase) CreateInvitation(inv *model.PartnerInvitation) (*model.PartnerInvitation, error) {
	if inv.SurveyID == "" || inv.EmailTujuan == "" {
		return nil, errors.New("survey_id dan email_tujuan wajib diisi")
	}
	return u.repo.CreateInvitation(inv)
}

func (u *surveyUsecase) GetInvitations(surveyID string) ([]*model.PartnerInvitation, error) {
	list, err := u.repo.FindInvitations()
	if err != nil {
		return nil, err
	}
	if surveyID == "" {
		return list, nil
	}
	var filtered []*model.PartnerInvitation
	for _, inv := range list {
		if inv.SurveyID == surveyID {
			filtered = append(filtered, inv)
		}
	}
	return filtered, nil
}

func (u *surveyUsecase) GetPublicSurvey(token string) (*model.PartnerSurvey, *model.PartnerInvitation, error) {
	inv, err := u.repo.FindInvitationByToken(token)
	if err != nil {
		return nil, nil, err
	}
	survey, err := u.repo.FindSurveyByID(inv.SurveyID)
	if err != nil {
		return nil, nil, err
	}
	return survey, inv, nil
}

func (u *surveyUsecase) SubmitPublicResponse(sub *model.PartnerResponseSubmission) error {
	if sub.InvitationToken == "" {
		return errors.New("token undangan wajib disertakan")
	}
	return u.repo.SubmitResponse(sub)
}

func (u *surveyUsecase) SubmitManualResponse(userID string, sub *model.PartnerResponseSubmission) error {
	if sub.SurveyID == "" {
		return errors.New("survey_id wajib disertakan")
	}
	sub.DiinputOleh = userID
	sub.Sumber = "INPUT_KOORDINATOR"
	return u.repo.SubmitManualResponse(sub)
}

func (u *surveyUsecase) GetRecap(surveyID string) (*model.SurveyRecap, error) {
	return u.repo.GetRecap(surveyID)
}

func (u *surveyUsecase) ActivateTemplate(id string) error {
	return u.repo.ActivateTemplate(id)
}

func (u *surveyUsecase) DuplicateTemplate(id string, createdBy string) (*model.PartnerSurvey, error) {
	return u.repo.DuplicateTemplate(id, createdBy)
}

func (u *surveyUsecase) ArchiveTemplate(id string) error {
	return u.repo.ArchiveTemplate(id)
}

func (u *surveyUsecase) SendInvitation(id string) error {
	return u.repo.UpdateInvitationStatus(id, "TERKIRIM")
}

func (u *surveyUsecase) RemindInvitation(id string) error {
	return u.repo.UpdateInvitationStatus(id, "PENGINGAT_TERKIRIM")
}

func (u *surveyUsecase) ResendInvitation(id string) error {
	return u.repo.UpdateInvitationStatus(id, "TERKIRIM_ULANG")
}

func (u *surveyUsecase) CancelInvitation(id string) error {
	return u.repo.UpdateInvitationStatus(id, "DIBATALKAN")
}

func (u *surveyUsecase) GetPlacements(program, academicPeriodID string) ([]*model.StudentPlacement, error) {
	return u.repo.FindPlacements(program, academicPeriodID)
}

func (u *surveyUsecase) VoidResponse(id string, voidedBy, alasan string) error {
	if strings.TrimSpace(alasan) == "" {
		return errors.New("alasan pembatalan (void) respons survei wajib diisi")
	}
	return u.repo.VoidResponse(id, voidedBy, alasan)
}
