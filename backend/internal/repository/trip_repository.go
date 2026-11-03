package repository

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"simpro-backend/internal/database"
	"simpro-backend/internal/model"
)

type TripRepository interface {
	FindAll(status string, userID string, limit, offset int) ([]*model.TravelOrder, int, error)
	FindByID(id string) (*model.TravelOrder, error)
	Create(trip *model.TravelOrder) (*model.TravelOrder, error)
	Update(id string, trip *model.TravelOrder) (*model.TravelOrder, error)
	Delete(id string) error
	UpdateStatus(id string, status model.TravelStatus, approverID string) error
	SubmitReport(report *model.TravelReport, totalRealisasi float64) error
	GetRecap() (*model.TripRecap, error)
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabaseTripRepository struct {
	client *database.SupabaseClient
}

func NewSupabaseTripRepository(client *database.SupabaseClient) TripRepository {
	return &supabaseTripRepository{client: client}
}

func (r *supabaseTripRepository) FindAll(status string, userID string, limit, offset int) ([]*model.TravelOrder, int, error) {
	if limit <= 0 {
		limit = 20
	}
	params := map[string]string{
		"order":  "created_at.desc",
		"limit":  fmt.Sprintf("%d", limit),
		"offset": fmt.Sprintf("%d", offset),
	}
	countParams := map[string]string{}

	if status != "" {
		params["status"] = fmt.Sprintf("eq.%s", status)
		countParams["status"] = params["status"]
	}
	if userID != "" {
		params["diajukan_oleh"] = fmt.Sprintf("eq.%s", userID)
		countParams["diajukan_oleh"] = params["diajukan_oleh"]
	}

	var trips []*model.TravelOrder
	err := r.client.Select("travel_orders", params, &trips)
	if err != nil {
		return nil, 0, fmt.Errorf("gagal query travel_orders: %w", err)
	}

	total, _ := r.client.Count("travel_orders", countParams)
	if total == 0 {
		total = len(trips)
	}

	return trips, total, nil
}

func (r *supabaseTripRepository) FindByID(id string) (*model.TravelOrder, error) {
	var list []*model.TravelOrder
	err := r.client.Select("travel_orders", map[string]string{
		"id":    fmt.Sprintf("eq.%s", id),
		"limit": "1",
	}, &list)
	if err != nil || len(list) == 0 {
		return nil, errors.New("perjalanan dinas tidak ditemukan")
	}

	trip := list[0]
	var members []*model.TravelMember
	_ = r.client.Select("travel_members", map[string]string{
		"travel_order_id": fmt.Sprintf("eq.%s", id),
	}, &members)
	trip.Members = members

	var costs []*model.TravelCost
	_ = r.client.Select("travel_costs", map[string]string{
		"travel_order_id": fmt.Sprintf("eq.%s", id),
	}, &costs)
	trip.Costs = costs

	var reports []*model.TravelReport
	_ = r.client.Select("travel_reports", map[string]string{
		"travel_order_id": fmt.Sprintf("eq.%s", id),
		"limit":           "1",
	}, &reports)
	if len(reports) > 0 {
		trip.Report = reports[0]
	}

	return trip, nil
}

func (r *supabaseTripRepository) Create(trip *model.TravelOrder) (*model.TravelOrder, error) {
	if trip.ID == "" {
		trip.ID = uuid.New().String()
	}
	if trip.Status == "" {
		trip.Status = model.TripStatusDraft
	}

	payload := map[string]interface{}{
		"id":                   trip.ID,
		"nomor_surat_tugas":    trip.NomorSuratTugas,
		"tujuan":               trip.Tujuan,
		"keperluan":            trip.Keperluan,
		"tanggal_berangkat":    trip.TanggalBerangkat,
		"tanggal_kembali":      trip.TanggalKembali,
		"status":               string(trip.Status),
		"total_estimasi_biaya": trip.TotalEstimasiBiaya,
		"diajukan_oleh":        trip.DiajukanOleh,
	}

	var inserted []*model.TravelOrder
	if err := r.client.Insert("travel_orders", payload, &inserted); err != nil {
		return nil, fmt.Errorf("gagal membuat perjalanan dinas: %w", err)
	}

	for _, m := range trip.Members {
		if m.ID == "" {
			m.ID = uuid.New().String()
		}
		mPayload := map[string]interface{}{
			"id":              m.ID,
			"travel_order_id": trip.ID,
			"user_id":         m.UserID,
			"peran_tugas":     m.PeranTugas,
		}
		_ = r.client.Insert("travel_members", mPayload, nil)
	}

	for _, c := range trip.Costs {
		if c.ID == "" {
			c.ID = uuid.New().String()
		}
		cPayload := map[string]interface{}{
			"id":               c.ID,
			"travel_order_id":  trip.ID,
			"komponen":         c.Komponen,
			"nominal_estimasi": c.NominalEstimasi,
		}
		_ = r.client.Insert("travel_costs", cPayload, nil)
	}

	trip.CreatedAt = time.Now()
	trip.UpdatedAt = time.Now()
	return trip, nil
}

func (r *supabaseTripRepository) Update(id string, trip *model.TravelOrder) (*model.TravelOrder, error) {
	payload := map[string]interface{}{
		"tujuan":               trip.Tujuan,
		"keperluan":            trip.Keperluan,
		"tanggal_berangkat":    trip.TanggalBerangkat,
		"tanggal_kembali":      trip.TanggalKembali,
		"total_estimasi_biaya": trip.TotalEstimasiBiaya,
	}
	return trip, r.client.Update("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabaseTripRepository) Delete(id string) error {
	return r.client.Delete("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	})
}

func (r *supabaseTripRepository) UpdateStatus(id string, status model.TravelStatus, approverID string) error {
	payload := map[string]interface{}{
		"status": string(status),
	}
	if approverID != "" {
		payload["disetujui_oleh"] = approverID
	}
	return r.client.Update("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabaseTripRepository) SubmitReport(report *model.TravelReport, totalRealisasi float64) error {
	if report.ID == "" {
		report.ID = uuid.New().String()
	}
	payload := map[string]interface{}{
		"id":               report.ID,
		"travel_order_id":  report.TravelOrderID,
		"ringkasan_hasil":  report.RingkasanHasil,
		"file_laporan_url": report.FileLaporanURL,
	}
	if report.VerifiedBy != "" {
		payload["verified_by"] = report.VerifiedBy
	}
	if err := r.client.Insert("travel_reports", payload, nil); err != nil {
		return fmt.Errorf("gagal simpan laporan perjalanan: %w", err)
	}

	orderUpdate := map[string]interface{}{
		"total_realisasi_biaya": totalRealisasi,
		"status":                string(model.TripStatusLaporanTerverifikasi),
	}
	return r.client.Update("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", report.TravelOrderID),
	}, orderUpdate, nil)
}

func (r *supabaseTripRepository) GetRecap() (*model.TripRecap, error) {
	var list []*model.TravelOrder
	_ = r.client.Select("travel_orders", map[string]string{"select": "id,status,total_estimasi_biaya,total_realisasi_biaya"}, &list)

	recap := &model.TripRecap{
		TotalPerjalanan:  len(list),
		StatusDistribusi: make(map[string]int),
	}

	for _, t := range list {
		recap.TotalEstimasiBiaya += t.TotalEstimasiBiaya
		recap.TotalRealisasiBiaya += t.TotalRealisasiBiaya
		recap.StatusDistribusi[string(t.Status)]++
	}

	return recap, nil
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memoryTripRepository struct {
	mu      sync.RWMutex
	trips   map[string]*model.TravelOrder
	reports map[string]*model.TravelReport
}

func NewMemoryTripRepository() TripRepository {
	return &memoryTripRepository{
		trips:   make(map[string]*model.TravelOrder),
		reports: make(map[string]*model.TravelReport),
	}
}

func (r *memoryTripRepository) FindAll(status string, userID string, limit, offset int) ([]*model.TravelOrder, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []*model.TravelOrder
	for _, t := range r.trips {
		if status != "" && string(t.Status) != status {
			continue
		}
		if userID != "" && t.DiajukanOleh != userID {
			continue
		}
		filtered = append(filtered, t)
	}

	total := len(filtered)
	if offset >= total {
		return []*model.TravelOrder{}, total, nil
	}
	end := offset + limit
	if end > total || limit <= 0 {
		end = total
	}
	return filtered[offset:end], total, nil
}

func (r *memoryTripRepository) FindByID(id string) (*model.TravelOrder, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	t, ok := r.trips[id]
	if !ok {
		return nil, errors.New("perjalanan dinas tidak ditemukan")
	}
	res := *t
	res.Report = r.reports[id]
	return &res, nil
}

func (r *memoryTripRepository) Create(trip *model.TravelOrder) (*model.TravelOrder, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if trip.ID == "" {
		trip.ID = uuid.New().String()
	}
	if trip.Status == "" {
		trip.Status = model.TripStatusDraft
	}
	trip.CreatedAt = time.Now()
	trip.UpdatedAt = time.Now()
	r.trips[trip.ID] = trip
	return trip, nil
}

func (r *memoryTripRepository) Update(id string, trip *model.TravelOrder) (*model.TravelOrder, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	existing, ok := r.trips[id]
	if !ok {
		return nil, errors.New("perjalanan dinas tidak ditemukan")
	}
	existing.Tujuan = trip.Tujuan
	existing.Keperluan = trip.Keperluan
	existing.TanggalBerangkat = trip.TanggalBerangkat
	existing.TanggalKembali = trip.TanggalKembali
	existing.TotalEstimasiBiaya = trip.TotalEstimasiBiaya
	existing.UpdatedAt = time.Now()
	return existing, nil
}

func (r *memoryTripRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.trips, id)
	return nil
}

func (r *memoryTripRepository) UpdateStatus(id string, status model.TravelStatus, approverID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.trips[id]
	if !ok {
		return errors.New("perjalanan dinas tidak ditemukan")
	}
	t.Status = status
	if approverID != "" {
		t.DisetujuiOleh = approverID
	}
	t.UpdatedAt = time.Now()
	return nil
}

func (r *memoryTripRepository) SubmitReport(report *model.TravelReport, totalRealisasi float64) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.trips[report.TravelOrderID]
	if !ok {
		return errors.New("perjalanan dinas tidak ditemukan")
	}
	report.CreatedAt = time.Now()
	r.reports[report.TravelOrderID] = report
	t.TotalRealisasiBiaya = totalRealisasi
	t.Status = model.TripStatusLaporanTerverifikasi
	t.UpdatedAt = time.Now()
	return nil
}

func (r *memoryTripRepository) GetRecap() (*model.TripRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	recap := &model.TripRecap{
		TotalPerjalanan:  len(r.trips),
		StatusDistribusi: make(map[string]int),
	}

	for _, t := range r.trips {
		recap.TotalEstimasiBiaya += t.TotalEstimasiBiaya
		recap.TotalRealisasiBiaya += t.TotalRealisasiBiaya
		recap.StatusDistribusi[string(t.Status)]++
	}

	return recap, nil
}
