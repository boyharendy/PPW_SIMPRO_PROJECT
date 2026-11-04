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
	GetPublicSurvey(token string) (*model.PartnerSurvey, *model.PartnerInvitation, error)
	SubmitPublicResponse(sub *model.PartnerResponseSubmission) error
	GetRecap(surveyID string) (*model.SurveyRecap, error)
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

func (u *surveyUsecase) GetRecap(surveyID string) (*model.SurveyRecap, error) {
	return u.repo.GetRecap(surveyID)
}
