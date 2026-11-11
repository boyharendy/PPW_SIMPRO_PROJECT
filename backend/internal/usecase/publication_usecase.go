package usecase

import (
	"errors"
	"fmt"
	"math"
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

	// PRD Milestone 5 Methods
	UpdateAuthors(id string, authors []*model.PublicationAuthor) error
	GetVerificationQueue(verifierID string) ([]*model.Publication, error)
	AssignVerifier(id string, verifierID string) error
	VerifyStage(stageID string, verifierID string, status string, catatan string) error
	CompleteReview(reviewID string, rekomendasi string, catatan string) error
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
	if existing.Status != model.PubStatusDraft && existing.Status != model.PubStatusDitolak && existing.Status != model.PubStatusDraf {
		return errors.New("hanya publikasi berstatus DRAF atau DITOLAK yang dapat diajukan")
	}
	return u.repo.UpdateStatus(id, model.PubStatusMenungguVerifikasi)
}

func (u *publicationUsecase) AddStageLog(id string, userID string, log *model.PublicationStageLog) error {
	log.PublicationID = id
	log.DicatatOleh = userID
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

func (u *publicationUsecase) UpdateAuthors(id string, authors []*model.PublicationAuthor) error {
	if len(authors) == 0 {
		return errors.New("daftar penulis publikasi tidak boleh kosong")
	}

	var totalPercentage float64
	for i, a := range authors {
		if a.Urutan == 0 {
			a.Urutan = i + 1
		}
		if a.PersentaseKontribusi <= 0 {
			return fmt.Errorf("persentase kontribusi penulis ke-%d (%s) harus lebih dari 0%%", a.Urutan, a.NamaPenulis)
		}
		totalPercentage += a.PersentaseKontribusi
	}

	// Validasi total harus 100% (dengan toleransi pembulatan desimal 0.01)
	if math.Abs(totalPercentage-100.0) > 0.01 {
		return fmt.Errorf("total kontribusi persentase seluruh penulis harus tepat 100%% (saat ini: %.2f%%)", totalPercentage)
	}

	return u.repo.UpdateAuthors(id, authors)
}

func (u *publicationUsecase) GetVerificationQueue(verifierID string) ([]*model.Publication, error) {
	return u.repo.GetVerificationQueue(verifierID)
}

func (u *publicationUsecase) AssignVerifier(id string, verifierID string) error {
	pub, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}

	// Verifikator tidak boleh merupakan salah satu penulis publikasi tersebut (Bab 3 FR-31)
	for _, a := range pub.Authors {
		if a.UserID == verifierID {
			return errors.New("dosen verifikator tidak boleh merupakan salah satu penulis naskah ini")
		}
	}

	return u.repo.AssignVerifier(id, verifierID)
}

func (u *publicationUsecase) VerifyStage(stageID string, verifierID string, status string, catatan string) error {
	if status != "TERVERIFIKASI" && status != "DITOLAK" {
		return errors.New("status verifikasi tahap harus TERVERIFIKASI atau DITOLAK")
	}
	return u.repo.VerifyStage(stageID, verifierID, status, catatan)
}

func (u *publicationUsecase) CompleteReview(reviewID string, rekomendasi string, catatan string) error {
	if rekomendasi == "" {
		return errors.New("rekomendasi review internal (LAYAK_DIAJUKAN / PERLU_PERBAIKAN) wajib dipilih")
	}
	return u.repo.CompleteReview(reviewID, rekomendasi, catatan)
}

func (u *publicationUsecase) GetRecap() (*model.PublicationRecap, error) {
	return u.repo.GetRecap()
}
