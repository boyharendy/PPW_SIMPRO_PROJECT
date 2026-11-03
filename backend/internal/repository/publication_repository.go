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

type PublicationRepository interface {
	FindAll(status string, tipe string, tahun int, limit, offset int) ([]*model.Publication, int, error)
	FindByID(id string) (*model.Publication, error)
	Create(pub *model.Publication) (*model.Publication, error)
	Update(id string, pub *model.Publication) (*model.Publication, error)
	Delete(id string) error
	UpdateStatus(id string, status model.PublicationStatus) error
	AddReview(review *model.PublicationReview) error
	GetRecap() (*model.PublicationRecap, error)
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabasePublicationRepository struct {
	client *database.SupabaseClient
}

func NewSupabasePublicationRepository(client *database.SupabaseClient) PublicationRepository {
	return &supabasePublicationRepository{client: client}
}

func (r *supabasePublicationRepository) FindAll(status string, tipe string, tahun int, limit, offset int) ([]*model.Publication, int, error) {
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
	if tipe != "" {
		params["tipe"] = fmt.Sprintf("eq.%s", tipe)
		countParams["tipe"] = params["tipe"]
	}
	if tahun > 0 {
		params["tahun_terbit"] = fmt.Sprintf("eq.%d", tahun)
		countParams["tahun_terbit"] = params["tahun_terbit"]
	}

	var publications []*model.Publication
	err := r.client.Select("publications", params, &publications)
	if err != nil {
		return nil, 0, fmt.Errorf("gagal query publications: %w", err)
	}

	total, _ := r.client.Count("publications", countParams)
	if total == 0 {
		total = len(publications)
	}

	return publications, total, nil
}

func (r *supabasePublicationRepository) FindByID(id string) (*model.Publication, error) {
	var list []*model.Publication
	err := r.client.Select("publications", map[string]string{
		"id":    fmt.Sprintf("eq.%s", id),
		"limit": "1",
	}, &list)
	if err != nil || len(list) == 0 {
		return nil, errors.New("publikasi tidak ditemukan")
	}

	pub := list[0]
	var authors []*model.PublicationAuthor
	_ = r.client.Select("publication_authors", map[string]string{
		"publication_id": fmt.Sprintf("eq.%s", id),
		"order":          "urutan.asc",
	}, &authors)
	pub.Authors = authors

	var reviews []*model.PublicationReview
	_ = r.client.Select("publication_reviews", map[string]string{
		"publication_id": fmt.Sprintf("eq.%s", id),
		"order":          "created_at.desc",
	}, &reviews)
	pub.Reviews = reviews

	return pub, nil
}

func (r *supabasePublicationRepository) Create(pub *model.Publication) (*model.Publication, error) {
	if pub.ID == "" {
		pub.ID = uuid.New().String()
	}
	if pub.Status == "" {
		pub.Status = model.PubStatusDraft
	}

	payload := map[string]interface{}{
		"id":                     pub.ID,
		"judul":                  pub.Judul,
		"tipe":                   string(pub.Tipe),
		"status":                 string(pub.Status),
		"nama_jurnal_konferensi": pub.NamaJurnalKonferensi,
		"tahun_terbit":           pub.TahunTerbit,
		"doi":                    pub.DOI,
		"url_publikasi":          pub.URLPublikasi,
		"file_naskah_url":        pub.FileNaskahURL,
		"created_by":             pub.CreatedBy,
	}

	var inserted []*model.Publication
	if err := r.client.Insert("publications", payload, &inserted); err != nil {
		return nil, fmt.Errorf("gagal membuat publikasi: %w", err)
	}

	for _, a := range pub.Authors {
		if a.ID == "" {
			a.ID = uuid.New().String()
		}
		aPayload := map[string]interface{}{
			"id":               a.ID,
			"publication_id":   pub.ID,
			"nama_penulis":     a.NamaPenulis,
			"afiliasi":         a.Afiliasi,
			"urutan":           a.Urutan,
			"is_corresponding": a.IsCorresponding,
		}
		if a.UserID != "" {
			aPayload["user_id"] = a.UserID
		}
		_ = r.client.Insert("publication_authors", aPayload, nil)
	}

	pub.CreatedAt = time.Now()
	pub.UpdatedAt = time.Now()
	return pub, nil
}

func (r *supabasePublicationRepository) Update(id string, pub *model.Publication) (*model.Publication, error) {
	payload := map[string]interface{}{
		"judul":                  pub.Judul,
		"tipe":                   string(pub.Tipe),
		"nama_jurnal_konferensi": pub.NamaJurnalKonferensi,
		"tahun_terbit":           pub.TahunTerbit,
		"doi":                    pub.DOI,
		"url_publikasi":          pub.URLPublikasi,
	}
	return pub, r.client.Update("publications", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabasePublicationRepository) Delete(id string) error {
	return r.client.Delete("publications", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	})
}

func (r *supabasePublicationRepository) UpdateStatus(id string, status model.PublicationStatus) error {
	return r.client.Update("publications", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{"status": string(status)}, nil)
}

func (r *supabasePublicationRepository) AddReview(review *model.PublicationReview) error {
	if review.ID == "" {
		review.ID = uuid.New().String()
	}
	payload := map[string]interface{}{
		"id":             review.ID,
		"publication_id": review.PublicationID,
		"reviewer_id":    review.ReviewerID,
		"catatan":        review.Catatan,
		"rekomendasi":    review.Rekomendasi,
	}
	return r.client.Insert("publication_reviews", payload, nil)
}

func (r *supabasePublicationRepository) GetRecap() (*model.PublicationRecap, error) {
	var list []*model.Publication
	_ = r.client.Select("publications", map[string]string{"select": "id,status,tipe,tahun_terbit"}, &list)

	recap := &model.PublicationRecap{
		TotalPublikasi: len(list),
		PerTipe:        make(map[string]int),
		PerStatus:      make(map[string]int),
		PerTahun:       make(map[int]int),
	}

	for _, p := range list {
		if p.Status == model.PubStatusTerverifikasi {
			recap.Terverifikasi++
		}
		recap.PerTipe[string(p.Tipe)]++
		recap.PerStatus[string(p.Status)]++
		recap.PerTahun[p.TahunTerbit]++
	}

	return recap, nil
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memoryPublicationRepository struct {
	mu           sync.RWMutex
	publications map[string]*model.Publication
	reviews      map[string][]*model.PublicationReview
}

func NewMemoryPublicationRepository() PublicationRepository {
	return &memoryPublicationRepository{
		publications: make(map[string]*model.Publication),
		reviews:      make(map[string][]*model.PublicationReview),
	}
}

func (r *memoryPublicationRepository) FindAll(status string, tipe string, tahun int, limit, offset int) ([]*model.Publication, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []*model.Publication
	for _, p := range r.publications {
		if status != "" && string(p.Status) != status {
			continue
		}
		if tipe != "" && string(p.Tipe) != tipe {
			continue
		}
		if tahun > 0 && p.TahunTerbit != tahun {
			continue
		}
		filtered = append(filtered, p)
	}

	total := len(filtered)
	if offset >= total {
		return []*model.Publication{}, total, nil
	}
	end := offset + limit
	if end > total || limit <= 0 {
		end = total
	}
	return filtered[offset:end], total, nil
}

func (r *memoryPublicationRepository) FindByID(id string) (*model.Publication, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.publications[id]
	if !ok {
		return nil, errors.New("publikasi tidak ditemukan")
	}
	res := *p
	res.Reviews = r.reviews[id]
	return &res, nil
}

func (r *memoryPublicationRepository) Create(pub *model.Publication) (*model.Publication, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if pub.ID == "" {
		pub.ID = uuid.New().String()
	}
	if pub.Status == "" {
		pub.Status = model.PubStatusDraft
	}
	pub.CreatedAt = time.Now()
	pub.UpdatedAt = time.Now()
	r.publications[pub.ID] = pub
	return pub, nil
}

func (r *memoryPublicationRepository) Update(id string, pub *model.Publication) (*model.Publication, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	existing, ok := r.publications[id]
	if !ok {
		return nil, errors.New("publikasi tidak ditemukan")
	}
	existing.Judul = pub.Judul
	existing.Tipe = pub.Tipe
	existing.NamaJurnalKonferensi = pub.NamaJurnalKonferensi
	existing.TahunTerbit = pub.TahunTerbit
	existing.DOI = pub.DOI
	existing.URLPublikasi = pub.URLPublikasi
	existing.UpdatedAt = time.Now()
	return existing, nil
}

func (r *memoryPublicationRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.publications, id)
	return nil
}

func (r *memoryPublicationRepository) UpdateStatus(id string, status model.PublicationStatus) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.publications[id]
	if !ok {
		return errors.New("publikasi tidak ditemukan")
	}
	p.Status = status
	p.UpdatedAt = time.Now()
	return nil
}

func (r *memoryPublicationRepository) AddReview(review *model.PublicationReview) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if review.ID == "" {
		review.ID = uuid.New().String()
	}
	review.CreatedAt = time.Now()
	r.reviews[review.PublicationID] = append(r.reviews[review.PublicationID], review)
	return nil
}

func (r *memoryPublicationRepository) GetRecap() (*model.PublicationRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	recap := &model.PublicationRecap{
		TotalPublikasi: len(r.publications),
		PerTipe:        make(map[string]int),
		PerStatus:      make(map[string]int),
		PerTahun:       make(map[int]int),
	}

	for _, p := range r.publications {
		if p.Status == model.PubStatusTerverifikasi {
			recap.Terverifikasi++
		}
		recap.PerTipe[string(p.Tipe)]++
		recap.PerStatus[string(p.Status)]++
		recap.PerTahun[p.TahunTerbit]++
	}

	return recap, nil
}
