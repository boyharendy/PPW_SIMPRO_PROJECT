package usecase

import (
	"errors"
	"strings"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type TripUsecase interface {
	GetTrips(status string, userID string, page, limit int) ([]*model.TravelOrder, int, error)
	GetTripByID(id string) (*model.TravelOrder, error)
	CreateTrip(userID string, trip *model.TravelOrder) (*model.TravelOrder, error)
	UpdateTrip(id string, trip *model.TravelOrder) (*model.TravelOrder, error)
	DeleteTrip(id string) error
	SubmitTrip(id string) error
	ApproveTrip(id string, approverID string, approved bool) error
	SubmitReport(id string, userID string, ringkasan, fileURL string, totalRealisasi float64) error
	AddProof(id string, proof *model.TravelProof) error
	GetRecap() (*model.TripRecap, error)

	// PRD Milestone 2 Methods
	UpdateCosts(id string, costs []*model.TravelCost) error
	UpdateRealizationCosts(id string, costs []*model.TravelCost) error
	ConfirmTrip(id string, actorID string) (*model.TravelOrder, error)
	GetCompleteness(id string) (map[string]interface{}, error)
	GetFlags() ([]map[string]interface{}, error)
}

type tripUsecase struct {
	repo    repository.TripRepository
	rkaRepo repository.RkaRepository
}

func NewTripUsecase(repo repository.TripRepository, rkaRepo ...repository.RkaRepository) TripUsecase {
	var rka repository.RkaRepository
	if len(rkaRepo) > 0 {
		rka = rkaRepo[0]
	}
	return &tripUsecase{repo: repo, rkaRepo: rka}
}

func (u *tripUsecase) GetTrips(status string, userID string, page, limit int) ([]*model.TravelOrder, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit
	return u.repo.FindAll(status, userID, limit, offset)
}

func (u *tripUsecase) GetTripByID(id string) (*model.TravelOrder, error) {
	return u.repo.FindByID(id)
}

func (u *tripUsecase) CreateTrip(userID string, trip *model.TravelOrder) (*model.TravelOrder, error) {
	if strings.TrimSpace(trip.Tujuan) == "" {
		return nil, errors.New("tujuan perjalanan dinas wajib diisi")
	}
	if strings.TrimSpace(trip.Keperluan) == "" && strings.TrimSpace(trip.MaksudKegiatan) != "" {
		trip.Keperluan = trip.MaksudKegiatan
	}
	if strings.TrimSpace(trip.Keperluan) == "" {
		return nil, errors.New("keperluan dinas wajib diisi")
	}
	if trip.TotalEstimasiBiaya < 0 {
		return nil, errors.New("estimasi biaya tidak boleh bernilai negatif")
	}
	for _, c := range trip.Costs {
		if c.NominalEstimasi < 0 || c.EstimasiBiaya < 0 {
			return nil, errors.New("komponen biaya tidak boleh bernilai negatif")
		}
	}
	trip.DiajukanOleh = userID
	if trip.Status == "" {
		trip.Status = model.TripStatusDraft
	}
	return u.repo.Create(trip)
}

func (u *tripUsecase) UpdateTrip(id string, trip *model.TravelOrder) (*model.TravelOrder, error) {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if existing.Status != model.TripStatusDraft && existing.Status != model.TripStatusDitolak {
		return nil, errors.New("hanya pengajuan berstatus DRAFT atau DITOLAK yang dapat diedit")
	}
	return u.repo.Update(id, trip)
}

func (u *tripUsecase) DeleteTrip(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if existing.Status != model.TripStatusDraft {
		return errors.New("hanya draft perjalanan dinas yang dapat dihapus")
	}
	return u.repo.Delete(id)
}

func (u *tripUsecase) SubmitTrip(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if existing.Status != model.TripStatusDraft && existing.Status != model.TripStatusDitolak {
		return errors.New("pengajuan hanya dapat dikirim jika berstatus DRAFT atau DITOLAK")
	}
	return u.repo.UpdateStatus(id, model.TripStatusDiajukan, "")
}

func (u *tripUsecase) ApproveTrip(id string, approverID string, approved bool) error {
	status := model.TripStatusDisetujuiKaprodi
	if !approved {
		status = model.TripStatusDitolak
	}
	return u.repo.UpdateStatus(id, status, approverID)
}

func (u *tripUsecase) SubmitReport(id string, userID string, ringkasan, fileURL string, totalRealisasi float64) error {
	if totalRealisasi < 0 {
		return errors.New("total realisasi biaya tidak boleh negatif")
	}
	report := &model.TravelReport{
		TravelOrderID:  id,
		RingkasanHasil: ringkasan,
		FileLaporanURL: fileURL,
		VerifiedBy:     userID,
	}
	return u.repo.SubmitReport(report, totalRealisasi)
}

func (u *tripUsecase) AddProof(id string, proof *model.TravelProof) error {
	proof.TravelOrderID = id
	return u.repo.AddProof(proof)
}

func (u *tripUsecase) GetRecap() (*model.TripRecap, error) {
	return u.repo.GetRecap()
}

func (u *tripUsecase) UpdateCosts(id string, costs []*model.TravelCost) error {
	return u.repo.UpdateCosts(id, costs)
}

func (u *tripUsecase) UpdateRealizationCosts(id string, costs []*model.TravelCost) error {
	return u.repo.UpdateRealizationCosts(id, costs)
}

func (u *tripUsecase) ConfirmTrip(id string, actorID string) (*model.TravelOrder, error) {
	return u.repo.ConfirmTrip(id, actorID, u.rkaRepo)
}

func (u *tripUsecase) GetCompleteness(id string) (map[string]interface{}, error) {
	return u.repo.GetCompleteness(id)
}

func (u *tripUsecase) GetFlags() ([]map[string]interface{}, error) {
	return u.repo.GetFlags()
}
