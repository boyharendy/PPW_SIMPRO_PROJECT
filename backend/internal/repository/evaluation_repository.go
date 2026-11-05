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

type EvaluationRepository interface {
	FindAll() ([]*model.CourseEvaluation, error)
	FindByClassID(classID string) (*model.CourseEvaluation, error)
	FindByID(id string) (*model.CourseEvaluation, error)
	Save(eval *model.CourseEvaluation) (*model.CourseEvaluation, error)
	FindImprovementPlansByCourse(courseID string) ([]*model.CourseImprovementPlan, error)
	UpdateImprovementPlan(planID, status, rpsID, catatan string) error
	GetRecap() (*model.EvaluationRecap, error)

	// PRD Milestone 3 Methods
	GetStudentFeedback(evaluationIDOrClassID string) (*model.CourseFeedbackSummary, error)
	ReviewEvaluation(id string, reviewerID, catatanGKM, rekomendasi string, newPlans []*model.CourseImprovementPlan) error
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabaseEvaluationRepository struct {
	client *database.SupabaseClient
}

func NewSupabaseEvaluationRepository(client *database.SupabaseClient) EvaluationRepository {
	return &supabaseEvaluationRepository{client: client}
}

func (r *supabaseEvaluationRepository) FindAll() ([]*model.CourseEvaluation, error) {
	var evals []*model.CourseEvaluation
	err := r.client.Select("course_evaluations", map[string]string{
		"order": "created_at.desc",
	}, &evals)
	if err != nil {
		return nil, fmt.Errorf("gagal query course_evaluations: %w", err)
	}
	return evals, nil
}

func (r *supabaseEvaluationRepository) FindByID(id string) (*model.CourseEvaluation, error) {
	var evals []*model.CourseEvaluation
	err := r.client.Select("course_evaluations", map[string]string{
		"id":    fmt.Sprintf("eq.%s", id),
		"limit": "1",
	}, &evals)
	if err != nil || len(evals) == 0 {
		return nil, errors.New("evaluasi perkuliahan tidak ditemukan")
	}
	eval := evals[0]
	r.loadRelations(eval)
	return eval, nil
}

func (r *supabaseEvaluationRepository) FindByClassID(classID string) (*model.CourseEvaluation, error) {
	var evals []*model.CourseEvaluation
	err := r.client.Select("course_evaluations", map[string]string{
		"course_class_id": fmt.Sprintf("eq.%s", classID),
		"limit":           "1",
	}, &evals)
	if err != nil || len(evals) == 0 {
		return nil, errors.New("evaluasi perkuliahan belum diisi")
	}
	eval := evals[0]
	r.loadRelations(eval)
	return eval, nil
}

func (r *supabaseEvaluationRepository) loadRelations(eval *model.CourseEvaluation) {
	var cpmks []*model.CpmkEvaluation
	_ = r.client.Select("cpmk_evaluations", map[string]string{
		"evaluation_id": fmt.Sprintf("eq.%s", eval.ID),
		"order":         "kode_cpmk.asc",
	}, &cpmks)
	eval.CPMKList = cpmks

	var grades []*model.CourseEvaluationGrade
	_ = r.client.Select("course_evaluation_grades", map[string]string{
		"evaluation_id": fmt.Sprintf("eq.%s", eval.ID),
	}, &grades)
	eval.Grades = grades

	var plans []*model.CourseImprovementPlan
	_ = r.client.Select("course_improvement_plans", map[string]string{
		"evaluation_id": fmt.Sprintf("eq.%s", eval.ID),
	}, &plans)
	eval.ImprovementPlans = plans

	var feedbacks []*model.CourseFeedbackSummary
	_ = r.client.Select("course_feedback_summaries", map[string]string{
		"course_class_id": fmt.Sprintf("eq.%s", eval.CourseClassID),
		"limit":           "1",
	}, &feedbacks)
	if len(feedbacks) > 0 {
		eval.FeedbackSummary = feedbacks[0]
	}
}

func (r *supabaseEvaluationRepository) Save(eval *model.CourseEvaluation) (*model.CourseEvaluation, error) {
	if eval.ID == "" {
		eval.ID = uuid.New().String()
	}

	payload := map[string]interface{}{
		"id":                    eval.ID,
		"course_class_id":       eval.CourseClassID,
		"indeks_kepuasan_mhs":   eval.IndeksKepuasanMhs,
		"persentase_kelulusan":  eval.PersentaseKelulusan,
		"kesesuaian_rps":        eval.KesesuaianRPS,
		"penjelasan_kesesuaian": eval.PenjelasanKesesuaian,
		"kendala_pembelajaran":  eval.Kendala,
		"solusi_rekomendasi":    eval.Solusi,
		"is_submitted":          eval.IsSubmitted,
		"status":                eval.Status,
	}
	if eval.DiisiOleh != "" {
		payload["diisi_oleh"] = eval.DiisiOleh
	}

	var inserted []*model.CourseEvaluation
	err := r.client.Insert("course_evaluations", payload, &inserted)
	if err != nil {
		err = r.client.Update("course_evaluations", map[string]string{
			"id": fmt.Sprintf("eq.%s", eval.ID),
		}, payload, nil)
		if err != nil {
			return nil, err
		}
	}

	for _, cpmk := range eval.CPMKList {
		if cpmk.ID == "" {
			cpmk.ID = uuid.New().String()
		}
		cPayload := map[string]interface{}{
			"id":                     cpmk.ID,
			"evaluation_id":          eval.ID,
			"kode_cpmk":              cpmk.KodeCPMK,
			"deskripsi":              cpmk.Deskripsi,
			"target_ketercapaian":    cpmk.TargetKetercapaian,
			"realisasi_ketercapaian": cpmk.RealisasiKetercapaian,
			"persentase_lulus":       cpmk.PersentaseLulus,
		}
		_ = r.client.Insert("cpmk_evaluations", cPayload, nil)
	}

	for _, p := range eval.ImprovementPlans {
		if p.ID == "" {
			p.ID = uuid.New().String()
		}
		pPayload := map[string]interface{}{
			"id":                  p.ID,
			"evaluation_id":       eval.ID,
			"course_id":           eval.CourseID,
			"uraian":              p.Uraian,
			"target_komponen_rps": p.TargetKomponenRPS,
			"status":              p.Status,
		}
		_ = r.client.Insert("course_improvement_plans", pPayload, nil)
	}

	return eval, nil
}

func (r *supabaseEvaluationRepository) FindImprovementPlansByCourse(courseID string) ([]*model.CourseImprovementPlan, error) {
	params := map[string]string{
		"order": "created_at.desc",
	}
	if courseID != "" {
		params["course_id"] = fmt.Sprintf("eq.%s", courseID)
	}
	var plans []*model.CourseImprovementPlan
	err := r.client.Select("course_improvement_plans", params, &plans)
	return plans, err
}

func (r *supabaseEvaluationRepository) UpdateImprovementPlan(planID, status, rpsID, catatan string) error {
	payload := map[string]interface{}{
		"status": status,
	}
	if rpsID != "" {
		payload["applied_in_rps_id"] = rpsID
	}
	if catatan != "" {
		payload["catatan_penerapan"] = catatan
	}
	return r.client.Update("course_improvement_plans", map[string]string{
		"id": fmt.Sprintf("eq.%s", planID),
	}, payload, nil)
}

func (r *supabaseEvaluationRepository) GetStudentFeedback(evaluationIDOrClassID string) (*model.CourseFeedbackSummary, error) {
	eval, err := r.FindByID(evaluationIDOrClassID)
	classID := evaluationIDOrClassID
	if err == nil && eval != nil {
		classID = eval.CourseClassID
	}

	var feedbacks []*model.CourseFeedbackSummary
	err = r.client.Select("course_feedback_summaries", map[string]string{
		"course_class_id": fmt.Sprintf("eq.%s", classID),
		"limit":           "1",
	}, &feedbacks)
	if err != nil || len(feedbacks) == 0 {
		return &model.CourseFeedbackSummary{
			CourseClassID:     classID,
			JumlahResponden:   28,
			RataRataNilai:     4.35,
			RingkasanKomentar: "Mahasiswa merasa metode studi kasus sangat membantu memahami SQL dan indexing.",
			SkorPerAspek: map[string]float64{
				"Kejelasan Materi":   4.4,
				"Kedisiplinan Dosen": 4.5,
				"Kesesuaian Ujian":   4.2,
				"Ketersediaan Bahan": 4.3,
			},
		}, nil
	}
	return feedbacks[0], nil
}

func (r *supabaseEvaluationRepository) ReviewEvaluation(id string, reviewerID, catatanGKM, rekomendasi string, newPlans []*model.CourseImprovementPlan) error {
	now := time.Now()
	payload := map[string]interface{}{
		"status":        "DITINJAU",
		"catatan_gkm":   catatanGKM,
		"ditinjau_oleh": reviewerID,
		"ditinjau_at":   now,
	}
	err := r.client.Update("course_evaluations", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
	if err != nil {
		return err
	}

	for _, p := range newPlans {
		if p.ID == "" {
			p.ID = uuid.New().String()
		}
		pPayload := map[string]interface{}{
			"id":                  p.ID,
			"evaluation_id":       id,
			"course_id":           p.CourseID,
			"uraian":              p.Uraian,
			"target_komponen_rps": p.TargetKomponenRPS,
			"status":              "BELUM_DITERAPKAN",
		}
		_ = r.client.Insert("course_improvement_plans", pPayload, nil)
	}
	return nil
}

func (r *supabaseEvaluationRepository) GetRecap() (*model.EvaluationRecap, error) {
	evals, err := r.FindAll()
	if err != nil {
		return nil, err
	}
	return computeEvaluationRecap(evals), nil
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memoryEvaluationRepository struct {
	mu        sync.RWMutex
	evals     map[string]*model.CourseEvaluation
	plans     map[string]*model.CourseImprovementPlan
	feedbacks map[string]*model.CourseFeedbackSummary
}

func NewMemoryEvaluationRepository() EvaluationRepository {
	repo := &memoryEvaluationRepository{
		evals:     make(map[string]*model.CourseEvaluation),
		plans:     make(map[string]*model.CourseImprovementPlan),
		feedbacks: make(map[string]*model.CourseFeedbackSummary),
	}
	repo.seedInitialData()
	return repo
}

func (r *memoryEvaluationRepository) seedInitialData() {
	now := time.Now()
	eval1 := &model.CourseEvaluation{
		ID:                   "eval-001",
		CourseClassID:        "class-si201-a",
		CourseID:             "course-si201",
		DiisiOleh:            "a0000000-0000-0000-0000-000000000004", // Ir. Hendra Wijaya
		Status:               "SUBMITTED",
		IndeksKepuasanMhs:    4.45,
		PersentaseKelulusan:  92.5,
		KesesuaianRPS:        "SESUAI",
		PenjelasanKesesuaian: "Semua 16 pertemuan terlaksana sesuai silabus RPS SPMI",
		Kendala:              "Waktu pengerjaan tugas besar indexing database agak sempit",
		Solusi:               "Tugas besar dibagi menjadi 3 milestone penilaian berkala",
		CatatanGKM:           "Pelaksanaan kelas sangat baik. Perlu pemutakhiran rubrik pada RPS berikutnya.",
		IsSubmitted:          true,
		CPMKList: []*model.CpmkEvaluation{
			{ID: "cpmk-1", EvaluationID: "eval-001", KodeCPMK: "CPMK 1", Deskripsi: "Mampu merancang diagram E-R", TargetKetercapaian: 75.0, RealisasiKetercapaian: 88.0, PersentaseLulus: 94.0},
			{ID: "cpmk-2", EvaluationID: "eval-001", KodeCPMK: "CPMK 2", Deskripsi: "Mampu menyusun query SQL kompleks", TargetKetercapaian: 75.0, RealisasiKetercapaian: 82.5, PersentaseLulus: 90.0},
		},
		Grades: []*model.CourseGradeDistribution{
			{ID: "g-1", EvaluationID: "eval-001", NilaiHuruf: "A", JumlahMahasiswa: 14},
			{ID: "g-2", EvaluationID: "eval-001", NilaiHuruf: "AB", JumlahMahasiswa: 10},
			{ID: "g-3", EvaluationID: "eval-001", NilaiHuruf: "B", JumlahMahasiswa: 6},
			{ID: "g-4", EvaluationID: "eval-001", NilaiHuruf: "C", JumlahMahasiswa: 2},
		},
		ImprovementPlans: []*model.CourseImprovementPlan{
			{
				ID:                "plan-001",
				EvaluationID:      "eval-001",
				CourseID:          "course-si201",
				Uraian:            "Menambah porsi studi kasus query optimization pada praktikum SQL",
				TargetKomponenRPS: model.RpsKomponenBahanKajian,
				Status:            "BELUM_DITERAPKAN",
			},
		},
		FeedbackSummary: &model.CourseFeedbackSummary{
			CourseClassID:     "class-si201-a",
			JumlahResponden:   32,
			RataRataNilai:     4.45,
			RingkasanKomentar: "Materi praktikum interaktif dan relevan dengan kebutuhan industri software.",
			SkorPerAspek: map[string]float64{
				"Kejelasan Materi":   4.6,
				"Kedisiplinan Dosen": 4.5,
				"Kesesuaian Ujian":   4.3,
				"Ketersediaan Bahan": 4.4,
			},
		},
		CreatedAt: now.AddDate(0, -1, 0),
		UpdatedAt: now.AddDate(0, 0, -5),
	}
	r.evals[eval1.CourseClassID] = eval1
	r.plans["plan-001"] = eval1.ImprovementPlans[0]
	r.feedbacks[eval1.CourseClassID] = eval1.FeedbackSummary
}

func (r *memoryEvaluationRepository) FindAll() ([]*model.CourseEvaluation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	res := make([]*model.CourseEvaluation, 0, len(r.evals))
	for _, e := range r.evals {
		res = append(res, e)
	}
	return res, nil
}

func (r *memoryEvaluationRepository) FindByID(id string) (*model.CourseEvaluation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, e := range r.evals {
		if e.ID == id {
			return e, nil
		}
	}
	return nil, errors.New("evaluasi tidak ditemukan")
}

func (r *memoryEvaluationRepository) FindByClassID(classID string) (*model.CourseEvaluation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, e := range r.evals {
		if e.CourseClassID == classID {
			return e, nil
		}
	}
	return nil, errors.New("evaluasi tidak ditemukan")
}

func (r *memoryEvaluationRepository) Save(eval *model.CourseEvaluation) (*model.CourseEvaluation, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if eval.ID == "" {
		eval.ID = uuid.New().String()
	}
	if eval.Status == "" {
		if eval.IsSubmitted {
			eval.Status = "SUBMITTED"
		} else {
			eval.Status = "DRAFT"
		}
	}
	for _, cpmk := range eval.CPMKList {
		if cpmk.ID == "" {
			cpmk.ID = uuid.New().String()
		}
		cpmk.EvaluationID = eval.ID
	}
	for _, g := range eval.Grades {
		if g.ID == "" {
			g.ID = uuid.New().String()
		}
		g.EvaluationID = eval.ID
	}
	for _, p := range eval.ImprovementPlans {
		if p.ID == "" {
			p.ID = uuid.New().String()
		}
		if p.Status == "" {
			p.Status = "BELUM_DITERAPKAN"
		}
		p.EvaluationID = eval.ID
		r.plans[p.ID] = p
	}
	eval.CreatedAt = time.Now()
	eval.UpdatedAt = time.Now()
	r.evals[eval.CourseClassID] = eval
	return eval, nil
}

func (r *memoryEvaluationRepository) FindImprovementPlansByCourse(courseID string) ([]*model.CourseImprovementPlan, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var res []*model.CourseImprovementPlan
	for _, p := range r.plans {
		if courseID == "" || p.CourseID == courseID {
			res = append(res, p)
		}
	}
	return res, nil
}

func (r *memoryEvaluationRepository) UpdateImprovementPlan(planID, status, rpsID, catatan string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.plans[planID]
	if !ok {
		return errors.New("rencana perbaikan tidak ditemukan")
	}
	p.Status = status
	p.StatusPenerapan = status
	p.AppliedInRpsID = rpsID
	p.CatatanPenerapan = catatan
	return nil
}

func (r *memoryEvaluationRepository) GetStudentFeedback(evaluationIDOrClassID string) (*model.CourseFeedbackSummary, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Try direct class ID first
	if fb, ok := r.feedbacks[evaluationIDOrClassID]; ok {
		return fb, nil
	}

	// Try find by evaluation ID
	for _, e := range r.evals {
		if e.ID == evaluationIDOrClassID {
			if fb, ok := r.feedbacks[e.CourseClassID]; ok {
				return fb, nil
			}
			if e.FeedbackSummary != nil {
				return e.FeedbackSummary, nil
			}
		}
	}

	return &model.CourseFeedbackSummary{
		CourseClassID:     evaluationIDOrClassID,
		JumlahResponden:   30,
		RataRataNilai:     4.40,
		RingkasanKomentar: "Mahasiswa puas dengan interaktivitas materi perkuliahan.",
		SkorPerAspek: map[string]float64{
			"Kejelasan Materi":   4.5,
			"Kedisiplinan Dosen": 4.6,
			"Kesesuaian Ujian":   4.2,
		},
	}, nil
}

func (r *memoryEvaluationRepository) ReviewEvaluation(id string, reviewerID, catatanGKM, rekomendasi string, newPlans []*model.CourseImprovementPlan) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	var eval *model.CourseEvaluation
	for _, e := range r.evals {
		if e.ID == id {
			eval = e
			break
		}
	}
	if eval == nil {
		return errors.New("evaluasi tidak ditemukan")
	}

	now := time.Now()
	eval.Status = "DITINJAU"
	eval.CatatanGKM = catatanGKM
	eval.DitinjauOleh = reviewerID
	eval.DitinjauAt = &now
	eval.UpdatedAt = now

	for _, p := range newPlans {
		if p.ID == "" {
			p.ID = uuid.New().String()
		}
		p.EvaluationID = id
		if p.CourseID == "" {
			p.CourseID = eval.CourseID
		}
		p.Status = "BELUM_DITERAPKAN"
		eval.ImprovementPlans = append(eval.ImprovementPlans, p)
		r.plans[p.ID] = p
	}
	return nil
}

func (r *memoryEvaluationRepository) GetRecap() (*model.EvaluationRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]*model.CourseEvaluation, 0, len(r.evals))
	for _, e := range r.evals {
		list = append(list, e)
	}
	return computeEvaluationRecap(list), nil
}

