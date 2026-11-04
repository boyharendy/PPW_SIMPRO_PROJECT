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
	var items []*model.RkaBudgetItem
	_ = r.client.Select("rka_budget_items", map[string]string{
		"rka_id": fmt.Sprintf("eq.%s", doc.ID),
		"order":  "kode_mata_anggaran.asc",
	}, &items)

	for _, it := range items {
		it.SisaAnggaran = it.AnggaranAlokasi - it.AnggaranTerpakai
	}
	doc.BudgetItems = items
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

	for _, item := range doc.BudgetItems {
		if item.ID == "" {
			item.ID = uuid.New().String()
		}
		itemPayload := map[string]interface{}{
			"id":                 item.ID,
			"rka_id":             doc.ID,
			"kode_mata_anggaran": item.KodeMataAnggaran,
			"nama_kegiatan":      item.NamaKegiatan,
			"kategori":           item.Kategori,
			"anggaran_alokasi":   item.AnggaranAlokasi,
			"anggaran_terpakai":  0,
		}
		_ = r.client.Insert("rka_budget_items", itemPayload, nil)
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
	}
	return r.client.Insert("rka_realizations", payload, nil)
}

func (r *supabaseRkaRepository) GetSerapan(tahun string) (*model.RkaSerapan, error) {
	doc, err := r.FindByYear(tahun)
	if err != nil {
		return nil, err
	}
	return &model.RkaSerapan{
		TahunAnggaran:     doc.TahunAnggaran,
		PaguTotal:         doc.PaguTotal,
		TotalTerpakai:     doc.TotalTerpakai,
		SisaAnggaran:      doc.SisaAnggaran,
		PersentaseSerapan: doc.PersentaseSerapan,
	}, nil
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
	return &model.RkaSerapan{
		TahunAnggaran:     d.TahunAnggaran,
		PaguTotal:         d.PaguTotal,
		TotalTerpakai:     d.TotalTerpakai,
		SisaAnggaran:      d.SisaAnggaran,
		PersentaseSerapan: d.PersentaseSerapan,
	}, nil
}
