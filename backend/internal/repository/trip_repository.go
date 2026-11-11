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
	AddProof(proof *model.TravelProof) error
	SubmitReport(report *model.TravelReport, totalRealisasi float64) error
	GetRecap() (*model.TripRecap, error)

	// PRD Milestone 2 Methods
	UpdateCosts(id string, costs []*model.TravelCost) error
	UpdateRealizationCosts(id string, costs []*model.TravelCost) error
	ConfirmTrip(id string, actorID string, rkaRepo RkaRepository) (*model.TravelOrder, error)
	GetCompleteness(id string) (map[string]interface{}, error)
	GetFlags() ([]map[string]interface{}, error)
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

	var proofs []*model.TravelProof
	_ = r.client.Select("travel_proofs", map[string]string{
		"travel_order_id": fmt.Sprintf("eq.%s", id),
		"order":           "created_at.asc",
	}, &proofs)
	trip.Proofs = proofs

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
	if trip.Keperluan == "" && trip.MaksudKegiatan != "" {
		trip.Keperluan = trip.MaksudKegiatan
	}
	if trip.BatasLaporan == "" && trip.TanggalKembali != "" {
		if t, err := time.Parse("2006-01-02", trip.TanggalKembali); err == nil {
			trip.BatasLaporan = t.AddDate(0, 0, 7).Format("2006-01-02")
		}
	}

	if trip.TotalEstimasiBiaya == 0 && len(trip.Costs) > 0 {
		for _, c := range trip.Costs {
			if c.NominalEstimasi == 0 && c.EstimasiBiaya > 0 {
				c.NominalEstimasi = c.EstimasiBiaya
			}
			trip.TotalEstimasiBiaya += c.NominalEstimasi
		}
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
	if trip.BatasLaporan != "" {
		payload["batas_laporan"] = trip.BatasLaporan
	}
	if trip.SumberDana != "" {
		payload["sumber_dana"] = trip.SumberDana
	}
	if trip.RkaBudgetItemID != "" {
		payload["rka_budget_item_id"] = trip.RkaBudgetItemID
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
		if c.NominalEstimasi == 0 && c.EstimasiBiaya > 0 {
			c.NominalEstimasi = c.EstimasiBiaya
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
	if trip.Keperluan == "" && trip.MaksudKegiatan != "" {
		trip.Keperluan = trip.MaksudKegiatan
	}
	payload := map[string]interface{}{
		"tujuan":            trip.Tujuan,
		"keperluan":         trip.Keperluan,
		"tanggal_berangkat": trip.TanggalBerangkat,
		"tanggal_kembali":   trip.TanggalKembali,
	}
	if trip.NomorSuratTugas != "" {
		payload["nomor_surat_tugas"] = trip.NomorSuratTugas
	}
	if trip.TotalEstimasiBiaya > 0 {
		payload["total_estimasi_biaya"] = trip.TotalEstimasiBiaya
	}
	if trip.RkaBudgetItemID != "" {
		payload["rka_budget_item_id"] = trip.RkaBudgetItemID
	}

	err := r.client.Update("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
	if err != nil {
		return nil, err
	}
	return r.FindByID(id)
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
		now := time.Now()
		payload["disetujui_at"] = now
	}
	return r.client.Update("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabaseTripRepository) AddProof(proof *model.TravelProof) error {
	if proof.ID == "" {
		proof.ID = uuid.New().String()
	}
	payload := map[string]interface{}{
		"id":              proof.ID,
		"travel_order_id": proof.TravelOrderID,
		"kategori":        proof.Kategori,
		"file_name":       proof.FileName,
		"file_url":        proof.FileURL,
	}
	if proof.UploadedBy != "" {
		payload["uploaded_by"] = proof.UploadedBy
	}
	return r.client.Insert("travel_proofs", payload, nil)
}

func (r *supabaseTripRepository) SubmitReport(report *model.TravelReport, totalRealisasi float64) error {
	if report.ID == "" {
		report.ID = uuid.New().String()
	}
	reportPayload := map[string]interface{}{
		"id":              report.ID,
		"travel_order_id": report.TravelOrderID,
		"ringkasan_hasil": report.RingkasanHasil,
	}
	if report.FileLaporanURL != "" {
		reportPayload["file_laporan_url"] = report.FileLaporanURL
	}
	_ = r.client.Insert("travel_reports", reportPayload, nil)

	tripPayload := map[string]interface{}{
		"status":                string(model.TripStatusDilaporkan),
		"total_realisasi_biaya": totalRealisasi,
	}
	return r.client.Update("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", report.TravelOrderID),
	}, tripPayload, nil)
}

func (r *supabaseTripRepository) GetRecap() (*model.TripRecap, error) {
	trips, _, err := r.FindAll("", "", 1000, 0)
	if err != nil {
		return nil, err
	}
	return computeTripRecap(trips), nil
}

func (r *supabaseTripRepository) UpdateCosts(id string, costs []*model.TravelCost) error {
	_ = r.client.Delete("travel_costs", map[string]string{
		"travel_order_id": fmt.Sprintf("eq.%s", id),
	})
	var total float64
	for _, c := range costs {
		if c.ID == "" {
			c.ID = uuid.New().String()
		}
		c.TravelOrderID = id
		if c.NominalEstimasi == 0 && c.EstimasiBiaya > 0 {
			c.NominalEstimasi = c.EstimasiBiaya
		}
		total += c.NominalEstimasi
		_ = r.client.Insert("travel_costs", map[string]interface{}{
			"id":               c.ID,
			"travel_order_id":  id,
			"komponen":         c.Komponen,
			"nominal_estimasi": c.NominalEstimasi,
			"keterangan":       c.Keterangan,
		}, nil)
	}
	return r.client.Update("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{
		"total_estimasi_biaya": total,
	}, nil)
}

