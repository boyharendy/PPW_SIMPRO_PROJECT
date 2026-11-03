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

type RkaRepository interface {
	FindAll() ([]*model.RkaDocument, error)
	FindByYear(tahun string) (*model.RkaDocument, error)
	Create(doc *model.RkaDocument) (*model.RkaDocument, error)
	Update(tahun string, doc *model.RkaDocument) (*model.RkaDocument, error)
	AddRealization(realization *model.RkaRealization) error
	GetSerapan(tahun string) (*model.RkaSerapan, error)
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabaseRkaRepository struct {
	client *database.SupabaseClient
}

func NewSupabaseRkaRepository(client *database.SupabaseClient) RkaRepository {
	return &supabaseRkaRepository{client: client}
}

func (r *supabaseRkaRepository) FindAll() ([]*model.RkaDocument, error) {
	var docs []*model.RkaDocument
	err := r.client.Select("rka_documents", map[string]string{
		"order": "tahun_anggaran.desc",
	}, &docs)
	if err != nil {
		return nil, fmt.Errorf("gagal query rka_documents: %w", err)
	}
	return docs, nil
}

func (r *supabaseRkaRepository) FindByYear(tahun string) (*model.RkaDocument, error) {
	var docs []*model.RkaDocument
	err := r.client.Select("rka_documents", map[string]string{
		"tahun_anggaran": fmt.Sprintf("eq.%s", tahun),
		"limit":          "1",
	}, &docs)
	if err != nil || len(docs) == 0 {
		return nil, errors.New("dokumen RKA tidak ditemukan")
	}

	doc := docs[0]
	var activities []*model.RkaActivity
	_ = r.client.Select("rka_activities", map[string]string{
		"rka_id": fmt.Sprintf("eq.%s", doc.ID),
		"order":  "triwulan.asc",
	}, &activities)
	doc.Activities = activities

	var items []*model.RkaBudgetItem
	_ = r.client.Select("rka_budget_items", map[string]string{
		"rka_id": fmt.Sprintf("eq.%s", doc.ID),
		"order":  "kode_mata_anggaran.asc",
	}, &items)

	for _, it := range items {
		it.SisaAnggaran = it.AnggaranAlokasi - it.AnggaranTerpakai
	}
	doc.BudgetItems = items

	var versions []*model.RkaVersion
	_ = r.client.Select("rka_versions", map[string]string{
		"rka_id": fmt.Sprintf("eq.%s", doc.ID),
		"order":  "nomor_versi.desc",
	}, &versions)
	doc.Versions = versions

	doc.SisaAnggaran = doc.PaguTotal - doc.TotalTerpakai
	if doc.PaguTotal > 0 {
		doc.PersentaseSerapan = (doc.TotalTerpakai / doc.PaguTotal) * 100
	}

	return doc, nil
}

func (r *supabaseRkaRepository) Create(doc *model.RkaDocument) (*model.RkaDocument, error) {
	if doc.ID == "" {
		doc.ID = uuid.New().String()
	}
	if doc.Status == "" {
		doc.Status = model.BudgetStatusDraft
	}

	payload := map[string]interface{}{
		"id":             doc.ID,
		"tahun_anggaran": doc.TahunAnggaran,
		"status":         string(doc.Status),
		"pagu_total":     doc.PaguTotal,
		"total_terpakai": doc.TotalTerpakai,
	}

	var inserted []*model.RkaDocument
	if err := r.client.Insert("rka_documents", payload, &inserted); err != nil {
		return nil, fmt.Errorf("gagal membuat dokumen RKA: %w", err)
	}

	for _, act := range doc.Activities {
		if act.ID == "" {
			act.ID = uuid.New().String()
		}
		if act.Triwulan < 1 || act.Triwulan > 4 {
			act.Triwulan = 1
		}
		actPayload := map[string]interface{}{
			"id":                 act.ID,
			"rka_id":             doc.ID,
			"nama_kegiatan":      act.NamaKegiatan,
			"indikator_kinerja":  act.IndikatorKinerja,
			"triwulan":           act.Triwulan,
			"status_pelaksanaan": "BELUM_TERLAKSANA",
		}
		_ = r.client.Insert("rka_activities", actPayload, nil)
	}

	for _, item := range doc.BudgetItems {
		if item.ID == "" {
			item.ID = uuid.New().String()
		}
		if item.Triwulan < 1 || item.Triwulan > 4 {
			item.Triwulan = 1
		}
		itemPayload := map[string]interface{}{
			"id":                 item.ID,
			"rka_id":             doc.ID,
			"kode_mata_anggaran": item.KodeMataAnggaran,
			"nama_kegiatan":      item.NamaKegiatan,
			"kategori":           item.Kategori,
			"triwulan":           item.Triwulan,
			"anggaran_alokasi":   item.AnggaranAlokasi,
			"anggaran_terpakai":  0,
		}
		if item.SumberDana != "" {
			itemPayload["sumber_dana"] = item.SumberDana
		}
		_ = r.client.Insert("rka_budget_items", itemPayload, nil)
	}

	doc.Versions = []*model.RkaVersion{
		{
			ID:               uuid.New().String(),
			RkaID:            doc.ID,
			NomorVersi:       1,
			CatatanPerubahan: "Penyusunan RKA awal tahun anggaran " + doc.TahunAnggaran,
			CreatedAt:        time.Now(),
		},
	}

	doc.CreatedAt = time.Now()
	doc.UpdatedAt = time.Now()
	return doc, nil
}

func (r *supabaseRkaRepository) Update(tahun string, doc *model.RkaDocument) (*model.RkaDocument, error) {
	payload := map[string]interface{}{
		"pagu_total": doc.PaguTotal,
		"status":     string(doc.Status),
	}
	err := r.client.Update("rka_documents", map[string]string{
		"tahun_anggaran": fmt.Sprintf("eq.%s", tahun),
	}, payload, nil)
	if err != nil {
		return nil, err
	}

	existing, err := r.FindByYear(tahun)
	if err == nil && existing != nil {
		nextVer := len(existing.Versions) + 1
		catatan := doc.CatatanRevisi
		if catatan == "" {
			catatan = fmt.Sprintf("Revisi dokumen RKA versi %d", nextVer)
		}
		_ = r.client.Insert("rka_versions", map[string]interface{}{
			"id":                uuid.New().String(),
			"rka_id":            existing.ID,
			"nomor_versi":       nextVer,
			"catatan_perubahan": catatan,
		}, nil)
	}

	return r.FindByYear(tahun)
}

func (r *supabaseRkaRepository) AddRealization(realization *model.RkaRealization) error {
	if realization.ID == "" {
		realization.ID = uuid.New().String()
	}
	payload := map[string]interface{}{
		"id":                realization.ID,
		"budget_item_id":    realization.BudgetItemId,
		"uraian":            realization.Uraian,
		"nominal":           realization.Nominal,
		"tanggal_realisasi": realization.TanggalRealisasi,
	}
	if realization.TravelOrderID != "" {
		payload["travel_order_id"] = realization.TravelOrderID
		payload["sumber_pencatatan"] = "PERJALANAN_DINAS"
	}
	return r.client.Insert("rka_realizations", payload, nil)
}

func (r *supabaseRkaRepository) GetSerapan(tahun string) (*model.RkaSerapan, error) {
	doc, err := r.FindByYear(tahun)
	if err != nil {
		return nil, err
	}
	return computeRkaSerapan(doc), nil
}

func computeRkaSerapan(doc *model.RkaDocument) *model.RkaSerapan {
	serapanPerKegiatan := make(map[string]float64)
	serapanPerPos := make(map[string]float64)
	serapanPerTriwulan := map[string]float64{
		"TW1": 0,
		"TW2": 0,
		"TW3": 0,
		"TW4": 0,
	}
	paguTriwulan := map[int]float64{}
	realTriwulan := map[int]float64{}

	for _, item := range doc.BudgetItems {
		pct := 0.0
		if item.AnggaranAlokasi > 0 {
			pct = (item.AnggaranTerpakai / item.AnggaranAlokasi) * 100
		}
		serapanPerPos[item.KodeMataAnggaran] = pct
		if item.NamaKegiatan != "" {
			serapanPerKegiatan[item.NamaKegiatan] = pct
		}
		tw := item.Triwulan
		if tw < 1 || tw > 4 {
			tw = 1
		}
		paguTriwulan[tw] += item.AnggaranAlokasi
		realTriwulan[tw] += item.AnggaranTerpakai
	}

	for tw := 1; tw <= 4; tw++ {
		key := fmt.Sprintf("TW%d", tw)
		if paguTriwulan[tw] > 0 {
			serapanPerTriwulan[key] = (realTriwulan[tw] / paguTriwulan[tw]) * 100
		}
	}

	today := time.Now().Format("2006-01-02")
	overdueCount := 0
	for _, act := range doc.Activities {
		if act.StatusPelaksanaan != "TERLAKSANA" && act.JadwalSelesai != "" && act.JadwalSelesai < today {
			overdueCount++
		}
	}

	return &model.RkaSerapan{
		TahunAnggaran:          doc.TahunAnggaran,
		PaguTotal:              doc.PaguTotal,
		TotalTerpakai:          doc.TotalTerpakai,
		SisaAnggaran:           doc.SisaAnggaran,
		PersentaseSerapan:      doc.PersentaseSerapan,
		SerapanPerKegiatan:     serapanPerKegiatan,
		SerapanPerPos:          serapanPerPos,
		SerapanPerTriwulan:     serapanPerTriwulan,
		KegiatanMelewatiJadwal: overdueCount,
	}
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memoryRkaRepository struct {
	mu           sync.RWMutex
	docs         map[string]*model.RkaDocument
	realizations map[string][]*model.RkaRealization
}

func NewMemoryRkaRepository() RkaRepository {
	return &memoryRkaRepository{
		docs:         make(map[string]*model.RkaDocument),
		realizations: make(map[string][]*model.RkaRealization),
	}
}

func (r *memoryRkaRepository) FindAll() ([]*model.RkaDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	res := make([]*model.RkaDocument, 0, len(r.docs))
	for _, d := range r.docs {
		res = append(res, d)
	}
	return res, nil
}

func (r *memoryRkaRepository) FindByYear(tahun string) (*model.RkaDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	d, ok := r.docs[tahun]
	if !ok {
		return nil, errors.New("dokumen RKA tidak ditemukan")
	}
	return d, nil
}

func (r *memoryRkaRepository) Create(doc *model.RkaDocument) (*model.RkaDocument, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if doc.ID == "" {
		doc.ID = uuid.New().String()
	}
	for _, item := range doc.BudgetItems {
		if item.ID == "" {
			item.ID = uuid.New().String()
		}
		item.RkaID = doc.ID
		item.SisaAnggaran = item.AnggaranAlokasi - item.AnggaranTerpakai
	}
	doc.SisaAnggaran = doc.PaguTotal - doc.TotalTerpakai
	if doc.PaguTotal > 0 {
		doc.PersentaseSerapan = (doc.TotalTerpakai / doc.PaguTotal) * 100
	}
	doc.Versions = []*model.RkaVersion{
		{
			ID:               uuid.New().String(),
			RkaID:            doc.ID,
			NomorVersi:       1,
			CatatanPerubahan: "Penyusunan RKA awal tahun anggaran " + doc.TahunAnggaran,
			CreatedAt:        time.Now(),
		},
	}
	doc.CreatedAt = time.Now()
	doc.UpdatedAt = time.Now()
	r.docs[doc.TahunAnggaran] = doc
	return doc, nil
}

func (r *memoryRkaRepository) Update(tahun string, doc *model.RkaDocument) (*model.RkaDocument, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	existing, ok := r.docs[tahun]
	if !ok {
		return nil, errors.New("dokumen RKA tidak ditemukan")
	}
	existing.PaguTotal = doc.PaguTotal
	existing.Status = doc.Status
	if len(doc.BudgetItems) > 0 {
		existing.BudgetItems = doc.BudgetItems
	}
	if len(doc.Activities) > 0 {
		existing.Activities = doc.Activities
	}
	nextVer := len(existing.Versions) + 1
	catatan := doc.CatatanRevisi
	if catatan == "" {
		catatan = fmt.Sprintf("Revisi dokumen RKA versi %d", nextVer)
	}
	existing.Versions = append(existing.Versions, &model.RkaVersion{
		ID:               uuid.New().String(),
		RkaID:            existing.ID,
		NomorVersi:       nextVer,
		CatatanPerubahan: catatan,
		CreatedAt:        time.Now(),
	})
	existing.UpdatedAt = time.Now()
	return existing, nil
}

func (r *memoryRkaRepository) AddRealization(realization *model.RkaRealization) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if realization.ID == "" {
		realization.ID = uuid.New().String()
	}
	realization.CreatedAt = time.Now()
	r.realizations[realization.BudgetItemId] = append(r.realizations[realization.BudgetItemId], realization)

	// Update budget item terpakai & document total
	for _, d := range r.docs {
		for _, item := range d.BudgetItems {
			if item.ID == realization.BudgetItemId {
				item.AnggaranTerpakai += realization.Nominal
				item.SisaAnggaran = item.AnggaranAlokasi - item.AnggaranTerpakai
				d.TotalTerpakai += realization.Nominal
				d.SisaAnggaran = d.PaguTotal - d.TotalTerpakai
				if d.PaguTotal > 0 {
					d.PersentaseSerapan = (d.TotalTerpakai / d.PaguTotal) * 100
				}
				return nil
			}
		}
	}
	return nil
}

func (r *memoryRkaRepository) GetSerapan(tahun string) (*model.RkaSerapan, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	d, ok := r.docs[tahun]
	if !ok {
		return nil, errors.New("dokumen RKA tidak ditemukan")
	}
	return computeRkaSerapan(d), nil
}
