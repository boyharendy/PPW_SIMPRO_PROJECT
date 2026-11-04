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
	var reviews []*model.RpsReview
	_ = r.client.Select("rps_reviews", map[string]string{
		"rps_submission_id": fmt.Sprintf("eq.%s", id),
		"order":             "created_at.desc",
	}, &reviews)
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
		"status":             string(sub.Status),
		"dosen_penyusun_id":  sub.DosenPenyusunID,
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
	return r.client.Update("rps_submissions", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{"status": string(status)}, nil)
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
	return r.client.Insert("rps_reviews", payload, nil)
}

func (r *supabaseRpsRepository) GetRecap() (*model.RpsRecap, error) {
	var list []*model.RpsSubmission
	_ = r.client.Select("rps_submissions", map[string]string{"select": "id,status"}, &list)

	recap := &model.RpsRecap{
		TotalPengajuan:   len(list),
		StatusDistribusi: make(map[string]int),
	}

	for _, s := range list {
		if s.Status == model.RpsStatusDisahkanKaprodi || s.Status == model.RpsStatusDisetujuiGKM {
			recap.TotalDisetujui++
		}
		recap.StatusDistribusi[string(s.Status)]++
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
	mu      sync.RWMutex
	subs    map[string]*model.RpsSubmission
	reviews map[string][]*model.RpsReview
}

func NewMemoryRpsRepository() RpsRepository {
	return &memoryRpsRepository{
		subs:    make(map[string]*model.RpsSubmission),
		reviews: make(map[string][]*model.RpsReview),
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
	sub.CreatedAt = time.Now()
	sub.UpdatedAt = time.Now()
	r.subs[sub.ID] = sub
	return sub, nil
}

func (r *memoryRpsRepository) Update(id string, sub *model.RpsSubmission) (*model.RpsSubmission, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	existing, ok := r.subs[id]
	if !ok {
		return nil, errors.New("pengajuan RPS tidak ditemukan")
	}
	existing.DokumenURL = sub.DokumenURL
	existing.NomorVersi = sub.NomorVersi
	existing.UpdatedAt = time.Now()
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
	r.reviews[review.RpsSubmissionID] = append(r.reviews[review.RpsSubmissionID], review)
	return nil
}

func (r *memoryRpsRepository) GetRecap() (*model.RpsRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	recap := &model.RpsRecap{
		TotalPengajuan:   len(r.subs),
		StatusDistribusi: make(map[string]int),
	}

	for _, s := range r.subs {
		if s.Status == model.RpsStatusDisahkanKaprodi || s.Status == model.RpsStatusDisetujuiGKM {
			recap.TotalDisetujui++
		}
		recap.StatusDistribusi[string(s.Status)]++
	}

	if recap.TotalPengajuan > 0 {
		recap.PersentaseKepatuhan = (float64(recap.TotalDisetujui) / float64(recap.TotalPengajuan)) * 100
	}

	return recap, nil
}
