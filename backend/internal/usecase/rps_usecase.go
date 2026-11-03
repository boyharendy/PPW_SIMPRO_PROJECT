package usecase

import (
	"errors"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type RpsUsecase interface {
	GetSubmissions(courseID, status string) ([]*model.RpsSubmission, error)
	GetSubmissionByID(id string) (*model.RpsSubmission, error)
	CreateSubmission(userID string, sub *model.RpsSubmission) (*model.RpsSubmission, error)
	SubmitForReview(id string) error
	ReviewSubmission(id string, reviewerID string, komentar, rekomendasi string) error
	RatifySubmission(id string) error
	GetRecap() (*model.RpsRecap, error)
}

type rpsUsecase struct {
	repo repository.RpsRepository
}

func NewRpsUsecase(repo repository.RpsRepository) RpsUsecase {
	return &rpsUsecase{repo: repo}
}

func (u *rpsUsecase) GetSubmissions(courseID, status string) ([]*model.RpsSubmission, error) {
	return u.repo.FindAll(courseID, status)
}

func (u *rpsUsecase) GetSubmissionByID(id string) (*model.RpsSubmission, error) {
	return u.repo.FindByID(id)
}

func (u *rpsUsecase) CreateSubmission(userID string, sub *model.RpsSubmission) (*model.RpsSubmission, error) {
	if sub.CourseID == "" || sub.AcademicPeriodID == "" {
		return nil, errors.New("course_id dan academic_period_id wajib diisi")
	}
	sub.DosenPenyusunID = userID
	sub.Status = model.RpsStatusDraft
	return u.repo.Create(sub)
}

func (u *rpsUsecase) SubmitForReview(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if existing.Status != model.RpsStatusDraft && existing.Status != model.RpsStatusRevisi {
		return errors.New("hanya pengajuan berstatus DRAFT atau REVISI yang dapat diajukan")
	}
	return u.repo.UpdateStatus(id, model.RpsStatusDiajukan)
}

func (u *rpsUsecase) ReviewSubmission(id string, reviewerID string, komentar, rekomendasi string) error {
	status := model.RpsStatusDisetujuiGKM
	if rekomendasi == "REVISI" {
		status = model.RpsStatusRevisi
	}
	if err := u.repo.UpdateStatus(id, status); err != nil {
		return err
	}
	return u.repo.AddReview(&model.RpsReview{
		RpsSubmissionID: id,
		ReviewerID:      reviewerID,
		Komentar:        komentar,
		Rekomendasi:     rekomendasi,
	})
}

func (u *rpsUsecase) RatifySubmission(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if existing.Status != model.RpsStatusDisetujuiGKM {
		return errors.New("RPS harus disetujui GKM terlebih dahulu sebelum disahkan Kaprodi")
	}
	return u.repo.UpdateStatus(id, model.RpsStatusDisahkanKaprodi)
}

func (u *rpsUsecase) GetRecap() (*model.RpsRecap, error) {
	return u.repo.GetRecap()
}
