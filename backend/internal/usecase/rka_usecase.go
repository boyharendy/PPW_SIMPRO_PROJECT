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
	GetRkaByID(id string) (*model.RkaDocument, error)
	CreateRka(doc *model.RkaDocument) (*model.RkaDocument, error)
	UpdateRka(tahun string, doc *model.RkaDocument) (*model.RkaDocument, error)
	AddRealization(tahun string, realization *model.RkaRealization) error
	GetSerapan(tahun string) (*model.RkaSerapan, error)

	// PRD Milestone 2 Methods
	GetWorkingVersion(rkaIDOrYear string) (*model.RkaVersion, error)
	UpdateWorkingVersion(rkaIDOrYear string, ifMatchVersion int, payload map[string]interface{}) (*model.RkaVersion, error)
	SubmitWorkingVersion(rkaIDOrYear string) error
	GetVersionDiff(rkaIDOrYear string, nomorVersi int) (map[string]interface{}, error)
	DecideVersion(rkaIDOrYear string, nomorVersi int, approved bool, actorID string) error
	CloseRka(rkaIDOrYear string) error
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

func (u *rkaUsecase) GetRkaByID(id string) (*model.RkaDocument, error) {
	return u.repo.FindByID(id)
}

func (u *rkaUsecase) CreateRka(doc *model.RkaDocument) (*model.RkaDocument, error) {
	if strings.TrimSpace(doc.TahunAnggaran) == "" {
		return nil, errors.New("tahun anggaran wajib diisi")
	}
	if doc.PaguTotal < 0 {
		return nil, errors.New("pagu total tidak boleh bernilai negatif")
	}
	for _, item := range doc.BudgetItems {
		if item.AnggaranAlokasi < 0 {
			return nil, errors.New("anggaran alokasi tidak boleh bernilai negatif")
		}
	}
	doc.Status = model.BudgetStatusDraft
	return u.repo.Create(doc)
}

func (u *rkaUsecase) UpdateRka(tahun string, doc *model.RkaDocument) (*model.RkaDocument, error) {
	if doc.PaguTotal < 0 {
		return nil, errors.New("pagu total tidak boleh bernilai negatif")
	}
	for _, item := range doc.BudgetItems {
		if item.AnggaranAlokasi < 0 {
			return nil, errors.New("anggaran alokasi tidak boleh bernilai negatif")
		}
	}
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

func (u *rkaUsecase) GetWorkingVersion(rkaIDOrYear string) (*model.RkaVersion, error) {
	return u.repo.GetWorkingVersion(rkaIDOrYear)
}

func (u *rkaUsecase) UpdateWorkingVersion(rkaIDOrYear string, ifMatchVersion int, payload map[string]interface{}) (*model.RkaVersion, error) {
	return u.repo.UpdateWorkingVersion(rkaIDOrYear, ifMatchVersion, payload)
}

func (u *rkaUsecase) SubmitWorkingVersion(rkaIDOrYear string) error {
	return u.repo.SubmitWorkingVersion(rkaIDOrYear)
}

func (u *rkaUsecase) GetVersionDiff(rkaIDOrYear string, nomorVersi int) (map[string]interface{}, error) {
	return u.repo.GetVersionDiff(rkaIDOrYear, nomorVersi)
}

func (u *rkaUsecase) DecideVersion(rkaIDOrYear string, nomorVersi int, approved bool, actorID string) error {
	return u.repo.DecideVersion(rkaIDOrYear, nomorVersi, approved, actorID)
}

func (u *rkaUsecase) CloseRka(rkaIDOrYear string) error {
	return u.repo.CloseRka(rkaIDOrYear)
}