func (r *supabaseTripRepository) UpdateRealizationCosts(id string, costs []*model.TravelCost) error {
	var total float64
	for _, c := range costs {
		if c.NominalRealisasi == 0 && c.RealisasiBiaya > 0 {
			c.NominalRealisasi = c.RealisasiBiaya
		}
		total += c.NominalRealisasi
		_ = r.client.Update("travel_costs", map[string]string{
			"travel_order_id": fmt.Sprintf("eq.%s", id),
			"komponen":        fmt.Sprintf("eq.%s", c.Komponen),
		}, map[string]interface{}{
			"nominal_realisasi": c.NominalRealisasi,
			"bukti_url":         c.BuktiURL,
			"keterangan":        c.Keterangan,
		}, nil)
	}
	return r.client.Update("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{
		"total_realisasi_biaya": total,
	}, nil)
}

func (r *supabaseTripRepository) ConfirmTrip(id string, actorID string, rkaRepo RkaRepository) (*model.TravelOrder, error) {
	// Panggil Stored Procedure app.confirm_business_trip(p_trip)
	var rpcResult map[string]interface{}
	err := r.client.RPC("confirm_business_trip", map[string]interface{}{
		"p_trip": id,
	}, &rpcResult)
	if err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *supabaseTripRepository) GetCompleteness(id string) (map[string]interface{}, error) {
	trip, err := r.FindByID(id)
	if err != nil {
		return nil, err
	}
	return evaluateTripCompleteness(trip), nil
}

