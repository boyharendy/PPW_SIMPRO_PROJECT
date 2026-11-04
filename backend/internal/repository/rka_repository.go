package repository

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/google/uuid"
	"simpro-backend/internal/database"
	"simpro-backend/internal/model"
)

type RkaRepository interface {
	FindAll() ([]*model.RkaDocument, error)
	FindByYear(tahun string) (*model.RkaDocument, error)
	FindByID(id string) (*model.RkaDocument, error)
	Create(doc *model.RkaDocument) (*model.RkaDocument, error)
	Update(tahun string, doc *model.RkaDocument) (*model.RkaDocument, error)
	AddRealization(realization *model.RkaRealization) error
	GetSerapan(tahun string) (*model.RkaSerapan, error)

	// PRD Milestone 2 Methods
	GetWorkingVersion(rkaIDOrYear string) (*model.RkaVersion, error)
	UpdateWorkingVersion(rkaIDOrYear string, ifMatchVersion int, payload map[string]interface{}) (*model.RkaVersion, error)
	SubmitWorkingVersion(rkaIDOrYear string) error
	GetVersionDiff(rkaIDOrYear string, nomorVersi int) (map[string]interface{}, error)
	DecideVersion(rkaIDOrYear string, nomorVersi int, approved bool, actorID string) error
	CloseRka(rkaIDOrYear string) error
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

func (r *supabaseRkaRepository) FindByID(id string) (*model.RkaDocument, error) {
	var docs []*model.RkaDocument
	err := r.client.Select("rka_documents", map[string]string{
		"id":    fmt.Sprintf("eq.%s", id),
		"limit": "1",
	}, &docs)
	if err != nil || len(docs) == 0 {
		return nil, errors.New("dokumen RKA tidak ditemukan")
	}
	doc := docs[0]
	r.loadRelations(doc)
	return doc, nil
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
	r.loadRelations(doc)
	return doc, nil
}

func (r *supabaseRkaRepository) loadRelations(doc *model.RkaDocument) {
	var activities []*model.RkaActivity
	_ = r.client.Select("rka_activities", map[string]string{
		"rka_id": fmt.Sprintf("eq.%s", doc.ID),
		"order":  "triwulan.asc",
	}, &activities)

	var items []*model.RkaBudgetItem
	_ = r.client.Select("rka_budget_items", map[string]string{
		"rka_id": fmt.Sprintf("eq.%s", doc.ID),
		"order":  "kode_mata_anggaran.asc",
	}, &items)

	var versions []*model.RkaVersion
	_ = r.client.Select("rka_versions", map[string]string{
		"rka_id": fmt.Sprintf("eq.%s", doc.ID),
		"order":  "nomor_versi.asc",
	}, &versions)

	doc.Activities = activities
	doc.BudgetItems = items
	doc.Versions = versions
	doc.SisaAnggaran = doc.PaguTotal - doc.TotalTerpakai
	if doc.PaguTotal > 0 {
		doc.PersentaseSerapan = (doc.TotalTerpakai / doc.PaguTotal) * 100
	}
}

func (r *supabaseRkaRepository) Create(doc *model.RkaDocument) (*model.RkaDocument, error) {
	if doc.ID == "" {
		doc.ID = uuid.New().String()
	}

	docPayload := map[string]interface{}{
		"id":             doc.ID,
		"tahun_anggaran": doc.TahunAnggaran,
		"status":         string(doc.Status),
		"pagu_total":     doc.PaguTotal,
		"total_terpakai": 0,
	}
	if doc.Judul != "" {
		docPayload["judul"] = doc.Judul
	}

	var inserted []*model.RkaDocument
	err := r.client.Insert("rka_documents", docPayload, &inserted)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat dokumen RKA: %w", err)
	}

	for _, act := range doc.Activities {
		if act.ID == "" {
			act.ID = uuid.New().String()
		}
		actPayload := map[string]interface{}{
			"id":                 act.ID,
			"rka_id":             doc.ID,
			"nama_kegiatan":      act.NamaKegiatan,
			"indikator_kinerja":  act.IndikatorKinerja,
			"triwulan":           act.Triwulan,
			"status_pelaksanaan": "BELUM_TERLAKSANA",
			"is_active":          true,
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
			"is_active":          true,
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
			Status:           "DISETUJUI",
			RowVersion:       1,
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
			catatan = fmt.Sprintf("Revisi RKA tahun %s versi %d", tahun, nextVer)
		}
		verPayload := map[string]interface{}{
			"rka_id":            existing.ID,
			"nomor_versi":       nextVer,
			"status":            "DRAFT",
			"row_version":       1,
			"catatan_perubahan": catatan,
		}
		_ = r.client.Insert("rka_versions", verPayload, nil)
	}
	return existing, nil
}

