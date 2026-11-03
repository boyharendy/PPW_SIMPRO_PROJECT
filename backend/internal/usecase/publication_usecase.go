package usecase

import (
	"errors"
	"strings"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type PublicationUsecase interface {
	GetPublications(status, tipe string, tahun, page, limit int) ([]*model.Publication, int, error)
	GetPublicationByID(id string) (*model.Publication, error)
	CreatePublication(userID string, pub *model.Publication) (*model.Publication, error)
	UpdatePublication(id string, pub *model.Publication) (*model.Publication, error)
	DeletePublication(id string) error
	SubmitPublication(id string) error
	AddStageLog(id string, userID string, log *model.PublicationStageLog) error
	VerifyPublication(id string, status model.PublicationStatus, reviewerID, catatan string) error
	AddReview(id string, reviewerID, catatan, rekomendasi string) error
	GetRecap() (*model.PublicationRecap, error)
}

type publicationUsecase struct {
	repo repository.PublicationRepository
}

func NewPublicationUsecase(repo repository.PublicationRepository) PublicationUsecase {
	return &publicationUsecase{repo: repo}
}

func (u *publicationUsecase) GetPublications(status, tipe string, tahun, page, limit int) ([]*model.Publication, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit
	return u.repo.FindAll(status, tipe, tahun, limit, offset)
}

func (u *publicationUsecase) GetPublicationByID(id string) (*model.Publication, error) {
	return u.repo.FindByID(id)
}

func (u *publicationUsecase) CreatePublication(userID string, pub *model.Publication) (*model.Publication, error) {
	if strings.TrimSpace(pub.Judul) == "" {
		return nil, errors.New("judul publikasi wajib diisi")
	}
	pub.CreatedBy = userID
	if pub.Status == "" {
		pub.Status = model.PubStatusDraft
	}
	return u.repo.Create(pub)
}

func (u *publicationUsecase) UpdatePublication(id string, pub *model.Publication) (*model.Publication, error) {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if existing.Status == model.PubStatusTerverifikasi {
		return nil, errors.New("publikasi yang sudah terverifikasi tidak dapat diubah")
	}
	return u.repo.Update(id, pub)
}

func (u *publicationUsecase) DeletePublication(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if existing.Status == model.PubStatusTerverifikasi {
		return errors.New("publikasi terverifikasi tidak dapat dihapus")
	}
	return u.repo.Delete(id)
}

func (u *publicationUsecase) SubmitPublication(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if existing.Status != model.PubStatusDraft && existing.Status != model.PubStatusDitolak && existing.Status != model.PubStatusIde && existing.Status != model.PubStatusPenulisan {
		return errors.New("hanya publikasi berstatus DRAFT atau DITOLAK yang dapat diajukan")
	}
	return u.repo.UpdateStatus(id, model.PubStatusMenungguVerifikasi)
}

func (u *publicationUsecase) AddStageLog(id string, userID string, log *model.PublicationStageLog) error {
	log.PublicationID = id
	log.CreatedBy = userID
	return u.repo.AddStageLog(log)
}

func (u *publicationUsecase) VerifyPublication(id string, status model.PublicationStatus, reviewerID, catatan string) error {
	if err := u.repo.UpdateStatus(id, status); err != nil {
		return err
	}
	if catatan != "" {
		rekomendasi := "DITERIMA"
		if status == model.PubStatusDitolak {
			rekomendasi = "DITOLAK"
		}
		_ = u.repo.AddReview(&model.PublicationReview{
			PublicationID: id,
			ReviewerID:    reviewerID,
			Catatan:       catatan,
			Rekomendasi:   rekomendasi,
		})
	}
	return nil
}

func (u *publicationUsecase) AddReview(id string, reviewerID, catatan, rekomendasi string) error {
	return u.repo.AddReview(&model.PublicationReview{
		PublicationID: id,
		ReviewerID:    reviewerID,
		Catatan:       catatan,
		Rekomendasi:   rekomendasi,
	})
}

func (u *publicationUsecase) GetRecap() (*model.PublicationRecap, error) {
	return u.repo.GetRecap()
}