func (r *supabaseTripRepository) GetFlags() ([]map[string]interface{}, error) {
	trips, _, err := r.FindAll("", "", 1000, 0)
	if err != nil {
		return nil, err
	}
	return evaluateTripFlags(trips), nil
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memoryTripRepository struct {
	mu      sync.RWMutex
	trips   map[string]*model.TravelOrder
	members map[string][]*model.TravelMember
	costs   map[string][]*model.TravelCost
	proofs  map[string][]*model.TravelProof
	reports map[string]*model.TravelReport
}

func NewMemoryTripRepository() TripRepository {
	repo := &memoryTripRepository{
		trips:   make(map[string]*model.TravelOrder),
		members: make(map[string][]*model.TravelMember),
		costs:   make(map[string][]*model.TravelCost),
		proofs:  make(map[string][]*model.TravelProof),
		reports: make(map[string]*model.TravelReport),
	}
	repo.seedInitialData()
	return repo
}

func (r *memoryTripRepository) seedInitialData() {
	now := time.Now()
	t1 := &model.TravelOrder{
		ID:                  "trip-001",
		NomorSuratTugas:     "ST/041/FTIK/2025",
		Tujuan:              "Surabaya (Institut Teknologi Sepuluh Nopember)",
		Keperluan:           "Partisipasi & Presentasi Paper Seminar Nasional ICIS 2025",
		TanggalBerangkat:    now.AddDate(0, 0, -10).Format("2006-01-02"),
		TanggalKembali:      now.AddDate(0, 0, -7).Format("2006-01-02"),
		BatasLaporan:        now.AddDate(0, 0, 0).Format("2006-01-02"),
		SumberDana:          "RKA_PRODI",
		RkaBudgetItemID:     "pos-sppd-1",
		Status:              model.TripStatusDilaporkan,
		TotalEstimasiBiaya:  4500000,
		TotalRealisasiBiaya: 4350000,
		DiajukanOleh:        "a0000000-0000-0000-0000-000000000004", // Dosen
		Members: []*model.TravelMember{
			{ID: "m1", TravelOrderID: "trip-001", UserID: "a0000000-0000-0000-0000-000000000004", NamaPeserta: "Ir. Hendra Wijaya, M.Sc.", PeranTugas: "Presenter"},
		},
		Costs: []*model.TravelCost{
			{ID: "c1", TravelOrderID: "trip-001", Komponen: "TRANSPORTASI", NominalEstimasi: 2000000, NominalRealisasi: 1950000},
			{ID: "c2", TravelOrderID: "trip-001", Komponen: "AKOMODASI", NominalEstimasi: 1500000, NominalRealisasi: 1500000},
			{ID: "c3", TravelOrderID: "trip-001", Komponen: "UANG_HARIAN", NominalEstimasi: 1000000, NominalRealisasi: 900000},
		},
		Proofs: []*model.TravelProof{
			{ID: "p1", TravelOrderID: "trip-001", Kategori: "TIKET", FileName: "tiket_kereta_pp.pdf", FileURL: "/uploads/trips/tiket1.pdf"},
			{ID: "p2", TravelOrderID: "trip-001", Kategori: "KUITANSI", FileName: "kuitansi_hotel.pdf", FileURL: "/uploads/trips/hotel1.pdf"},
		},
		Report: &model.TravelReport{
			ID:             "rep1",
			TravelOrderID:  "trip-001",
			RingkasanHasil: "Paper berhasil dipresentasikan dan mendapat sertifikat Best Paper Session.",
			FileLaporanURL: "/uploads/trips/laporan_icis2025.pdf",
			CreatedAt:      now.AddDate(0, 0, -2),
		},
		CreatedAt: now.AddDate(0, 0, -20),
		UpdatedAt: now.AddDate(0, 0, -2),
	}
	r.trips[t1.ID] = t1

	t2 := &model.TravelOrder{
		ID:                  "trip-002",
		NomorSuratTugas:     "ST/045/FTIK/2025",
		Tujuan:              "Jakarta (Kemendikbudristek)",
		Keperluan:           "Konsultasi Akreditasi Program Studi & Kurikulum OBE",
		TanggalBerangkat:    now.AddDate(0, 0, 5).Format("2006-01-02"),
		TanggalKembali:      now.AddDate(0, 0, 7).Format("2006-01-02"),
		BatasLaporan:        now.AddDate(0, 0, 14).Format("2006-01-02"),
		SumberDana:          "RKA_PRODI",
		RkaBudgetItemID:     "pos-sppd-1",
		Status:              model.TripStatusDisetujuiKaprodi,
		TotalEstimasiBiaya:  3200000,
		TotalRealisasiBiaya: 0,
		DiajukanOleh:        "a0000000-0000-0000-0000-000000000001", // Kaprodi
		Members: []*model.TravelMember{
			{ID: "m2", TravelOrderID: "trip-002", UserID: "a0000000-0000-0000-0000-000000000001", NamaPeserta: "Dr. Ahmad Fauzi, M.T.", PeranTugas: "Ketua Delegasi"},
		},
		Costs: []*model.TravelCost{
			{ID: "c4", TravelOrderID: "trip-002", Komponen: "TRANSPORTASI", NominalEstimasi: 1800000},
			{ID: "c5", TravelOrderID: "trip-002", Komponen: "AKOMODASI", NominalEstimasi: 1400000},
		},
		CreatedAt: now.AddDate(0, 0, -3),
		UpdatedAt: now.AddDate(0, 0, -1),
	}
	r.trips[t2.ID] = t2
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
	if end > total {
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
	return t, nil
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
	if trip.TotalEstimasiBiaya == 0 && len(trip.Costs) > 0 {
		for _, c := range trip.Costs {
			if c.NominalEstimasi == 0 && c.EstimasiBiaya > 0 {
				c.NominalEstimasi = c.EstimasiBiaya
			}
			trip.TotalEstimasiBiaya += c.NominalEstimasi
		}
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
	if trip.NomorSuratTugas != "" {
		existing.NomorSuratTugas = trip.NomorSuratTugas
	}
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
		now := time.Now()
		t.DisetujuiAt = &now
	}
	t.UpdatedAt = time.Now()
	return nil
}

func (r *memoryTripRepository) AddProof(proof *model.TravelProof) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.trips[proof.TravelOrderID]
	if !ok {
		return errors.New("perjalanan dinas tidak ditemukan")
	}
	if proof.ID == "" {
		proof.ID = uuid.New().String()
	}
	proof.CreatedAt = time.Now()
	t.Proofs = append(t.Proofs, proof)
	return nil
}

func (r *memoryTripRepository) SubmitReport(report *model.TravelReport, totalRealisasi float64) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.trips[report.TravelOrderID]
	if !ok {
		return errors.New("perjalanan dinas tidak ditemukan")
	}
	if report.ID == "" {
		report.ID = uuid.New().String()
	}
	report.CreatedAt = time.Now()
	t.Report = report
	t.TotalRealisasiBiaya = totalRealisasi
	t.Status = model.TripStatusDilaporkan
	t.UpdatedAt = time.Now()
	return nil
}

