package usecase

import (
	"errors"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type EvaluationUsecase interface {
	GetEvaluations() ([]*model.CourseEvaluation, error)
	GetEvaluationByClass(classID string) (*model.CourseEvaluation, error)
	SaveEvaluation(eval *model.CourseEvaluation) (*model.CourseEvaluation, error)
	SubmitEvaluation(classID string) error
	GetImprovementPlansByCourse(courseID string) ([]*model.CourseImprovementPlan, error)
	UpdateImprovementPlan(planID, status, rpsID, catatan string) error
	GetRecap() (*model.EvaluationRecap, error)
}

type evaluationUsecase struct {
	repo repository.EvaluationRepository
}

func NewEvaluationUsecase(repo repository.EvaluationRepository) EvaluationUsecase {
	return &evaluationUsecase{repo: repo}
}

func (u *evaluationUsecase) GetEvaluations() ([]*model.CourseEvaluation, error) {
	return u.repo.FindAll()
}

func (u *evaluationUsecase) GetEvaluationByClass(classID string) (*model.CourseEvaluation, error) {
	return u.repo.FindByClassID(classID)
}

func (u *evaluationUsecase) SaveEvaluation(eval *model.CourseEvaluation) (*model.CourseEvaluation, error) {
	if eval.CourseClassID == "" {
		return nil, errors.New("course_class_id wajib diisi")
	}
	return u.repo.Save(eval)
}

func (u *evaluationUsecase) SubmitEvaluation(classID string) error {
	existing, err := u.repo.FindByClassID(classID)
	if err != nil {
		return err
	}
	existing.IsSubmitted = true
	existing.Status = "TERKIRIM"
	_, err = u.repo.Save(existing)
	return err
}

func (u *evaluationUsecase) GetImprovementPlansByCourse(courseID string) ([]*model.CourseImprovementPlan, error) {
	return u.repo.FindImprovementPlansByCourse(courseID)
}

func (u *evaluationUsecase) UpdateImprovementPlan(planID, status, rpsID, catatan string) error {
	if status == "" {
		status = "SUDAH_DITERAPKAN"
	}
	return u.repo.UpdateImprovementPlan(planID, status, rpsID, catatan)
}

func (u *evaluationUsecase) GetRecap() (*model.EvaluationRecap, error) {
	return u.repo.GetRecap()
}