func (r *supabaseRkaRepository) AddRealization(realization *model.RkaRealization) error {
	payload := map[string]interface{}{
		"budget_item_id":    realization.BudgetItemId,
		"uraian":            realization.Uraian,
		"nominal":           realization.Nominal,
		"tanggal_realisasi": realization.TanggalRealisasi,
	}
	if realization.TravelOrderID != "" {
		payload["travel_order_id"] = realization.TravelOrderID
		payload["sumber_pencatatan"] = "PERJALANAN_DINAS"
	}
	if realization.BuktiTransaksiURL != "" {
		payload["bukti_transaksi_url"] = realization.BuktiTransaksiURL
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

func (r *supabaseRkaRepository) GetWorkingVersion(rkaIDOrYear string) (*model.RkaVersion, error) {
	doc, err := r.resolveDoc(rkaIDOrYear)
	if err != nil {
		return nil, err
	}

	var versions []*model.RkaVersion
	_ = r.client.Select("rka_versions", map[string]string{
		"rka_id": fmt.Sprintf("eq.%s", doc.ID),
		"status": "in.(DRAFT,DIAJUKAN)",
		"order":  "nomor_versi.desc",
		"limit":  "1",
	}, &versions)

	if len(versions) > 0 {
		return versions[0], nil
	}

	// Buat draf versi baru jika belum ada
	nextVer := len(doc.Versions) + 1
	newVer := &model.RkaVersion{
		ID:               uuid.New().String(),
		RkaID:            doc.ID,
		NomorVersi:       nextVer,
		Status:           "DRAFT",
		RowVersion:       1,
		CatatanPerubahan: fmt.Sprintf("Draf revisi versi %d", nextVer),
		CreatedAt:        time.Now(),
	}
	_ = r.client.Insert("rka_versions", map[string]interface{}{
		"id":                newVer.ID,
		"rka_id":            newVer.RkaID,
		"nomor_versi":       newVer.NomorVersi,
		"status":            newVer.Status,
		"row_version":       newVer.RowVersion,
		"catatan_perubahan": newVer.CatatanPerubahan,
	}, nil)

	return newVer, nil
}

func (r *supabaseRkaRepository) UpdateWorkingVersion(rkaIDOrYear string, ifMatchVersion int, payload map[string]interface{}) (*model.RkaVersion, error) {
	ver, err := r.GetWorkingVersion(rkaIDOrYear)
	if err != nil {
		return nil, err
	}

	// Optimistic Locking Check
	if ifMatchVersion > 0 && ifMatchVersion != ver.RowVersion {
		return nil, errors.New("konflik versi kerja: data telah diperbarui oleh pengguna lain (precondition failed)")
	}

	ver.RowVersion++
	ver.DraftPayload = payload
	ver.Status = "DRAFT"

	updatePayload := map[string]interface{}{
		"row_version":   ver.RowVersion,
		"draft_payload": payload,
		"status":        ver.Status,
	}
	if cat, ok := payload["catatan_perubahan"].(string); ok && cat != "" {
		updatePayload["catatan_perubahan"] = cat
		ver.CatatanPerubahan = cat
	}

	err = r.client.Update("rka_versions", map[string]string{
		"id": fmt.Sprintf("eq.%s", ver.ID),
	}, updatePayload, nil)
	if err != nil {
		return nil, err
	}

	return ver, nil
}

func (r *supabaseRkaRepository) SubmitWorkingVersion(rkaIDOrYear string) error {
	ver, err := r.GetWorkingVersion(rkaIDOrYear)
	if err != nil {
		return err
	}
	ver.Status = "DIAJUKAN"
	return r.client.Update("rka_versions", map[string]string{
		"id": fmt.Sprintf("eq.%s", ver.ID),
	}, map[string]interface{}{
		"status": "DIAJUKAN",
	}, nil)
}

func (r *supabaseRkaRepository) GetVersionDiff(rkaIDOrYear string, nomorVersi int) (map[string]interface{}, error) {
	doc, err := r.resolveDoc(rkaIDOrYear)
	if err != nil {
		return nil, err
	}

	var versions []*model.RkaVersion
	_ = r.client.Select("rka_versions", map[string]string{
		"rka_id":      fmt.Sprintf("eq.%s", doc.ID),
		"nomor_versi": fmt.Sprintf("eq.%d", nomorVersi),
		"limit":       "1",
	}, &versions)

	if len(versions) == 0 {
		return nil, errors.New("versi RKA tidak ditemukan")
	}

	targetVer := versions[0]
	return computeVersionDiff(doc, targetVer), nil
}

func (r *supabaseRkaRepository) DecideVersion(rkaIDOrYear string, nomorVersi int, approved bool, actorID string) error {
	doc, err := r.resolveDoc(rkaIDOrYear)
	if err != nil {
		return err
	}

	var versions []*model.RkaVersion
	_ = r.client.Select("rka_versions", map[string]string{
		"rka_id":      fmt.Sprintf("eq.%s", doc.ID),
		"nomor_versi": fmt.Sprintf("eq.%d", nomorVersi),
		"limit":       "1",
	}, &versions)

	if len(versions) == 0 {
		return errors.New("versi RKA tidak ditemukan")
	}
	targetVer := versions[0]

	if !approved {
		return r.client.Update("rka_versions", map[string]string{
			"id": fmt.Sprintf("eq.%s", targetVer.ID),
		}, map[string]interface{}{
			"status": "DITOLAK",
		}, nil)
	}

	// Panggil Stored Procedure app.apply_rka_version(targetVer.ID)
	var rpcResult map[string]interface{}
	err = r.client.RPC("apply_rka_version", map[string]interface{}{
		"p_version": targetVer.ID,
	}, &rpcResult)
	return err
}

func (r *supabaseRkaRepository) CloseRka(rkaIDOrYear string) error {
	doc, err := r.resolveDoc(rkaIDOrYear)
	if err != nil {
		return err
	}
	return r.client.Update("rka_documents", map[string]string{
		"id": fmt.Sprintf("eq.%s", doc.ID),
	}, map[string]interface{}{
		"status": "DITUTUP",
	}, nil)
}

func (r *supabaseRkaRepository) resolveDoc(rkaIDOrYear string) (*model.RkaDocument, error) {
	doc, err := r.FindByYear(rkaIDOrYear)
	if err == nil && doc != nil {
		return doc, nil
	}
	return r.FindByID(rkaIDOrYear)
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
	repo := &memoryRkaRepository{
		docs:         make(map[string]*model.RkaDocument),
		realizations: make(map[string][]*model.RkaRealization),
	}
	repo.seedInitialData()
	return repo
}

func (r *memoryRkaRepository) seedInitialData() {
	doc2025 := &model.RkaDocument{
		ID:                "rka-2025-uuid",
		TahunAnggaran:     "2025",
		Judul:             "RKA Program Studi Sistem Informasi 2025",
		Status:            model.BudgetStatusAktif,
		PaguTotal:         250000000,
		TotalTerpakai:     187500000,
		SisaAnggaran:      62500000,
		PersentaseSerapan: 75.0,
		Activities: []*model.RkaActivity{
			{
				ID:                "act-1",
				RkaID:             "rka-2025-uuid",
				NamaKegiatan:      "Peningkatan Kompetensi Dosen & Partisipasi Ilmiah Nasional",
				IndikatorKinerja:  "Jumlah keikutsertaan konferensi dan publikasi terindeks",
				Triwulan:          2,
				StatusPelaksanaan: "TERLAKSANA",
				IsActive:          true,
			},
			{
				ID:                "act-2",
				RkaID:             "rka-2025-uuid",
				NamaKegiatan:      "Review RPS, Lokakarya Kurikulum & Pemutakhiran CPMK",
				IndikatorKinerja:  "100% dokumen RPS terbarui sesuai standar SPMI",
				Triwulan:          1,
				StatusPelaksanaan: "TERLAKSANA",
				IsActive:          true,
			},
		},
		BudgetItems: []*model.RkaBudgetItem{
			{
				ID:               "pos-sppd-1",
				RkaID:            "rka-2025-uuid",
				KodeMataAnggaran: "5.2.1",
				NamaKegiatan:     "Perjalanan Dinas Dosen & Konferensi Ilmiah",
				Kategori:         "OPERASIONAL",
				SumberDana:       "RKAT_UNIVERSITAS",
				Triwulan:         2,
				AnggaranAlokasi:  85000000,
				AnggaranTerpakai: 62500000,
				SisaAnggaran:     22500000,
				IsActive:         true,
			},
			{
				ID:               "pos-kurikulum-2",
				RkaID:            "rka-2025-uuid",
				KodeMataAnggaran: "5.2.2",
				NamaKegiatan:     "Lokakarya Kurikulum & SPMI Pembelajaran",
				Kategori:         "PENGEMBANGAN",
				SumberDana:       "RKAT_UNIVERSITAS",
				Triwulan:         1,
				AnggaranAlokasi:  65000000,
				AnggaranTerpakai: 65000000,
				SisaAnggaran:     0,
				IsActive:         true,
			},
			{
				ID:               "pos-akreditasi-3",
				RkaID:            "rka-2025-uuid",
				KodeMataAnggaran: "5.2.3",
				NamaKegiatan:     "Persiapan Akreditasi Internasional & Fasilitas Lab",
				Kategori:         "INVESTASI",
				SumberDana:       "RKAT_UNIVERSITAS",
				Triwulan:         3,
				AnggaranAlokasi:  100000000,
				AnggaranTerpakai: 60000000,
				SisaAnggaran:     40000000,
				IsActive:         true,
			},
		},
		Versions: []*model.RkaVersion{
			{
				ID:               "ver-1",
				RkaID:            "rka-2025-uuid",
				NomorVersi:       1,
				Status:           "DISETUJUI",
				RowVersion:       1,
				CatatanPerubahan: "Penyusunan RKA awal tahun 2025 disahkan Kaprodi",
				CreatedAt:        time.Now().AddDate(0, -5, 0),
			},
		},
		CreatedAt: time.Now().AddDate(0, -6, 0),
		UpdatedAt: time.Now(),
	}
	r.docs["2025"] = doc2025
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

func (r *memoryRkaRepository) FindByID(id string) (*model.RkaDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, d := range r.docs {
		if d.ID == id {
			return d, nil
		}
	}
	return nil, errors.New("dokumen RKA tidak ditemukan")
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
		item.IsActive = true
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
			Status:           "DISETUJUI",
			RowVersion:       1,
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
		Status:           "DRAFT",
		RowVersion:       1,
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

func (r *memoryRkaRepository) GetWorkingVersion(rkaIDOrYear string) (*model.RkaVersion, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	doc := r.resolveDocInternal(rkaIDOrYear)
	if doc == nil {
		return nil, errors.New("dokumen RKA tidak ditemukan")
	}

	for i := len(doc.Versions) - 1; i >= 0; i-- {
		v := doc.Versions[i]
		if v.Status == "DRAFT" || v.Status == "DIAJUKAN" {
			return v, nil
		}
	}

	// Create new draft version
	nextVer := len(doc.Versions) + 1
	working := &model.RkaVersion{
		ID:               uuid.New().String(),
		RkaID:            doc.ID,
		NomorVersi:       nextVer,
		Status:           "DRAFT",
		RowVersion:       1,
		CatatanPerubahan: fmt.Sprintf("Draf revisi versi %d", nextVer),
		DraftPayload: map[string]interface{}{
			"budget_items": doc.BudgetItems,
			"activities":   doc.Activities,
		},
		CreatedAt: time.Now(),
	}
	doc.Versions = append(doc.Versions, working)
	return working, nil
}

func (r *memoryRkaRepository) UpdateWorkingVersion(rkaIDOrYear string, ifMatchVersion int, payload map[string]interface{}) (*model.RkaVersion, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	doc := r.resolveDocInternal(rkaIDOrYear)
	if doc == nil {
		return nil, errors.New("dokumen RKA tidak ditemukan")
	}

	var working *model.RkaVersion
	for i := len(doc.Versions) - 1; i >= 0; i-- {
		v := doc.Versions[i]
		if v.Status == "DRAFT" || v.Status == "DIAJUKAN" {
			working = v
			break
		}
	}

	if working == nil {
		nextVer := len(doc.Versions) + 1
		working = &model.RkaVersion{
			ID:          uuid.New().String(),
			RkaID:       doc.ID,
			NomorVersi:  nextVer,
			Status:      "DRAFT",
			RowVersion:  1,
			CreatedAt:   time.Now(),
		}
		doc.Versions = append(doc.Versions, working)
	}

	// Optimistic locking verification
	if ifMatchVersion > 0 && ifMatchVersion != working.RowVersion {
		return nil, errors.New("konflik versi kerja: data telah diperbarui oleh pengguna lain (precondition failed)")
	}

	working.RowVersion++
	working.DraftPayload = payload
	working.Status = "DRAFT"
	if cat, ok := payload["catatan_perubahan"].(string); ok && cat != "" {
		working.CatatanPerubahan = cat
	}
	return working, nil
}

func (r *memoryRkaRepository) SubmitWorkingVersion(rkaIDOrYear string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	doc := r.resolveDocInternal(rkaIDOrYear)
	if doc == nil {
		return errors.New("dokumen RKA tidak ditemukan")
	}
	for i := len(doc.Versions) - 1; i >= 0; i-- {
		v := doc.Versions[i]
		if v.Status == "DRAFT" {
			v.Status = "DIAJUKAN"
			return nil
		}
	}
	return errors.New("tidak ada versi kerja aktif berstatus DRAFT untuk diajukan")
}

func (r *memoryRkaRepository) GetVersionDiff(rkaIDOrYear string, nomorVersi int) (map[string]interface{}, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	doc := r.resolveDocInternal(rkaIDOrYear)
	if doc == nil {
		return nil, errors.New("dokumen RKA tidak ditemukan")
	}
	var targetVer *model.RkaVersion
	for _, v := range doc.Versions {
		if v.NomorVersi == nomorVersi {
			targetVer = v
			break
		}
	}
	if targetVer == nil {
		return nil, errors.New("versi RKA tidak ditemukan")
	}
	return computeVersionDiff(doc, targetVer), nil
}

func (r *memoryRkaRepository) DecideVersion(rkaIDOrYear string, nomorVersi int, approved bool, actorID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	doc := r.resolveDocInternal(rkaIDOrYear)
	if doc == nil {
		return errors.New("dokumen RKA tidak ditemukan")
	}
	var targetVer *model.RkaVersion
	for _, v := range doc.Versions {
		if v.NomorVersi == nomorVersi {
			targetVer = v
			break
		}
	}
	if targetVer == nil {
		return errors.New("versi RKA tidak ditemukan")
	}

	if !approved {
		targetVer.Status = "DITOLAK"
		return nil
	}

	// Terapkan versi (simulasi app.apply_rka_version)
	for _, v := range doc.Versions {
		if v.Status == "DISETUJUI" && v.NomorVersi != nomorVersi {
			v.Status = "DIGANTIKAN"
		}
	}
	targetVer.Status = "DISETUJUI"
	doc.VersiAktifID = targetVer.ID

	// Terapkan payload ke budgetItems jika ada
	if targetVer.DraftPayload != nil {
		if rawItems, ok := targetVer.DraftPayload["budget_items"]; ok {
			rawJSON, _ := json.Marshal(rawItems)
			var newItems []*model.RkaBudgetItem
			if err := json.Unmarshal(rawJSON, &newItems); err == nil && len(newItems) > 0 {
				doc.BudgetItems = newItems
				var totalAlokasi float64
				for _, item := range doc.BudgetItems {
					totalAlokasi += item.AnggaranAlokasi
					item.SisaAnggaran = item.AnggaranAlokasi - item.AnggaranTerpakai
				}
				doc.PaguTotal = totalAlokasi
				doc.SisaAnggaran = doc.PaguTotal - doc.TotalTerpakai
				if doc.PaguTotal > 0 {
					doc.PersentaseSerapan = (doc.TotalTerpakai / doc.PaguTotal) * 100
				}
			}
		}
	}
	doc.Status = model.BudgetStatusAktif
	doc.UpdatedAt = time.Now()
	return nil
}

func (r *memoryRkaRepository) CloseRka(rkaIDOrYear string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	doc := r.resolveDocInternal(rkaIDOrYear)
	if doc == nil {
		return errors.New("dokumen RKA tidak ditemukan")
	}
	doc.Status = model.BudgetStatusDitutup
	doc.UpdatedAt = time.Now()
	return nil
}

func (r *memoryRkaRepository) resolveDocInternal(rkaIDOrYear string) *model.RkaDocument {
	if d, ok := r.docs[rkaIDOrYear]; ok {
		return d
	}
	for _, d := range r.docs {
		if d.ID == rkaIDOrYear {
			return d
		}
	}
	return nil
}

// ============================================================
// Helper Functions
// ============================================================

func computeRkaSerapan(doc *model.RkaDocument) *model.RkaSerapan {
	serapanPerKegiatan := make(map[string]float64)
	serapanPerPos := make(map[string]float64)
	serapanPerTriwulan := make(map[string]float64)

	paguTriwulan := make(map[int]float64)
	realTriwulan := make(map[int]float64)

	for _, item := range doc.BudgetItems {
		var pct float64
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

func computeVersionDiff(activeDoc *model.RkaDocument, targetVer *model.RkaVersion) map[string]interface{} {
	diffItems := make([]map[string]interface{}, 0)
	var totalDelta float64

	// Parse items in version payload
	verItems := make([]*model.RkaBudgetItem, 0)
	if targetVer.DraftPayload != nil {
		if raw, ok := targetVer.DraftPayload["budget_items"]; ok {
			b, _ := json.Marshal(raw)
			_ = json.Unmarshal(b, &verItems)
		}
	}

	activeMap := make(map[string]*model.RkaBudgetItem)
	for _, item := range activeDoc.BudgetItems {
		activeMap[item.KodeMataAnggaran] = item
	}

	for _, vItem := range verItems {
		if aItem, exists := activeMap[vItem.KodeMataAnggaran]; exists {
			delta := vItem.AnggaranAlokasi - aItem.AnggaranAlokasi
			totalDelta += delta
			diffItems = append(diffItems, map[string]interface{}{
				"kode_pos":          vItem.KodeMataAnggaran,
				"nama_kegiatan":     vItem.NamaKegiatan,
				"tipe_perubahan":    "MODIFIKASI",
				"alokasi_sebelum":   aItem.AnggaranAlokasi,
				"alokasi_sesudah":   vItem.AnggaranAlokasi,
				"selisih":           delta,
			})
			delete(activeMap, vItem.KodeMataAnggaran)
		} else {
			totalDelta += vItem.AnggaranAlokasi
			diffItems = append(diffItems, map[string]interface{}{
				"kode_pos":        vItem.KodeMataAnggaran,
				"nama_kegiatan":   vItem.NamaKegiatan,
				"tipe_perubahan":  "TAMBAH",
				"alokasi_sebelum": 0,
				"alokasi_sesudah": vItem.AnggaranAlokasi,
				"selisih":         vItem.AnggaranAlokasi,
			})
		}
	}

	for _, aItem := range activeMap {
		totalDelta -= aItem.AnggaranAlokasi
		diffItems = append(diffItems, map[string]interface{}{
			"kode_pos":        aItem.KodeMataAnggaran,
			"nama_kegiatan":   aItem.NamaKegiatan,
			"tipe_perubahan":  "HAPUS",
			"alokasi_sebelum": aItem.AnggaranAlokasi,
			"alokasi_sesudah": 0,
			"selisih":         -aItem.AnggaranAlokasi,
		})
	}

	return map[string]interface{}{
		"rka_id":           activeDoc.ID,
		"nomor_versi":      targetVer.NomorVersi,
		"status":           targetVer.Status,
		"total_perubahan":  len(diffItems),
		"selisih_total":    totalDelta,
		"rincian_diff":     diffItems,
	}
}

func ParseIfMatch(headerVal string) int {
	if headerVal == "" {
		return 0
	}
	clean := headerVal
	if len(clean) >= 2 && clean[0] == '"' && clean[len(clean)-1] == '"' {
		clean = clean[1 : len(clean)-1]
	}
	ver, err := strconv.Atoi(clean)
	if err != nil {
		return 0
	}
	return ver
}