func (r *memoryTripRepository) GetRecap() (*model.TripRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]*model.TravelOrder, 0, len(r.trips))
	for _, t := range r.trips {
		list = append(list, t)
	}
	return computeTripRecap(list), nil
}

func (r *memoryTripRepository) UpdateCosts(id string, costs []*model.TravelCost) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.trips[id]
	if !ok {
		return errors.New("perjalanan dinas tidak ditemukan")
	}
	var total float64
	for _, c := range costs {
		if c.ID == "" {
			c.ID = uuid.New().String()
		}
		c.TravelOrderID = id
		if c.NominalEstimasi == 0 && c.EstimasiBiaya > 0 {
			c.NominalEstimasi = c.EstimasiBiaya
		}
		total += c.NominalEstimasi
	}
	t.Costs = costs
	t.TotalEstimasiBiaya = total
	t.UpdatedAt = time.Now()
	return nil
}

func (r *memoryTripRepository) UpdateRealizationCosts(id string, costs []*model.TravelCost) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.trips[id]
	if !ok {
		return errors.New("perjalanan dinas tidak ditemukan")
	}
	var total float64
	for _, c := range costs {
		if c.NominalRealisasi == 0 && c.RealisasiBiaya > 0 {
			c.NominalRealisasi = c.RealisasiBiaya
		}
		total += c.NominalRealisasi
		for _, existing := range t.Costs {
			if existing.Komponen == c.Komponen {
				existing.NominalRealisasi = c.NominalRealisasi
				existing.BuktiURL = c.BuktiURL
				existing.Keterangan = c.Keterangan
			}
		}
	}
	t.TotalRealisasiBiaya = total
	t.UpdatedAt = time.Now()
	return nil
}

