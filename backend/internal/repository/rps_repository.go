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

type RpsRepository interface {
	FindAll(courseID string, status string) ([]*model.RpsSubmission, error)
	FindByID(id string) (*model.RpsSubmission, error)
	Create(sub *model.RpsSubmission) (*model.RpsSubmission, error)
	Update(id string, sub *model.RpsSubmission) (*model.RpsSubmission, error)
	Delete(id string) error
	UpdateStatus(id string, status model.RpsStatus) error
	AssignReviewer(id string, reviewerID string) error
	AddReview(review *model.RpsReview) error
	GetRecap() (*model.RpsRecap, error)
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabaseRpsRepository struct {
	client *database.SupabaseClient
}

func NewSupabaseRpsRepository(client *database.SupabaseClient) RpsRepository {
	return &supabaseRpsRepository{client: client}
}

func (r *supabaseRpsRepository) FindAll(courseID string, status string) ([]*model.RpsSubmission, error) {
	params := map[string]string{
		"order": "created_at.desc",
	}
	if courseID != "" {
		params["course_id"] = fmt.Sprintf("eq.%s", courseID)
	}
	if status != "" {
		params["status"] = fmt.Sprintf("eq.%s", status)
	}

	var subs []*model.RpsSubmission
	err := r.client.Select("rps_submissions", params, &subs)
	if err != nil {
		return nil, fmt.Errorf("gagal query rps_submissions: %w", err)
	}
	return subs, nil
}

func (r *supabaseRpsRepository) FindByID(id string) (*model.RpsSubmission, error) {
	var subs []*model.RpsSubmission
	err := r.client.Select("rps_submissions", map[string]string{
		"id":    fmt.Sprintf("eq.%s", id),
		"limit": "1",
	}, &subs)
	if err != nil || len(subs) == 0 {
		return nil, errors.New("pengajuan RPS tidak ditemukan")
	}

	sub := subs[0]

	var versions []*model.RpsVersion
	_ = r.client.Select("rps_versions", map[string]string{
		"rps_submission_id": fmt.Sprintf("eq.%s", id),
		"order":             "nomor_versi.desc",
	}, &versions)
	sub.Versions = versions

	var reviews []*model.RpsReview
	_ = r.client.Select("rps_reviews", map[string]string{
		"rps_submission_id": fmt.Sprintf("eq.%s", id),
		"order":             "created_at.desc",
	}, &reviews)
	for _, rev := range reviews {
		var items []*model.RpsReviewItem
		_ = r.client.Select("rps_review_items", map[string]string{
			"review_id": fmt.Sprintf("eq.%s", rev.ID),
		}, &items)
		rev.Items = items
	}
	sub.Reviews = reviews

	return sub, nil
}

func (r *supabaseRpsRepository) Create(sub *model.RpsSubmission) (*model.RpsSubmission, error) {
	if sub.ID == "" {
		sub.ID = uuid.New().String()
	}
	if sub.Status == "" {
		sub.Status = model.RpsStatusDraft
	}
	if sub.NomorVersi == 0 {
		sub.NomorVersi = 1
	}

	payload := map[string]interface{}{
		"id":                 sub.ID,
		"course_id":          sub.CourseID,
		"academic_period_id": sub.AcademicPeriodID,
		"tahun_akademik":     sub.TahunAkademik,
		"status":             string(sub.Status),
		"dosen_penyusun_id":  sub.DosenPenyusunID,
		"versi_terbaru":      sub.NomorVersi,
	}
	if sub.GkmReviewerID != "" {
		payload["gkm_reviewer_id"] = sub.GkmReviewerID
	}

	var inserted []*model.RpsSubmission
	if err := r.client.Insert("rps_submissions", payload, &inserted); err != nil {
		return nil, fmt.Errorf("gagal membuat pengajuan RPS: %w", err)
	}

	if sub.DokumenURL != "" {
		vPayload := map[string]interface{}{
			"id":                uuid.New().String(),
			"rps_submission_id": sub.ID,
			"nomor_versi":       sub.NomorVersi,
			"dokumen_url":       sub.DokumenURL,
			"uploaded_by":       sub.DosenPenyusunID,
		}
		_ = r.client.Insert("rps_versions", vPayload, nil)
	}

	sub.CreatedAt = time.Now()
	sub.UpdatedAt = time.Now()
	return sub, nil
}

func (r *supabaseRpsRepository) Update(id string, sub *model.RpsSubmission) (*model.RpsSubmission, error) {
	payload := map[string]interface{}{}
	if sub.GkmReviewerID != "" {
		payload["gkm_reviewer_id"] = sub.GkmReviewerID
	}
	if sub.NomorVersi > 0 {
		payload["versi_terbaru"] = sub.NomorVersi
	}
	if sub.DokumenURL != "" {
		vPayload := map[string]interface{}{
			"id":                uuid.New().String(),
			"rps_submission_id": id,
			"nomor_versi":       sub.NomorVersi,
			"dokumen_url":       sub.DokumenURL,
		}
		_ = r.client.Insert("rps_versions", vPayload, nil)
	}
	return sub, r.client.Update("rps_submissions", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabaseRpsRepository) Delete(id string) error {
	return r.client.Delete("rps_submissions", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	})
}

func (r *supabaseRpsRepository) UpdateStatus(id string, status model.RpsStatus) error {
	payload := map[string]interface{}{"status": string(status)}
	if status == model.RpsStatusDisahkanKaprodi {
		payload["disahkan_at"] = time.Now().Format(time.RFC3339)
	}
	return r.client.Update("rps_submissions", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabaseRpsRepository) AssignReviewer(id string, reviewerID string) error {
	return r.client.Update("rps_submissions", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{
		"gkm_reviewer_id": reviewerID,
		"status":          string(model.RpsStatusDireview),
	}, nil)
}

func (r *supabaseRpsRepository) AddReview(review *model.RpsReview) error {
	if review.ID == "" {
		review.ID = uuid.New().String()
	}
	payload := map[string]interface{}{
		"id":                review.ID,
		"rps_submission_id": review.RpsSubmissionID,
		"reviewer_id":       review.ReviewerID,
		"komentar":          review.Komentar,
		"rekomendasi":       review.Rekomendasi,
	}
	if err := r.client.Insert("rps_reviews", payload, nil); err != nil {
		return err
	}
	for _, item := range review.Items {
		if item.ID == "" {
			item.ID = uuid.New().String()
		}
		itemPayload := map[string]interface{}{
			"id":            item.ID,
			"review_id":     review.ID,
			"komponen":      item.Komponen,
			"status_sesuai": item.StatusSesuai,
			"catatan":       item.Catatan,
		}
		_ = r.client.Insert("rps_review_items", itemPayload, nil)
	}
	return nil
}

func (r *supabaseRpsRepository) GetRecap() (*model.RpsRecap, error) {
	var list []*model.RpsSubmission
	_ = r.client.Select("rps_submissions", map[string]string{"select": "id,course_id,status"}, &list)

	var courses []map[string]interface{}
	_ = r.client.Select("courses", map[string]string{"select": "id,kode_mk,nama_mk"}, &courses)

	recap := &model.RpsRecap{
		TotalPengajuan:    len(list),
		TotalMataKuliah:   len(courses),
		StatusDistribusi:  make(map[string]int),
		BelumMengumpulkan: []string{},
		BelumSelesaiRevisi: []string{},
	}

	submittedCourses := make(map[string]bool)
	for _, s := range list {
		submittedCourses[s.CourseID] = true
		if s.Status == model.RpsStatusDisahkanKaprodi || s.Status == model.RpsStatusDisetujuiGKM || s.Status == model.RpsStatusDisetujui {
			recap.TotalDisetujui++
		}
		if s.Status == model.RpsStatusRevisi || s.Status == model.RpsStatusPerluRevisi {
			recap.BelumSelesaiRevisi = append(recap.BelumSelesaiRevisi, s.CourseID)
		}
		recap.StatusDistribusi[string(s.Status)]++
	}

	for _, c := range courses {
		cid, _ := c["id"].(string)
		nama, _ := c["nama_mk"].(string)
		if cid != "" && !submittedCourses[cid] {
			if nama != "" {
				recap.BelumMengumpulkan = append(recap.BelumMengumpulkan, nama)
			} else {
				recap.BelumMengumpulkan = append(recap.BelumMengumpulkan, cid)
			}
		}
	}

	if recap.TotalPengajuan > 0 {
		recap.PersentaseKepatuhan = (float64(recap.TotalDisetujui) / float64(recap.TotalPengajuan)) * 100
	}

	return recap, nil
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memoryRpsRepository struct {
	mu       sync.RWMutex
	subs     map[string]*model.RpsSubmission
	versions map[string][]*model.RpsVersion
	reviews  map[string][]*model.RpsReview
}

func NewMemoryRpsRepository() RpsRepository {
	return &memoryRpsRepository{
		subs:     make(map[string]*model.RpsSubmission),
		versions: make(map[string][]*model.RpsVersion),
		reviews:  make(map[string][]*model.RpsReview),
	}
}

func (r *memoryRpsRepository) FindAll(courseID string, status string) ([]*model.RpsSubmission, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var res []*model.RpsSubmission
	for _, s := range r.subs {
		if courseID != "" && s.CourseID != courseID {
			continue
		}
		if status != "" && string(s.Status) != status {
			continue
		}
		res = append(res, s)
	}
	return res, nil
}

func (r *memoryRpsRepository) FindByID(id string) (*model.RpsSubmission, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.subs[id]
	if !ok {
		return nil, errors.New("pengajuan RPS tidak ditemukan")
	}
	res := *s
	res.Versions = r.versions[id]
	res.Reviews = r.reviews[id]
	return &res, nil
}

func (r *memoryRpsRepository) Create(sub *model.RpsSubmission) (*model.RpsSubmission, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if sub.ID == "" {
		sub.ID = uuid.New().String()
	}
	if sub.Status == "" {
		sub.Status = model.RpsStatusDraft
	}
	if sub.NomorVersi == 0 {
		sub.NomorVersi = 1
	}
	sub.CreatedAt = time.Now()
	sub.UpdatedAt = time.Now()
	r.subs[sub.ID] = sub
	if sub.DokumenURL != "" {
		r.versions[sub.ID] = append(r.versions[sub.ID], &model.RpsVersion{
			ID:              uuid.New().String(),
			RpsSubmissionID: sub.ID,
			NomorVersi:      sub.NomorVersi,
			DokumenURL:      sub.DokumenURL,
			UploadedBy:      sub.DosenPenyusunID,
			CreatedAt:       time.Now(),
		})
	}
	return sub, nil
}

func (r *memoryRpsRepository) Update(id string, sub *model.RpsSubmission) (*model.RpsSubmission, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	existing, ok := r.subs[id]
	if !ok {
		return nil, errors.New("pengajuan RPS tidak ditemukan")
	}
	if sub.DokumenURL != "" {
		existing.DokumenURL = sub.DokumenURL
	}
	if sub.NomorVersi > 0 {
		existing.NomorVersi = sub.NomorVersi
	} else {
		existing.NomorVersi++
	}
	if sub.GkmReviewerID != "" {
		existing.GkmReviewerID = sub.GkmReviewerID
	}
	existing.UpdatedAt = time.Now()
	if sub.DokumenURL != "" {
		r.versions[id] = append(r.versions[id], &model.RpsVersion{
			ID:              uuid.New().String(),
			RpsSubmissionID: id,
			NomorVersi:      existing.NomorVersi,
			DokumenURL:      sub.DokumenURL,
			CreatedAt:       time.Now(),
		})
	}
	return existing, nil
}

func (r *memoryRpsRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.subs, id)
	return nil
}

func (r *memoryRpsRepository) UpdateStatus(id string, status model.RpsStatus) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.subs[id]
	if !ok {
		return errors.New("pengajuan RPS tidak ditemukan")
	}
	s.Status = status
	if status == model.RpsStatusDisahkanKaprodi {
		now := time.Now()
		s.DisahkanAt = &now
	}
	s.UpdatedAt = time.Now()
	return nil
}

func (r *memoryRpsRepository) AssignReviewer(id string, reviewerID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.subs[id]
	if !ok {
		return errors.New("pengajuan RPS tidak ditemukan")
	}
	s.GkmReviewerID = reviewerID
	s.Status = model.RpsStatusDireview
	s.UpdatedAt = time.Now()
	return nil
}

func (r *memoryRpsRepository) AddReview(review *model.RpsReview) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if review.ID == "" {
		review.ID = uuid.New().String()
	}
	review.CreatedAt = time.Now()
	for _, item := range review.Items {
		if item.ID == "" {
			item.ID = uuid.New().String()
		}
		item.ReviewID = review.ID
	}
	r.reviews[review.RpsSubmissionID] = append(r.reviews[review.RpsSubmissionID], review)
	return nil
}

func (r *memoryRpsRepository) GetRecap() (*model.RpsRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	recap := &model.RpsRecap{
		TotalPengajuan:     len(r.subs),
		TotalMataKuliah:    len(r.subs),
		StatusDistribusi:   make(map[string]int),
		BelumMengumpulkan:  []string{},
		BelumSelesaiRevisi: []string{},
	}

	for _, s := range r.subs {
		if s.Status == model.RpsStatusDisahkanKaprodi || s.Status == model.RpsStatusDisetujuiGKM || s.Status == model.RpsStatusDisetujui {
			recap.TotalDisetujui++
		}
		if s.Status == model.RpsStatusRevisi || s.Status == model.RpsStatusPerluRevisi {
			recap.BelumSelesaiRevisi = append(recap.BelumSelesaiRevisi, s.CourseID)
		}
		recap.StatusDistribusi[string(s.Status)]++
	}

	if recap.TotalPengajuan > 0 {
		recap.PersentaseKepatuhan = (float64(recap.TotalDisetujui) / float64(recap.TotalPengajuan)) * 100
	}

	return recap, nil
}
