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

	// PRD Milestone 3 Methods
	AssignReviewers(id string, reviewerIDs []string) error
	UpdateReviewItems(reviewID string, items []*model.RpsReviewItem) error
	CompleteReview(reviewID string, rekomendasi, komentar string) error
	UpdateImprovementPlans(submissionID string, plans []*model.CourseImprovementPlan) error
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
		"order":             "nomor_versi.asc",
	}, &versions)
	sub.Versions = versions

	var reviews []*model.RpsReview
	_ = r.client.Select("rps_reviews", map[string]string{
		"rps_submission_id": fmt.Sprintf("eq.%s", id),
		"order":             "created_at.asc",
	}, &reviews)

	for _, rev := range reviews {
		var items []*model.RpsReviewItem
		_ = r.client.Select("rps_review_items", map[string]string{
			"rps_review_id": fmt.Sprintf("eq.%s", rev.ID),
		}, &items)
		rev.Items = items
	}
	sub.Reviews = reviews

	var plans []*model.CourseImprovementPlan
	_ = r.client.Select("course_improvement_plans", map[string]string{
		"applied_in_rps_id": fmt.Sprintf("eq.%s", id),
	}, &plans)
	sub.ImprovementPlans = plans

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
		"versi_terbaru":      sub.NomorVersi,
		"dosen_penyusun_id":  sub.DosenPenyusunID,
	}
	if sub.TahunAkademik != "" {
		payload["tahun_akademik"] = sub.TahunAkademik
	}

	var inserted []*model.RpsSubmission
	err := r.client.Insert("rps_submissions", payload, &inserted)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat pengajuan RPS: %w", err)
	}

	if sub.DokumenURL != "" {
		verPayload := map[string]interface{}{
			"rps_submission_id": sub.ID,
			"nomor_versi":       sub.NomorVersi,
			"dokumen_url":       sub.DokumenURL,
		}
		_ = r.client.Insert("rps_versions", verPayload, nil)
	}

	sub.CreatedAt = time.Now()
	sub.UpdatedAt = time.Now()
	return sub, nil
}

func (r *supabaseRpsRepository) Update(id string, sub *model.RpsSubmission) (*model.RpsSubmission, error) {
	payload := map[string]interface{}{}
	if sub.Status != "" {
		payload["status"] = string(sub.Status)
	}
	if sub.DokumenURL != "" {
		sub.NomorVersi++
		payload["versi_terbaru"] = sub.NomorVersi
		verPayload := map[string]interface{}{
			"rps_submission_id": id,
			"nomor_versi":       sub.NomorVersi,
			"dokumen_url":       sub.DokumenURL,
		}
		_ = r.client.Insert("rps_versions", verPayload, nil)
	}
	if sub.CatatanPengesahan != "" {
		payload["catatan_pengesahan"] = sub.CatatanPengesahan
	}
	if sub.DisahkanOleh != "" {
		payload["disahkan_oleh"] = sub.DisahkanOleh
		now := time.Now()
		payload["disahkan_at"] = now
	}

	err := r.client.Update("rps_submissions", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
	if err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *supabaseRpsRepository) Delete(id string) error {
	return r.client.Delete("rps_submissions", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	})
}