func (r *memoryTripRepository) ConfirmTrip(id string, actorID string, rkaRepo RkaRepository) (*model.TravelOrder, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	t, ok := r.trips[id]
	if !ok {
		return nil, errors.New("perjalanan dinas tidak ditemukan")
	}

	// 1. Validasi Status
	if t.Status != model.TripStatusDilaporkan && t.Status != model.TripStatusDisetujui && t.Status != model.TripStatusDisetujuiKaprodi {
		return nil, fmt.Errorf("perjalanan dinas tidak dapat diselesaikan pada status %s", t.Status)
	}

	// 2. Separation of Duties Check
	if actorID != "" {
		if t.DiajukanOleh == actorID {
			return nil, errors.New("pemisahan wewenang dilanggar: pengaju dinas tidak boleh mengonfirmasi perjalanannya sendiri")
		}
		for _, m := range t.Members {
			if m.UserID == actorID {
				return nil, errors.New("pemisahan wewenang dilanggar: pelaksana dinas tidak boleh mengonfirmasi perjalanannya sendiri")
			}
		}
	}

	now := time.Now()
	t.Status = model.TripStatusSelesai
	t.DikonfirmasiOleh = actorID
	t.DikonfirmasiAt = &now
	t.UpdatedAt = now

	// 3. Auto-Realisasi Anggaran ke RKA
	if t.RkaBudgetItemID != "" && rkaRepo != nil {
		realisasiNominal := t.TotalRealisasiBiaya
		if realisasiNominal <= 0 {
			realisasiNominal = t.TotalEstimasiBiaya
		}
		realization := &model.RkaRealization{
			ID:                uuid.New().String(),
			BudgetItemId:      t.RkaBudgetItemID,
			TravelOrderID:     t.ID,
			SumberPencatatan:  "PERJALANAN_DINAS",
			Uraian:            fmt.Sprintf("Realisasi SPPD %s: %s (%s)", t.NomorSuratTugas, t.Tujuan, t.Keperluan),
			Nominal:           realisasiNominal,
			TanggalRealisasi:  now.Format("2006-01-02"),
			BuktiTransaksiURL: "/uploads/trips/bukti_" + t.ID + ".pdf",
		}
		_ = rkaRepo.AddRealization(realization)
	}

	return t, nil
}

func (r *memoryTripRepository) GetCompleteness(id string) (map[string]interface{}, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	t, ok := r.trips[id]
	if !ok {
		return nil, errors.New("perjalanan dinas tidak ditemukan")
	}
	return evaluateTripCompleteness(t), nil
}

func (r *memoryTripRepository) GetFlags() ([]map[string]interface{}, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]*model.TravelOrder, 0, len(r.trips))
	for _, t := range r.trips {
		list = append(list, t)
	}
	return evaluateTripFlags(list), nil
}

// ============================================================
// Helper Functions
// ============================================================

func computeTripRecap(trips []*model.TravelOrder) *model.TripRecap {
	recap := &model.TripRecap{
		TotalPerjalanan:   len(trips),
		StatusDistribusi:  make(map[string]int),
		PerKomponen:       make(map[string]*model.TripComponentSummary),
		RingkasanKomponen: make(map[string]model.TripComponentSummary),
		PerPeserta:        make(map[string]int),
	}

	today := time.Now().Format("2006-01-02")
	for _, t := range trips {
		recap.TotalEstimasi += t.TotalEstimasiBiaya
		recap.TotalEstimasiBiaya += t.TotalEstimasiBiaya
		recap.TotalRealisasi += t.TotalRealisasiBiaya
		recap.TotalRealisasiBiaya += t.TotalRealisasiBiaya
		recap.StatusDistribusi[string(t.Status)]++

		if t.Status == model.TripStatusDisetujui || t.Status == model.TripStatusDisetujuiKaprodi {
			recap.TotalDisetujui++
			recap.BelumLengkapLaporan++
			if t.BatasLaporan != "" && t.BatasLaporan < today {
				recap.LewatTenggatLaporan++
			}
		} else if t.Status == model.TripStatusSelesai {
			recap.TotalSelesai++
		}

		if t.DiajukanOleh != "" {
			recap.PerPeserta[t.DiajukanOleh]++
		}

		for _, c := range t.Costs {
			sum, exists := recap.PerKomponen[c.Komponen]
			if !exists {
				sum = &model.TripComponentSummary{}
				recap.PerKomponen[c.Komponen] = sum
			}
			est := c.NominalEstimasi
			if est == 0 {
				est = c.EstimasiBiaya
			}
			real := c.NominalRealisasi
			if real == 0 {
				real = c.RealisasiBiaya
			}
			sum.Estimasi += est
			sum.Realisasi += real
			sum.Selisih = sum.Estimasi - sum.Realisasi
			recap.RingkasanKomponen[c.Komponen] = *sum
		}
	}
	recap.TotalBiayaDinas = recap.TotalRealisasi
	return recap
}

