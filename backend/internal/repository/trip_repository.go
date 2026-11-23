package repository

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
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
	UpdateStatus(id string, status model.TravelStatus, approverID string, decision *model.TripDecision) error
	AddProof(proof *model.TravelProof) error
	SubmitReport(report *model.TravelReport, totalRealisasi float64) error
	GetRecap() (*model.TripRecap, error)

	// PRD Milestone 2 Methods
	UpdateCosts(id string, costs []*model.TravelCost) error
	UpdateRealizationCosts(id string, costs []*model.TravelCost) error
	ConfirmTrip(id string, actorID string, rkaRepo RkaRepository) (*model.TravelOrder, error)
	MarkIncomplete(id, note string) error
	GetCompleteness(id string) (map[string]interface{}, error)
	GetFlags() ([]map[string]interface{}, error)
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabaseTripRepository struct {
	client database.Store
}

func NewSupabaseTripRepository(client database.Store) TripRepository {
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
	if _, scoped := r.client.(*database.TxStore); userID != "" && scoped {
		params["trip_participant"] = userID
		countParams["trip_participant"] = userID
	} else if userID != "" {
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

	if store, ok := r.client.(*database.TxStore); ok && store.InternalRequest && len(trips) > 0 {
		var ids []string
		byID := map[string]*model.TravelOrder{}
		for _, t := range trips {
			ids = append(ids, t.ID)
			byID[t.ID] = t
		}
		filters := map[string]string{"travel_order_id": "in.(" + strings.Join(ids, ",") + ")"}
		var members []*model.TravelMember
		var costs []*model.TravelCost
		if err = r.client.Select("travel_members", filters, &members); err != nil {
			return nil, 0, err
		}
		if err = r.client.Select("travel_costs", filters, &costs); err != nil {
			return nil, 0, err
		}
		for _, m := range members {
			byID[m.TravelOrderID].Members = append(byID[m.TravelOrderID].Members, m)
		}
		for _, c := range costs {
			byID[c.TravelOrderID].Costs = append(byID[c.TravelOrderID].Costs, c)
		}
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

	if err := r.insertMembers(trip.ID, trip.Members); err != nil {
		return nil, err
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
			"keterangan":       c.Keterangan,
		}
		if err := r.client.Insert("travel_costs", cPayload, nil); err != nil {
			return nil, err
		}
	}

	trip.CreatedAt = time.Now()
	trip.UpdatedAt = time.Now()
	return trip, nil
}

func (r *supabaseTripRepository) insertMembers(trip string, members []*model.TravelMember) error {
	for _, m := range members {
		m.ID = uuid.NewString()
		err := r.client.Insert("travel_members", map[string]any{
			"id": m.ID, "travel_order_id": trip, "user_id": m.UserID, "peran_tugas": m.PeranTugas,
		}, nil)
		if err != nil {
			return err
		}
	}
	return nil
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
	if trip.SumberDana != "" {
		payload["sumber_dana"] = trip.SumberDana
		payload["rka_budget_item_id"] = nil
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
	if trip.Members != nil {
		if err := r.client.Delete("travel_members", map[string]string{"travel_order_id": "eq." + id}); err != nil {
			return nil, err
		}
		if err := r.insertMembers(id, trip.Members); err != nil {
			return nil, err
		}
	}
	return r.FindByID(id)
}

func (r *supabaseTripRepository) Delete(id string) error {
	return r.client.Delete("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	})
}

func (r *supabaseTripRepository) UpdateStatus(id string, status model.TravelStatus, approverID string, decision *model.TripDecision) error {
	payload := map[string]interface{}{
		"status": string(status),
	}
	if decision != nil {
		payload["catatan_keputusan"] = decision.Catatan
		if status == model.TripStatusDisetujuiKaprodi && decision.SuratTugas != "" {
			payload["nomor_surat_tugas"] = decision.SuratTugas
		}
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
	filter := map[string]string{"travel_order_id": "eq." + report.TravelOrderID}
	count, err := r.client.Count("travel_reports", filter)
	if err != nil {
		return err
	}
	if count > 0 {
		delete(reportPayload, "id")
		delete(reportPayload, "travel_order_id")
		err = r.client.Update("travel_reports", filter, reportPayload, nil)
	} else {
		err = r.client.Insert("travel_reports", reportPayload, nil)
	}
	if err != nil {
		return err
	}

	tripPayload := map[string]interface{}{
		"status":                string(model.TripStatusDilaporkan),
		"total_realisasi_biaya": totalRealisasi,
	}
	return r.client.Update("travel_orders", map[string]string{
		"id": fmt.Sprintf("eq.%s", report.TravelOrderID),
	}, tripPayload, nil)
}

func (r *supabaseTripRepository) GetRecap() (*model.TripRecap, error) {
	var trips []*model.TravelOrder
	err := r.client.Select("travel_orders", nil, &trips)
	if err == nil {
		var costs []*model.TravelCost
		err = r.client.Select("travel_costs", nil, &costs)
		byTrip := make(map[string]*model.TravelOrder, len(trips))
		for _, t := range trips {
			byTrip[t.ID] = t
		}
		for _, c := range costs {
			if t := byTrip[c.TravelOrderID]; t != nil {
				t.Costs = append(t.Costs, c)
			}
		}
		if err == nil {
			var members []*model.TravelMember
			err = r.client.Select("travel_members", nil, &members)
			for _, m := range members {
				if t := byTrip[m.TravelOrderID]; t != nil {
					t.Members = append(t.Members, m)
				}
			}
		}
	}
	if err != nil {
		return nil, err
	}
	return computeTripRecap(trips), nil
}

func (r *supabaseTripRepository) UpdateCosts(id string, costs []*model.TravelCost) error {
	return r.replaceCosts(id, costs, false)
}
func (r *supabaseTripRepository) UpdateRealizationCosts(id string, costs []*model.TravelCost) error {
	return r.replaceCosts(id, costs, true)
}
func (r *supabaseTripRepository) replaceCosts(id string, costs []*model.TravelCost, actual bool) error {
	s, ok := r.client.(*database.TxStore)
	if !ok {
		return errors.New("transaksi biaya diperlukan")
	}
	data, err := json.Marshal(costs)
	if err != nil {
		return err
	}
	_, err = s.Tx.Exec(s.Ctx, "select app.save_trip_costs($1,$2::jsonb,$3)", id, data, actual)
	return err
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
		if userID != "" && !t.Participant(userID) {
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
	if trip.Members != nil {
		existing.Members = trip.Members
	}
	existing.Tujuan = trip.Tujuan
	existing.Keperluan = trip.Keperluan
	existing.TanggalBerangkat = trip.TanggalBerangkat
	existing.TanggalKembali = trip.TanggalKembali

	if trip.SumberDana != "" {
		existing.SumberDana = trip.SumberDana
		existing.RkaBudgetItemID = trip.RkaBudgetItemID
	} else if trip.RkaBudgetItemID != "" {
		existing.RkaBudgetItemID = trip.RkaBudgetItemID
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

func (r *memoryTripRepository) UpdateStatus(id string, status model.TravelStatus, approverID string, decision *model.TripDecision) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.trips[id]
	if !ok {
		return errors.New("perjalanan dinas tidak ditemukan")
	}
	t.Status = status
	if decision != nil {
		t.CatatanKeputusan = decision.Catatan
		if status == model.TripStatusDisetujuiKaprodi && decision.SuratTugas != "" {
			t.NomorSuratTugas = decision.SuratTugas
		}
	}
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
	if !t.Draft() {
		return errors.New("perjalanan bukan draf")
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
	if !t.Approved() {
		return errors.New("perjalanan belum disetujui")
	}
	byComponent := map[string]*model.TravelCost{}
	for _, c := range t.Costs {
		byComponent[c.Komponen] = c
	}
	for _, c := range costs {
		if byComponent[c.Komponen] == nil {
			return errors.New("komponen tidak ada dalam estimasi")
		}
	}
	for _, c := range costs {
		row := byComponent[c.Komponen]
		row.NominalRealisasi = c.NominalRealisasi
		row.RealisasiDiisi = true
		row.Keterangan = c.Keterangan
		row.BuktiURL = c.BuktiURL
	}
	t.TotalRealisasiBiaya = 0
	for _, c := range t.Costs {
		t.TotalRealisasiBiaya += c.NominalRealisasi
	}
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
	if t.Status != model.TripStatusDilaporkan {
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

	if evaluateTripCompleteness(t)["is_complete"] != true {
		return nil, errors.New("bukti atau laporan belum lengkap")
	}
	now := time.Now()

	// 3. Auto-Realisasi Anggaran ke RKA
	if (t.SumberDana == "RKA_PRODI" || t.SumberDana == "RKA" || t.SumberDana == "RKAT_PRODI") && t.RkaBudgetItemID != "" && rkaRepo != nil {
		realisasiNominal := t.TotalRealisasiBiaya
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
		if err := rkaRepo.AddRealization(realization); err != nil {
			return nil, err
		}
	}
	t.Status = model.TripStatusSelesai
	t.DikonfirmasiOleh = actorID
	t.DikonfirmasiAt = &now
	t.UpdatedAt = now

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

		participants := map[string]bool{}
		for _, member := range t.Members {
			if member.UserID != "" {
				participants[member.UserID] = true
			}
		}
		if len(participants) == 0 && t.DiajukanOleh != "" {
			participants[t.DiajukanOleh] = true
		}
		for id := range participants {
			recap.PerPeserta[id]++
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

	completeCosts := len(t.Costs) > 0
	for _, cost := range t.Costs {
		if !cost.RealisasiDiisi {
			completeCosts = false
			break
		}
		if cost.NominalRealisasi == 0 {
			continue
		}
		if !hasReceipt && !(cost.Komponen == "TRANSPORTASI" && hasTicket) && !(cost.Komponen == "AKOMODASI" && hasLodging) {
			completeCosts = false
			break
		}
	}
	isComplete := hasReport && hasPhoto && completeCosts

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

func (r *memoryTripRepository) MarkIncomplete(id, note string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t := r.trips[id]
	if t == nil || t.Status != model.TripStatusDilaporkan {
		return errors.New("laporan tidak tersedia")
	}
	t.CatatanKelengkapan = note
	t.Status = model.TripStatusDisetujuiKaprodi
	return nil
}
func (r *supabaseTripRepository) MarkIncomplete(id, note string) error {
	return r.client.Update("travel_orders", map[string]string{"id": "eq." + id, "status": "eq.DILAPORKAN"}, map[string]any{"catatan_kelengkapan": note, "status": model.TripStatusDisetujuiKaprodi}, nil)
}