func (r *supabaseRpsRepository) UpdateStatus(id string, status model.RpsStatus) error {
	payload := map[string]interface{}{
		"status": string(status),
	}
	if status == model.RpsStatusDisahkanKaprodi {
		payload["disahkan_at"] = time.Now()
	}
	return r.client.Update("rps_submissions", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabaseRpsRepository) AssignReviewer(id string, reviewerID string) error {
	return r.AssignReviewers(id, []string{reviewerID})
}

func (r *supabaseRpsRepository) AssignReviewers(id string, reviewerIDs []string) error {
	sub, err := r.FindByID(id)
	if err != nil {
		return err
	}

	for _, revID := range reviewerIDs {
		if revID == sub.DosenPenyusunID {
			return errors.New("guard SPMI: dosen penyusun/pengampu tidak boleh ditugaskan sebagai reviewer")
		}
		revPayload := map[string]interface{}{
			"rps_submission_id": id,
			"reviewer_id":       revID,
			"komentar":          "-",
			"rekomendasi":       "SEDANG_DIREVIEW",
		}
		var inserted []*model.RpsReview
		_ = r.client.Insert("rps_reviews", revPayload, &inserted)

		// Auto seed 5 komponen instrumen SPMI
		if len(inserted) > 0 {
			komponens := []string{
				model.RpsKomponenCplCpmk,
				model.RpsKomponenBahanKajian,
				model.RpsKomponenMetode,
				model.RpsKomponenPenilaian,
				model.RpsKomponenReferensi,
			}
			for _, k := range komponens {
				_ = r.client.Insert("rps_review_items", map[string]interface{}{
					"rps_review_id": inserted[0].ID,
					"komponen":      k,
					"hasil":         "SESUAI",
				}, nil)
			}
		}
	}

	primaryReviewer := ""
	if len(reviewerIDs) > 0 {
		primaryReviewer = reviewerIDs[0]
	}
	return r.client.Update("rps_submissions", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{
		"status":          string(model.RpsStatusDireview),
		"gkm_reviewer_id": primaryReviewer,
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
	err := r.client.Insert("rps_reviews", payload, nil)
	if err != nil {
		return err
	}

	for _, item := range review.Items {
		if item.ID == "" {
			item.ID = uuid.New().String()
		}
		itemPayload := map[string]interface{}{
			"id":            item.ID,
			"rps_review_id": review.ID,
			"komponen":      item.Komponen,
			"hasil":         item.Hasil,
			"catatan":       item.Catatan,
		}
		_ = r.client.Insert("rps_review_items", itemPayload, nil)
	}

	// Update status pengajuan sesuai rekomendasi
	var newStatus model.RpsStatus
	if review.Rekomendasi == "DISETUJUI" || review.Rekomendasi == "DISETUJUI_GKM" {
		newStatus = model.RpsStatusDisetujuiGKM
	} else {
		newStatus = model.RpsStatusPerluRevisi
	}
	return r.UpdateStatus(review.RpsSubmissionID, newStatus)
}

func (r *supabaseRpsRepository) UpdateReviewItems(reviewID string, items []*model.RpsReviewItem) error {
	for _, it := range items {
		_ = r.client.Update("rps_review_items", map[string]string{
			"rps_review_id": fmt.Sprintf("eq.%s", reviewID),
			"komponen":      fmt.Sprintf("eq.%s", it.Komponen),
		}, map[string]interface{}{
			"hasil":   it.Hasil,
			"catatan": it.Catatan,
		}, nil)
	}
	return nil
}

func (r *supabaseRpsRepository) CompleteReview(reviewID string, rekomendasi, komentar string) error {
	var revs []*model.RpsReview
	err := r.client.Select("rps_reviews", map[string]string{
		"id":    fmt.Sprintf("eq.%s", reviewID),
		"limit": "1",
	}, &revs)
	if err != nil || len(revs) == 0 {
		return errors.New("review tidak ditemukan")
	}

	rev := revs[0]
	err = r.client.Update("rps_reviews", map[string]string{
		"id": fmt.Sprintf("eq.%s", reviewID),
	}, map[string]interface{}{
		"status":      "SELESAI_REVIEW",
		"rekomendasi": rekomendasi,
		"komentar":    komentar,
	}, nil)
	if err != nil {
		return err
	}

	newStatus := model.RpsStatusDisetujuiGKM
	if rekomendasi == "PERLU_REVISI" {
		newStatus = model.RpsStatusPerluRevisi
	}
	return r.UpdateStatus(rev.RpsSubmissionID, newStatus)
}

func (r *supabaseRpsRepository) UpdateImprovementPlans(submissionID string, plans []*model.CourseImprovementPlan) error {
	for _, p := range plans {
		_ = r.client.Update("course_improvement_plans", map[string]string{
			"id": fmt.Sprintf("eq.%s", p.ID),
		}, map[string]interface{}{
			"status":            p.Status,
			"applied_in_rps_id": submissionID,
			"catatan_penerapan": p.CatatanPenerapan,
		}, nil)
	}
	return nil
}

func (r *supabaseRpsRepository) GetRecap() (*model.RpsRecap, error) {
	subs, err := r.FindAll("", "")
	if err != nil {
		return nil, err
	}
	return computeRpsRecap(subs), nil
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memoryRpsRepository struct {
	mu       sync.RWMutex
	subs     map[string]*model.RpsSubmission
	versions map[string][]*model.RpsVersion
	reviews  map[string][]*model.RpsReview
	plans    map[string][]*model.CourseImprovementPlan
}

func NewMemoryRpsRepository() RpsRepository {
	repo := &memoryRpsRepository{
		subs:     make(map[string]*model.RpsSubmission),
		versions: make(map[string][]*model.RpsVersion),
		reviews:  make(map[string][]*model.RpsReview),
		plans:    make(map[string][]*model.CourseImprovementPlan),
	}
	repo.seedInitialData()
	return repo
}

func (r *memoryRpsRepository) seedInitialData() {
	now := time.Now()
	s1 := &model.RpsSubmission{
		ID:                "rps-001",
		CourseID:          "course-si201",
		CourseName:        "Basis Data & SQL (SI201)",
		AcademicPeriodID:  "period-2024-ganjil",
		TahunAkademik:     "2024/2025",
		Status:            model.RpsStatusDireview,
		DosenPenyusunID:   "a0000000-0000-0000-0000-000000000004", // Ir. Hendra Wijaya
		DosenPengampuNama: "Ir. Hendra Wijaya, M.Sc.",
		GkmReviewerID:     "a0000000-0000-0000-0000-000000000002", // Dr. Siti Nurhaliza (GKM)
		ReviewerIDs:       []string{"a0000000-0000-0000-0000-000000000002"},
		NomorVersi:        1,
		DokumenURL:        "/uploads/rps/RPS_SI201_BasisData_v1.pdf",
		Reviews: []*model.RpsReview{
			{
				ID:              "rev-001",
				RpsSubmissionID: "rps-001",
				ReviewerID:      "a0000000-0000-0000-0000-000000000002",
				ReviewerName:    "Dr. Siti Nurhaliza, M.Kom.",
				Status:          "DITUGASKAN",
				Komentar:        "Silakan periksa kesesuaian rubrik penilaian praktikum database dengan CPMK 3.",
				Rekomendasi:     "SEDANG_DIREVIEW",
				Items: []*model.RpsReviewItem{
					{ID: "it-1", RpsReviewID: "rev-001", Komponen: model.RpsKomponenCplCpmk, Hasil: "SESUAI", Catatan: "CPL telah dipetakan baik ke CPMK"},
					{ID: "it-2", RpsReviewID: "rev-001", Komponen: model.RpsKomponenBahanKajian, Hasil: "SESUAI", Catatan: "Silabus mencakup PostgreSQL dan NoSQL"},
					{ID: "it-3", RpsReviewID: "rev-001", Komponen: model.RpsKomponenMetode, Hasil: "SESUAI", Catatan: "Project-based learning sesuai OBE"},
					{ID: "it-4", RpsReviewID: "rev-001", Komponen: model.RpsKomponenPenilaian, Hasil: "PERLU_PERBAIKAN", Catatan: "Bobot tugas akhir belum sinkron dengan rubrik"},
					{ID: "it-5", RpsReviewID: "rev-001", Komponen: model.RpsKomponenReferensi, Hasil: "SESUAI", Catatan: "Pustaka 5 tahun terakhir"},
				},
				CreatedAt: now.AddDate(0, 0, -3),
			},
		},
		ImprovementPlans: []*model.CourseImprovementPlan{
			{
				ID:                "plan-001",
				EvaluationID:      "eval-prev-sem",
				CourseID:          "course-si201",
				Uraian:            "Menambah porsi studi kasus query optimization pada praktikum SQL",
				TargetKomponenRPS: model.RpsKomponenBahanKajian,
				Status:            "SUDAH_DITERAPKAN",
				CatatanPenerapan:  "Ditambahkan pada modul pertemuan 9 dan 10",
			},
		},
		CreatedAt: now.AddDate(0, 0, -10),
		UpdatedAt: now.AddDate(0, 0, -3),
	}
	r.subs[s1.ID] = s1
	r.reviews[s1.ID] = s1.Reviews
	r.plans[s1.ID] = s1.ImprovementPlans
}

func (r *memoryRpsRepository) FindAll(courseID string, status string) ([]*model.RpsSubmission, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	res := make([]*model.RpsSubmission, 0, len(r.subs))
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
	s.Reviews = r.reviews[id]
	s.ImprovementPlans = r.plans[id]
	return s, nil
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
		existing.NomorVersi++
	}
	if sub.CatatanPengesahan != "" {
		existing.CatatanPengesahan = sub.CatatanPengesahan
	}
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
	if status == model.RpsStatusDisahkanKaprodi {
		now := time.Now()
		s.DisahkanAt = &now
	}
	s.UpdatedAt = time.Now()
	return nil
}

func (r *memoryRpsRepository) AssignReviewer(id string, reviewerID string) error {
	return r.AssignReviewers(id, []string{reviewerID})
}

func (r *memoryRpsRepository) AssignReviewers(id string, reviewerIDs []string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.subs[id]
	if !ok {
		return errors.New("pengajuan RPS tidak ditemukan")
	}

	for _, revID := range reviewerIDs {
		if revID == s.DosenPenyusunID {
			return errors.New("guard SPMI: dosen penyusun/pengampu tidak boleh ditugaskan sebagai reviewer")
		}
		rev := &model.RpsReview{
			ID:              uuid.New().String(),
			RpsSubmissionID: id,
			ReviewerID:      revID,
			Status:          "DITUGASKAN",
			Komentar:        "-",
			Rekomendasi:     "SEDANG_DIREVIEW",
			Items: []*model.RpsReviewItem{
				{ID: uuid.New().String(), Komponen: model.RpsKomponenCplCpmk, Hasil: "SESUAI"},
				{ID: uuid.New().String(), Komponen: model.RpsKomponenBahanKajian, Hasil: "SESUAI"},
				{ID: uuid.New().String(), Komponen: model.RpsKomponenMetode, Hasil: "SESUAI"},
				{ID: uuid.New().String(), Komponen: model.RpsKomponenPenilaian, Hasil: "SESUAI"},
				{ID: uuid.New().String(), Komponen: model.RpsKomponenReferensi, Hasil: "SESUAI"},
			},
			CreatedAt: time.Now(),
		}
		r.reviews[id] = append(r.reviews[id], rev)
	}

	s.Status = model.RpsStatusDireview
	s.ReviewerIDs = reviewerIDs
	if len(reviewerIDs) > 0 {
		s.GkmReviewerID = reviewerIDs[0]
	}
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

	s, ok := r.subs[review.RpsSubmissionID]
	if ok {
		if review.Rekomendasi == "DISETUJUI" || review.Rekomendasi == "DISETUJUI_GKM" {
			s.Status = model.RpsStatusDisetujuiGKM
		} else {
			s.Status = model.RpsStatusPerluRevisi
		}
		s.UpdatedAt = time.Now()
	}
	return nil
}

func (r *memoryRpsRepository) UpdateReviewItems(reviewID string, items []*model.RpsReviewItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, revList := range r.reviews {
		for _, rev := range revList {
			if rev.ID == reviewID {
				rev.Items = items
				return nil
			}
		}
	}
	return errors.New("review tidak ditemukan")
}

func (r *memoryRpsRepository) CompleteReview(reviewID string, rekomendasi, komentar string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for subID, revList := range r.reviews {
		for _, rev := range revList {
			if rev.ID == reviewID {
				rev.Status = "SELESAI_REVIEW"
				rev.Rekomendasi = rekomendasi
				rev.Komentar = komentar

				s, ok := r.subs[subID]
				if ok {
					if rekomendasi == "DISETUJUI" || rekomendasi == "DISETUJUI_GKM" {
						s.Status = model.RpsStatusDisetujuiGKM
					} else {
						s.Status = model.RpsStatusPerluRevisi
					}
					s.UpdatedAt = time.Now()
				}
				return nil
			}
		}
	}
	return errors.New("review tidak ditemukan")
}

func (r *memoryRpsRepository) UpdateImprovementPlans(submissionID string, plans []*model.CourseImprovementPlan) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.plans[submissionID] = plans
	return nil
}

func (r *memoryRpsRepository) GetRecap() (*model.RpsRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]*model.RpsSubmission, 0, len(r.subs))
	for _, s := range r.subs {
		list = append(list, s)
	}
	return computeRpsRecap(list), nil
}

// ============================================================
// Helper Functions
// ============================================================

func computeRpsRecap(subs []*model.RpsSubmission) *model.RpsRecap {
	recap := &model.RpsRecap{
		TotalPengajuan:   len(subs),
		TotalMataKuliah:  len(subs),
		StatusDistribusi: make(map[string]int),
	}

	for _, s := range subs {
		if s.Status == model.RpsStatusDisahkanKaprodi || s.Status == model.RpsStatusDisetujuiGKM || s.Status == model.RpsStatusDisetujui {
			recap.TotalDisetujui++
		}
		if s.Status == model.RpsStatusDraft || s.Status == model.RpsStatusDraf {
			recap.BelumMengumpulkan++
		}
		if s.Status == model.RpsStatusRevisi || s.Status == model.RpsStatusPerluRevisi {
			recap.BelumSelesaiRevisi++
		}
		recap.StatusDistribusi[string(s.Status)]++
	}

	if recap.TotalPengajuan > 0 {
		recap.PersentaseKepatuhan = (float64(recap.TotalDisetujui) / float64(recap.TotalPengajuan)) * 100
	}
	return recap
}