func evaluateTripCompleteness(t *model.TravelOrder) map[string]interface{} {
	hasReport := t.Report != nil && t.Report.RingkasanHasil != ""
	proofCategories := make(map[string]bool)
	for _, p := range t.Proofs {
		proofCategories[p.Kategori] = true
	}

	hasTicket := proofCategories["TIKET"]
	hasLodging := proofCategories["BUKTI_PENGINAPAN"]
	hasReceipt := proofCategories["KUITANSI"]
	hasPhoto := proofCategories["FOTO_KEGIATAN"]

	isComplete := hasReport && (hasTicket || hasReceipt)

	return map[string]interface{}{
		"trip_id":             t.ID,
		"status":              t.Status,
		"has_report":          hasReport,
		"has_ticket":          hasTicket,
		"has_lodging":         hasLodging,
		"has_receipt":         hasReceipt,
		"has_photo":           hasPhoto,
		"total_proofs":        len(t.Proofs),
		"is_complete":         isComplete,
		"catatan_kelengkapan": t.CatatanKelengkapan,
	}
}

func evaluateTripFlags(trips []*model.TravelOrder) []map[string]interface{} {
	flags := make([]map[string]interface{}, 0)
	today := time.Now().Format("2006-01-02")

	for _, t := range trips {
		// 1. Lewat tenggat pelaporan SPJ (> 7 hari kerja / BatasLaporan lewat)
		if (t.Status == model.TripStatusDisetujui || t.Status == model.TripStatusDisetujuiKaprodi) && t.BatasLaporan != "" && t.BatasLaporan < today {
			flags = append(flags, map[string]interface{}{
				"trip_id":           t.ID,
				"nomor_surat_tugas": t.NomorSuratTugas,
				"tujuan":            t.Tujuan,
				"tipe_flag":         "SPJ_TERLAMBAT",
				"pesan":             "Laporan SPJ belum dikirimkan melewati batas waktu: " + t.BatasLaporan,
				"diajukan_oleh":     t.DiajukanOleh,
			})
		}

		// 2. Realisasi melebihi estimasi anggaran
		if t.TotalRealisasiBiaya > t.TotalEstimasiBiaya && t.TotalEstimasiBiaya > 0 {
			flags = append(flags, map[string]interface{}{
				"trip_id":           t.ID,
				"nomor_surat_tugas": t.NomorSuratTugas,
				"tujuan":            t.Tujuan,
				"tipe_flag":         "REALISASI_MELEBIHI_ESTIMASI",
				"pesan":             fmt.Sprintf("Realisasi (Rp %.0f) melebihi estimasi (Rp %.0f)", t.TotalRealisasiBiaya, t.TotalEstimasiBiaya),
				"diajukan_oleh":     t.DiajukanOleh,
			})
		}

		// 3. Menunggu konfirmasi Admin Prodi
		if t.Status == model.TripStatusDilaporkan {
			flags = append(flags, map[string]interface{}{
				"trip_id":           t.ID,
				"nomor_surat_tugas": t.NomorSuratTugas,
				"tujuan":            t.Tujuan,
				"tipe_flag":         "MENUNGGU_KONFIRMASI_ADMIN",
				"pesan":             "Laporan SPJ telah diajukan, menunggu konfirmasi selesai dari Admin Prodi",
				"diajukan_oleh":     t.DiajukanOleh,
			})
		}
	}
	return flags
}
