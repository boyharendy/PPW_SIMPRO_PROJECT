package usecase

import (
	"errors"
	"strings"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type RkaUsecase interface {
	GetRkaList() ([]*model.RkaDocument, error)
	GetRkaByYear(tahun string) (*model.RkaDocument, error)
	CreateRka(doc *model.RkaDocument) (*model.RkaDocument, error)
	UpdateRka(tahun string, doc *model.RkaDocument) (*model.RkaDocument, error)
	AddRealization(tahun string, realization *model.RkaRealization) error
	GetSerapan(tahun string) (*model.RkaSerapan, error)
}

type rkaUsecase struct {
	repo repository.RkaRepository
}

func NewRkaUsecase(repo repository.RkaRepository) RkaUsecase {
	return &rkaUsecase{repo: repo}
}

func (u *rkaUsecase) GetRkaList() ([]*model.RkaDocument, error) {
	return u.repo.FindAll()
}

func (u *rkaUsecase) GetRkaByYear(tahun string) (*model.RkaDocument, error) {
	return u.repo.FindByYear(tahun)
}

func (u *rkaUsecase) CreateRka(doc *model.RkaDocument) (*model.RkaDocument, error) {
	if strings.TrimSpace(doc.TahunAnggaran) == "" {
		return nil, errors.New("tahun anggaran wajib diisi")
	}
	doc.Status = model.BudgetStatusDraft
	return u.repo.Create(doc)
}

func (u *rkaUsecase) UpdateRka(tahun string, doc *model.RkaDocument) (*model.RkaDocument, error) {
	return u.repo.Update(tahun, doc)
}

func (u *rkaUsecase) AddRealization(tahun string, realization *model.RkaRealization) error {
	if realization.BudgetItemId == "" || realization.Nominal <= 0 {
		return errors.New("budget_item_id dan nominal valid wajib diisi")
	}
	return u.repo.AddRealization(realization)
}

func (u *rkaUsecase) GetSerapan(tahun string) (*model.RkaSerapan, error) {
	return u.repo.GetSerapan(tahun)
}
