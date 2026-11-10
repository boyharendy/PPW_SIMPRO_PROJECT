package repository

import (
	"errors"
	"fmt"
	"strings"
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
	AddStageLog(log *model.PublicationStageLog) error
	AddReview(review *model.PublicationReview) error
	UpdateAuthors(id string, authors []*model.PublicationAuthor) error
	GetVerificationQueue(verifierID string) ([]*model.Publication, error)
	AssignVerifier(id string, verifierID string) error
	VerifyStage(stageID string, verifierID string, status string, catatan string) error
	CompleteReview(reviewID string, rekomendasi string, catatan string) error
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
		"order":          "reviewed_at.desc",
	}, &reviews)
	pub.Reviews = reviews

	var stageLogs []*model.PublicationStageLog
	_ = r.client.Select("publication_stage_logs", map[string]string{
		"publication_id": fmt.Sprintf("eq.%s", id),
		"order":          "created_at.asc",
	}, &stageLogs)
	pub.StageLogs = stageLogs

	return pub, nil
}

func (r *supabasePublicationRepository) Create(pub *model.Publication) (*model.Publication, error) {
	if pub.ID == "" {
		pub.ID = uuid.New().String()
	}
	if pub.Status == "" {
		pub.Status = model.PubStatusDraft
	}
	if pub.NamaJurnalKonferensi == "" && pub.NamaTarget != "" {
		pub.NamaJurnalKonferensi = pub.NamaTarget
	}
	if pub.TahunTerbit == 0 && pub.Tahun > 0 {
		pub.TahunTerbit = pub.Tahun
	}
	if pub.Tipe == "" && pub.Jenis != "" {
		pub.Tipe = model.PublicationType(pub.Jenis)
	}
	if pub.Peringkat == "" {
		pub.Peringkat = "NON_PERINGKAT"
	}

	payload := map[string]interface{}{
		"id":                     pub.ID,
		"judul":                  pub.Judul,
		"tipe":                   string(pub.Tipe),
		"status":                 string(pub.Status),
		"nama_jurnal_konferensi": pub.NamaJurnalKonferensi,
		"peringkat":              pub.Peringkat,
		"tahun_terbit":           pub.TahunTerbit,
		"doi":                    pub.DOI,
		"url_publikasi":          pub.URLPublikasi,
		"file_naskah_url":        pub.FileNaskahURL,
		"created_by":             pub.CreatedBy,
	}
	if pub.VerifikatorID != "" {
		payload["verifikator_id"] = pub.VerifikatorID
		payload["status_verifikasi"] = "MENUNGGU"
	}

	var inserted []*model.Publication
	if err := r.client.Insert("publications", payload, &inserted); err != nil {
		return nil, fmt.Errorf("gagal membuat publikasi: %w", err)
	}

	for _, a := range pub.Authors {
		if a.ID == "" {
			a.ID = uuid.New().String()
		}
		if a.TipePenulis == "" {
			a.TipePenulis = "DOSEN"
		}
		if a.Peran == "" {
			a.Peran = "PENULIS_UTAMA"
		}
		aPayload := map[string]interface{}{
			"id":               a.ID,
			"publication_id":   pub.ID,
			"nama_penulis":     a.NamaPenulis,
			"tipe_penulis":     a.TipePenulis,
			"peran":            a.Peran,
			"afiliasi":         a.Afiliasi,
			"urutan":           a.Urutan,
			"is_corresponding": a.IsCorresponding,
		}
		if a.UserID != "" {
			aPayload["user_id"] = a.UserID
		}
		_ = r.client.Insert("publication_authors", aPayload, nil)
	}

	for _, log := range pub.StageLogs {
		log.PublicationID = pub.ID
		_ = r.AddStageLog(log)
	}

	pub.CreatedAt = time.Now()
	pub.UpdatedAt = time.Now()
	return pub, nil
}