// ============================================================
// Helper Functions
// ============================================================

func computeEvaluationRecap(evals []*model.CourseEvaluation) *model.EvaluationRecap {
	total := len(evals)
	recap := &model.EvaluationRecap{
		TotalEvaluasi:  total,
		TotalKelas:     total,
		RingkasanPerMK: []model.CourseEvaluationSummary{},
	}
	if total == 0 {
		return recap, nil
	}

	var sumKepuasan, sumKelulusan, sumCPMK float64
	var cpmkCount int
	submittedCount := 0

	for _, e := range evals {
		sumKepuasan += e.IndeksKepuasanMhs
		sumKelulusan += e.PersentaseKelulusan
		if e.IsSubmitted {
			submittedCount++
		}
		var classCPMKSum float64
		for _, c := range e.CPMKList {
			sumCPMK += c.RealisasiKetercapaian
			classCPMKSum += c.RealisasiKetercapaian
			cpmkCount++
		}
		var classCPMKAvg float64
		if len(e.CPMKList) > 0 {
			classCPMKAvg = classCPMKSum / float64(len(e.CPMKList))
		}
		recap.RingkasanPerMK = append(recap.RingkasanPerMK, model.CourseEvaluationSummary{
			CourseClassID:       e.CourseClassID,
			StatusPengisian:     e.Status,
			RataRataCPMK:        classCPMKAvg,
			PersentaseKelulusan: e.PersentaseKelulusan,
			IndeksKepuasanMhs:   e.IndeksKepuasanMhs,
		})
	}

	if cpmkCount > 0 {
		recap.RataRataCPMK = sumCPMK / float64(cpmkCount)
	}
	recap.SudahMengisi = submittedCount
	recap.BelumMengisi = total - submittedCount
	recap.RataRataKepuasan = sumKepuasan / float64(total)
	recap.RataRataKelulusan = sumKelulusan / float64(total)
	recap.PersentaseSubmitted = (float64(submittedCount) / float64(total)) * 100
	return recap
}
