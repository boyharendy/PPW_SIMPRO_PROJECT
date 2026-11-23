package usecase

import (
	"errors"
	"math"
	"strings"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type TripUsecase interface {
	BudgetOptions() ([]model.TripBudgetOption, error)
	GetTrips(status string, userID string, page, limit int) ([]*model.TravelOrder, int, error)
	GetTripByID(id string) (*model.TravelOrder, error)
	CreateTrip(userID string, trip *model.TravelOrder) (*model.TravelOrder, error)
	UpdateTrip(id string, trip *model.TravelOrder) (*model.TravelOrder, error)
	DeleteTrip(id string) error
	SubmitTrip(id string) error
	DecideTrip(id, approverID string, decision model.TripDecision) error
	SubmitReport(id string, userID string, ringkasan, fileURL string, totalRealisasi float64) error
	AddProof(id string, proof *model.TravelProof) error
	GetRecap() (*model.TripRecap, error)

	// PRD Milestone 2 Methods
	UpdateCosts(id string, costs []*model.TravelCost) error
	UpdateRealizationCosts(id string, costs []*model.TravelCost) error
	ConfirmTrip(id string, actorID string) (*model.TravelOrder, error)
	MarkIncomplete(id, note string) error
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
	if err := validateCosts(trip.Costs, false); err != nil {
		return nil, err
	}
	trip.ID = ""
	trip.DiajukanOleh = userID
	trip.Status = model.TripStatusDraft
	trip.TotalEstimasiBiaya = 0
	trip.TotalRealisasiBiaya = 0
	trip.Report = nil
	trip.Proofs = nil
	trip.DisetujuiOleh = ""
	trip.DikonfirmasiOleh = ""
	for _, c := range trip.Costs {
		c.ID = ""
		c.NominalRealisasi = 0
		c.RealisasiBiaya = 0
		c.RealisasiDiisi = false
	}
	if err := validateTripMembers(trip.Members); err != nil {
		return nil, err
	}
	return u.repo.Create(trip)
}

func (u *tripUsecase) UpdateTrip(id string, trip *model.TravelOrder) (*model.TravelOrder, error) {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if !existing.Draft() {
		return nil, errors.New("pengajuan hanya dapat diedit saat masih berupa draf atau dikembalikan")
	}
	if err := validateTripMembers(trip.Members); err != nil {
		return nil, err
	}
	if trip.Costs != nil {
		if err := u.UpdateCosts(id, trip.Costs); err != nil {
			return nil, err
		}
	}
	return u.repo.Update(id, trip)
}

func (u *tripUsecase) DeleteTrip(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if existing.Status != model.TripStatusDraft && existing.Status != model.TripStatusDraf {
		return errors.New("hanya draft perjalanan dinas yang dapat dihapus")
	}
	return u.repo.Delete(id)
}

func (u *tripUsecase) SubmitTrip(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if !existing.Draft() {
		return errors.New("pengajuan hanya dapat dikirim dari draf atau usulan yang dikembalikan")
	}
	if (existing.SumberDana == "RKA_PRODI" || existing.SumberDana == "RKAT_PRODI" || existing.SumberDana == "RKA") && existing.RkaBudgetItemID == "" {
		return errors.New("pos anggaran RKA wajib dipilih")
	}
	if err := requiredTripCosts(existing.Costs, false); err != nil {
		return err
	}
	return u.repo.UpdateStatus(id, model.TripStatusDiajukan, "", nil)
}

func (u *tripUsecase) DecideTrip(id, approverID string, decision model.TripDecision) error {
	trip, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if trip.Status != model.TripStatusDiajukan || trip.Participant(approverID) {
		return errors.New("keputusan membutuhkan usulan aktif dan pejabat yang independen")
	}
	switch decision.Status {
	case model.TripStatusDisetujuiKaprodi, model.TripStatusDitolak:
	case model.TripStatusPerluRevisi:
		if strings.TrimSpace(decision.Catatan) == "" {
			return errors.New("catatan revisi wajib diisi")
		}
	default:
		return errors.New("keputusan tidak valid")
	}
	return u.repo.UpdateStatus(id, decision.Status, approverID, &decision)
}

func (u *tripUsecase) SubmitReport(id string, userID string, ringkasan, fileURL string, totalRealisasi float64) error {
	if totalRealisasi < 0 {
		return errors.New("total realisasi biaya tidak boleh negatif")
	}
	t, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if !t.Approved() || !t.Participant(userID) {
		return errors.New("status atau pelaksana laporan tidak valid")
	}
	if err = requiredTripCosts(t.Costs, true); err != nil {
		return err
	}
	report := &model.TravelReport{
		TravelOrderID:  id,
		RingkasanHasil: ringkasan,
		FileLaporanURL: fileURL,
	}
	return u.repo.SubmitReport(report, actualTripCost(t.Costs))
}

func (u *tripUsecase) AddProof(id string, proof *model.TravelProof) error {
	proof.TravelOrderID = id
	return u.repo.AddProof(proof)
}

func (u *tripUsecase) GetRecap() (*model.TripRecap, error) {
	return u.repo.GetRecap()
}

func (u *tripUsecase) UpdateCosts(id string, costs []*model.TravelCost) error {
	if err := validateCosts(costs, false); err != nil {
		return err
	}
	return u.repo.UpdateCosts(id, costs)
}

func (u *tripUsecase) UpdateRealizationCosts(id string, costs []*model.TravelCost) error {
	if err := validateCosts(costs, true); err != nil {
		return err
	}
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

func validateTripMembers(members []*model.TravelMember) error {
	seen := make(map[string]bool, len(members))
	for _, m := range members {
		if m == nil || m.UserID == "" || seen[m.UserID] {
			return errors.New("pelaksana kosong atau terdaftar dua kali")
		}
		m.ID = ""
		seen[m.UserID] = true
	}
	return nil
}

func validateCosts(costs []*model.TravelCost, actual bool) error {
	seen := map[string]bool{}
	for _, c := range costs {
		if c == nil {
			return errors.New("komponen biaya kosong")
		}
		switch c.Komponen {
		case "TRANSPORTASI", "AKOMODASI", "UANG_HARIAN", "LAINNYA":
		default:
			return errors.New("komponen biaya tidak valid")
		}
		if c.MissingAmount(actual) {
			return errors.New("nominal komponen wajib diisi, termasuk bila nol")
		}
		if seen[c.Komponen] {
			return errors.New("komponen biaya berulang")
		}
		seen[c.Komponen] = true
		for _, n := range []float64{c.NominalEstimasi, c.EstimasiBiaya, c.NominalRealisasi, c.RealisasiBiaya} {
			if n < 0 || math.IsNaN(n) || math.IsInf(n, 0) || n >= 1e13 {
				return errors.New("nominal di luar batas")
			}
		}
		if actual {
			if c.NominalRealisasi == 0 {
				c.NominalRealisasi = c.RealisasiBiaya
			}
			c.NominalRealisasi = math.Round(c.NominalRealisasi*100) / 100
		} else {
			if c.NominalEstimasi == 0 {
				c.NominalEstimasi = c.EstimasiBiaya
			}
			c.NominalEstimasi = math.Round(c.NominalEstimasi*100) / 100
			c.NominalRealisasi = 0
			c.RealisasiDiisi = false
		}
	}
	return nil
}
func requiredTripCosts(costs []*model.TravelCost, actual bool) error {
	seen := map[string]bool{}
	for _, c := range costs {
		if c == nil || actual && !c.RealisasiDiisi {
			return errors.New("lengkapi realisasi setiap komponen")
		}
		seen[c.Komponen] = true
	}
	for _, k := range []string{"TRANSPORTASI", "AKOMODASI", "UANG_HARIAN"} {
		if !seen[k] {
			return errors.New("komponen wajib belum lengkap")
		}
	}
	return nil
}

func (u *tripUsecase) MarkIncomplete(id, note string) error {
	if strings.TrimSpace(note) == "" {
		return errors.New("jelaskan bukti yang belum lengkap")
	}
	return u.repo.MarkIncomplete(id, note)
}

func actualTripCost(costs []*model.TravelCost) float64 {
	var cents int64
	for _, cost := range costs {
		cents += int64(math.Round(cost.NominalRealisasi * 100))
	}
	return float64(cents) / 100
}

func (u *tripUsecase) BudgetOptions() ([]model.TripBudgetOption, error) {
	return u.rkaRepo.TripBudgetOptions()
}