func (r *supabasePublicationRepository) Update(id string, pub *model.Publication) (*model.Publication, error) {
	if pub.NamaJurnalKonferensi == "" && pub.NamaTarget != "" {
		pub.NamaJurnalKonferensi = pub.NamaTarget
	}
	if pub.TahunTerbit == 0 && pub.Tahun > 0 {
		pub.TahunTerbit = pub.Tahun
	}
	payload := map[string]interface{}{
		"judul":                  pub.Judul,
		"tipe":                   string(pub.Tipe),
		"nama_jurnal_konferensi": pub.NamaJurnalKonferensi,
		"tahun_terbit":           pub.TahunTerbit,
		"doi":                    pub.DOI,
		"url_publikasi":          pub.URLPublikasi,
	}
	if pub.Peringkat != "" {
		payload["peringkat"] = pub.Peringkat
	}
	if pub.Status != "" {
		payload["status"] = string(pub.Status)
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
	payload := map[string]interface{}{
		"status": string(status),
	}
	if status == model.PubStatusTerverifikasi || status == model.PubStatusTerbit {
		now := time.Now()
		payload["status_verifikasi"] = "TERVERIFIKASI"
		payload["diverifikasi_at"] = now
		payload["is_forwarded_to_kinerja"] = true
		payload["forwarded_to_kinerja_at"] = now
	}
	return r.client.Update("publications", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabasePublicationRepository) AddStageLog(log *model.PublicationStageLog) error {
	if log.ID == "" {
		log.ID = uuid.New().String()
	}
	if log.TanggalTahap == "" {
		log.TanggalTahap = time.Now().Format("2006-01-02")
	}
	payload := map[string]interface{}{
		"id":                log.ID,
		"publication_id":    log.PublicationID,
		"tahap":             string(log.Tahap),
		"tanggal_tahap":     log.TanggalTahap,
		"jenis_bukti":       log.JenisBukti,
		"tautan_bukti":      log.TautanBukti,
		"nama_berkas_bukti": log.NamaBerkasBukti,
		"catatan":           log.Catatan,
	}
	if log.DicatatOleh != "" {
		payload["dicatat_oleh"] = log.DicatatOleh
	}
	_ = r.UpdateStatus(log.PublicationID, log.Tahap)
	return r.client.Insert("publication_stage_logs", payload, nil)
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
	if review.Status != "" {
		payload["status"] = review.Status
	}
	if review.TenggatReview != "" {
		payload["tenggat_review"] = review.TenggatReview
	}
	return r.client.Insert("publication_reviews", payload, nil)
}

func (r *supabasePublicationRepository) UpdateAuthors(id string, authors []*model.PublicationAuthor) error {
	_ = r.client.Delete("publication_authors", map[string]string{
		"publication_id": fmt.Sprintf("eq.%s", id),
	})
	for _, a := range authors {
		if a.ID == "" {
			a.ID = uuid.New().String()
		}
		a.PublicationID = id
		if err := r.client.Insert("publication_authors", a, nil); err != nil {
			return fmt.Errorf("gagal insert publication author: %w", err)
		}
	}
	return nil
}

func (r *supabasePublicationRepository) GetVerificationQueue(verifierID string) ([]*model.Publication, error) {
	params := map[string]string{
		"status": fmt.Sprintf("eq.%s", model.PubStatusMenungguVerifikasi),
		"order":  "created_at.desc",
	}
	if verifierID != "" {
		params["verifikator_id"] = fmt.Sprintf("eq.%s", verifierID)
	}
	var list []*model.Publication
	err := r.client.Select("publications", params, &list)
	if err != nil {
		return nil, fmt.Errorf("gagal query antrean verifikasi: %w", err)
	}
	return list, nil
}

func (r *supabasePublicationRepository) AssignVerifier(id string, verifierID string) error {
	return r.client.Update("publications", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{
		"verifikator_id": verifierID,
	}, nil)
}

func (r *supabasePublicationRepository) VerifyStage(stageID string, verifierID string, status string, catatan string) error {
	now := time.Now()
	payload := map[string]interface{}{
		"status_verifikasi":  status,
		"diverifikasi_oleh":  verifierID,
		"diverifikasi_at":    now.Format(time.RFC3339),
		"catatan_verifikasi": catatan,
	}
	return r.client.Update("publication_stage_logs", map[string]string{
		"id": fmt.Sprintf("eq.%s", stageID),
	}, payload, nil)
}

func (r *supabasePublicationRepository) CompleteReview(reviewID string, rekomendasi string, catatan string) error {
	payload := map[string]interface{}{
		"status":      "SELESAI_REVIEW",
		"rekomendasi": rekomendasi,
		"catatan":     catatan,
	}
	return r.client.Update("publication_reviews", map[string]string{
		"id": fmt.Sprintf("eq.%s", reviewID),
	}, payload, nil)
}

func (r *supabasePublicationRepository) GetRecap() (*model.PublicationRecap, error) {
	var list []*model.Publication
	_ = r.client.Select("publications", map[string]string{"select": "id,status,tipe,peringkat,tahun_terbit,is_forwarded_to_kinerja"}, &list)

	var allAuthors []*model.PublicationAuthor
	_ = r.client.Select("publication_authors", map[string]string{"select": "publication_id,tipe_penulis"}, &allAuthors)
	pubHasStudent := make(map[string]bool)
	for _, a := range allAuthors {
		if strings.EqualFold(a.TipePenulis, "MAHASISWA") {
			pubHasStudent[a.PublicationID] = true
		}
	}

	recap := &model.PublicationRecap{
		TotalPublikasi: len(list),
		PerTipe:        make(map[string]int),
		PerStatus:      make(map[string]int),
		PerPeringkat:   make(map[string]int),
		PerTahun:       make(map[int]int),
	}

	for _, p := range list {
		if p.Status == model.PubStatusTerverifikasi || p.Status == model.PubStatusTerbit || p.Status == model.PubStatusDiterima {
			recap.Terverifikasi++
		}
		if p.IsForwardedToKinerja || p.Status == model.PubStatusTerverifikasi || p.Status == model.PubStatusTerbit {
			recap.DiteruskanKeKinerja++
		}
		if pubHasStudent[p.ID] {
			recap.JumlahLibatMahasiswa++
		}
		recap.PerTipe[string(p.Tipe)]++
		recap.PerStatus[string(p.Status)]++
		peringkat := p.Peringkat
		if peringkat == "" {
			peringkat = "NON_PERINGKAT"
		}
		recap.PerPeringkat[peringkat]++
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
	stageLogs    map[string][]*model.PublicationStageLog
	authors      map[string][]*model.PublicationAuthor
}

func NewMemoryPublicationRepository() PublicationRepository {
	return &memoryPublicationRepository{
		publications: make(map[string]*model.Publication),
		reviews:      make(map[string][]*model.PublicationReview),
		stageLogs:    make(map[string][]*model.PublicationStageLog),
		authors:      make(map[string][]*model.PublicationAuthor),
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
	if len(r.stageLogs[id]) > 0 {
		res.StageLogs = r.stageLogs[id]
	}
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
	if pub.NamaJurnalKonferensi == "" && pub.NamaTarget != "" {
		pub.NamaJurnalKonferensi = pub.NamaTarget
	}
	if pub.TahunTerbit == 0 && pub.Tahun > 0 {
		pub.TahunTerbit = pub.Tahun
	}
	if pub.Peringkat == "" {
		pub.Peringkat = "NON_PERINGKAT"
	}
	pub.CreatedAt = time.Now()
	pub.UpdatedAt = time.Now()
	r.publications[pub.ID] = pub
	if len(pub.StageLogs) > 0 {
		r.stageLogs[pub.ID] = pub.StageLogs
	}
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
	if pub.Peringkat != "" {
		existing.Peringkat = pub.Peringkat
	}
	if pub.Status != "" {
		existing.Status = pub.Status
	}
	if len(pub.StageLogs) > 0 {
		existing.StageLogs = pub.StageLogs
		r.stageLogs[id] = pub.StageLogs
	}
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
	if status == model.PubStatusTerverifikasi || status == model.PubStatusTerbit {
		now := time.Now()
		p.StatusVerifikasi = "TERVERIFIKASI"
		p.DiverifikasiAt = &now
		p.IsForwardedToKinerja = true
		p.ForwardedToKinerjaAt = &now
	}
	p.UpdatedAt = time.Now()
	return nil
}

func (r *memoryPublicationRepository) AddStageLog(log *model.PublicationStageLog) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.publications[log.PublicationID]
	if !ok {
		return errors.New("publikasi tidak ditemukan")
	}
	if log.ID == "" {
		log.ID = uuid.New().String()
	}
	log.CreatedAt = time.Now()
	r.stageLogs[log.PublicationID] = append(r.stageLogs[log.PublicationID], log)
	p.Status = log.Tahap
	p.StageLogs = r.stageLogs[log.PublicationID]
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

func (r *memoryPublicationRepository) UpdateAuthors(id string, authors []*model.PublicationAuthor) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	pub, ok := r.publications[id]
	if !ok {
		return errors.New("publikasi tidak ditemukan")
	}
	r.authors[id] = authors
	pub.Authors = authors
	pub.UpdatedAt = time.Now()
	return nil
}

func (r *memoryPublicationRepository) GetVerificationQueue(verifierID string) ([]*model.Publication, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []*model.Publication
	for _, p := range r.publications {
		if p.Status == model.PubStatusMenungguVerifikasi || p.StatusVerifikasi == "MENUNGGU" {
			if verifierID == "" || p.VerifikatorID == verifierID {
				result = append(result, p)
			}
		}
	}
	return result, nil
}

func (r *memoryPublicationRepository) AssignVerifier(id string, verifierID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	pub, ok := r.publications[id]
	if !ok {
		return errors.New("publikasi tidak ditemukan")
	}
	pub.VerifikatorID = verifierID
	pub.UpdatedAt = time.Now()
	return nil
}

func (r *memoryPublicationRepository) VerifyStage(stageID string, verifierID string, status string, catatan string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	for _, logs := range r.stageLogs {
		for _, l := range logs {
			if l.ID == stageID {
				l.StatusVerifikasi = status
				l.Catatan = catatan
				if pub, ok := r.publications[l.PublicationID]; ok {
					if status == "TERVERIFIKASI" {
						pub.Status = l.Tahap
						pub.StatusVerifikasi = "TERVERIFIKASI"
						pub.DiverifikasiAt = &now
					} else if status == "DITOLAK" {
						pub.StatusVerifikasi = "DITOLAK"
					}
					pub.UpdatedAt = now
				}
				return nil
			}
		}
	}
	return errors.New("log tahapan publikasi tidak ditemukan")
}

func (r *memoryPublicationRepository) CompleteReview(reviewID string, rekomendasi string, catatan string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, revs := range r.reviews {
		for _, rev := range revs {
			if rev.ID == reviewID {
				rev.Status = "SELESAI_REVIEW"
				rev.Rekomendasi = rekomendasi
				rev.Catatan = catatan
				return nil
			}
		}
	}
	return errors.New("review publikasi tidak ditemukan")
}

func (r *memoryPublicationRepository) GetRecap() (*model.PublicationRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	recap := &model.PublicationRecap{
		TotalPublikasi: len(r.publications),
		PerTipe:        make(map[string]int),
		PerStatus:      make(map[string]int),
		PerPeringkat:   make(map[string]int),
		PerTahun:       make(map[int]int),
	}

	for _, p := range r.publications {
		if p.Status == model.PubStatusTerverifikasi || p.Status == model.PubStatusTerbit || p.Status == model.PubStatusDiterima {
			recap.Terverifikasi++
		}
		if p.IsForwardedToKinerja || p.Status == model.PubStatusTerverifikasi || p.Status == model.PubStatusTerbit {
			recap.DiteruskanKeKinerja++
		}
		hasStudent := false
		for _, a := range p.Authors {
			if strings.EqualFold(a.TipePenulis, "MAHASISWA") {
				hasStudent = true
				break
			}
		}
		if hasStudent {
			recap.JumlahLibatMahasiswa++
		}
		recap.PerTipe[string(p.Tipe)]++
		recap.PerStatus[string(p.Status)]++
		peringkat := p.Peringkat
		if peringkat == "" {
			peringkat = "NON_PERINGKAT"
		}
		recap.PerPeringkat[peringkat]++
		recap.PerTahun[p.TahunTerbit]++
	}

	return recap, nil
}
