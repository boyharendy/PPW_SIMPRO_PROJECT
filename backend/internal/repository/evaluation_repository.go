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
	Save(eval *model.CourseEvaluation) (*model.CourseEvaluation, error)
	FindImprovementPlansByCourse(courseID string) ([]*model.CourseImprovementPlan, error)
	UpdateImprovementPlan(planID, status, rpsID, catatan string) error
	GetRecap() (*model.EvaluationRecap, error)
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
		"course_class_id": fmt.Sprintf("eq.%s", classID),
		"limit":           "1",
	}, &feedbacks)
	if len(feedbacks) > 0 {
		eval.FeedbackSummary = feedbacks[0]
	}

	return eval, nil
}

func (r *supabaseEvaluationRepository) Save(eval *model.CourseEvaluation) (*model.CourseEvaluation, error) {
	if eval.Status == "" {
		if eval.IsSubmitted {
			eval.Status = "TERKIRIM"
		} else {
			eval.Status = "DRAFT"
		}
	}
	existing, _ := r.FindByClassID(eval.CourseClassID)
	if existing != nil {
		eval.ID = existing.ID
		payload := map[string]interface{}{
			"indeks_kepuasan_mhs":   eval.IndeksKepuasanMhs,
			"persentase_kelulusan":  eval.PersentaseKelulusan,
			"kendala":               eval.Kendala,
			"solusi":                eval.Solusi,
			"kesesuaian_rps":        eval.KesesuaianRPS,
			"penjelasan_kesesuaian": eval.PenjelasanKesesuaian,
			"status":                eval.Status,
			"is_submitted":          eval.IsSubmitted,
		}
		_ = r.client.Update("course_evaluations", map[string]string{
			"id": fmt.Sprintf("eq.%s", eval.ID),
		}, payload, nil)
	} else {
		if eval.ID == "" {
			eval.ID = uuid.New().String()
		}
		payload := map[string]interface{}{
			"id":                    eval.ID,
			"course_class_id":       eval.CourseClassID,
			"indeks_kepuasan_mhs":   eval.IndeksKepuasanMhs,
			"persentase_kelulusan":  eval.PersentaseKelulusan,
			"kendala":               eval.Kendala,
			"solusi":                eval.Solusi,
			"kesesuaian_rps":        eval.KesesuaianRPS,
			"penjelasan_kesesuaian": eval.PenjelasanKesesuaian,
			"status":                eval.Status,
			"is_submitted":          eval.IsSubmitted,
		}
		var inserted []*model.CourseEvaluation
		_ = r.client.Insert("course_evaluations", payload, &inserted)
	}

	// Insert/update CPMKs
	for _, cpmk := range eval.CPMKList {
		if cpmk.ID == "" {
			cpmk.ID = uuid.New().String()
		}
		cpmkPayload := map[string]interface{}{
			"id":                     cpmk.ID,
			"evaluation_id":          eval.ID,
			"kode_cpmk":              cpmk.KodeCPMK,
			"deskripsi":              cpmk.Deskripsi,
			"target_ketercapaian":    cpmk.TargetKetercapaian,
			"realisasi_ketercapaian": cpmk.RealisasiKetercapaian,
			"analisis_ketercapaian":  cpmk.AnalisisKetercapaian,
		}
		_ = r.client.Insert("cpmk_evaluations", cpmkPayload, nil)
	}

	// Insert/update Grades (FR-43)
	for _, g := range eval.Grades {
		if g.ID == "" {
			g.ID = uuid.New().String()
		}
		gPayload := map[string]interface{}{
			"id":               g.ID,
			"evaluation_id":    eval.ID,
			"nilai_huruf":      g.NilaiHuruf,
			"jumlah_mahasiswa": g.JumlahMahasiswa,
			"persentase":       g.Persentase,
		}
		_ = r.client.Insert("course_evaluation_grades", gPayload, nil)
	}

	// Insert/update Improvement Plans (FR-45)
	for _, p := range eval.ImprovementPlans {
		if p.ID == "" {
			p.ID = uuid.New().String()
		}
		if p.StatusPenerapan == "" {
			p.StatusPenerapan = "BELUM_DITERAPKAN"
		}
		pPayload := map[string]interface{}{
			"id":                p.ID,
			"evaluation_id":     eval.ID,
			"course_id":         p.CourseID,
			"aspek_perbaikan":   p.AspekPerbaikan,
			"rencana_tindakan":  p.RencanaTindakan,
			"target_semester":   p.TargetSemester,
			"status_penerapan":  p.StatusPenerapan,
			"applied_in_rps_id": p.AppliedInRpsID,
			"catatan_penerapan": p.CatatanPenerapan,
		}
		_ = r.client.Insert("course_improvement_plans", pPayload, nil)
	}

	eval.CreatedAt = time.Now()
	eval.UpdatedAt = time.Now()
	return eval, nil
}

func (r *supabaseEvaluationRepository) FindImprovementPlansByCourse(courseID string) ([]*model.CourseImprovementPlan, error) {
	var plans []*model.CourseImprovementPlan
	err := r.client.Select("course_improvement_plans", map[string]string{
		"course_id": fmt.Sprintf("eq.%s", courseID),
		"order":     "created_at.desc",
	}, &plans)
	if err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *supabaseEvaluationRepository) UpdateImprovementPlan(planID, status, rpsID, catatan string) error {
	payload := map[string]interface{}{
		"status_penerapan":  status,
		"catatan_penerapan": catatan,
	}
	if rpsID != "" {
		payload["applied_in_rps_id"] = rpsID
	}
	return r.client.Update("course_improvement_plans", map[string]string{
		"id": fmt.Sprintf("eq.%s", planID),
	}, payload, nil)
}

func (r *supabaseEvaluationRepository) GetRecap() (*model.EvaluationRecap, error) {
	var evals []*model.CourseEvaluation
	_ = r.client.Select("course_evaluations", map[string]string{
		"select": "id,course_class_id,indeks_kepuasan_mhs,persentase_kelulusan,is_submitted",
	}, &evals)

	var cpmks []*model.CpmkEvaluation
	_ = r.client.Select("cpmk_evaluations", map[string]string{}, &cpmks)

	total := len(evals)
	recap := &model.EvaluationRecap{
		TotalEvaluasi:  total,
		TotalKelas:     total,
		RingkasanPerMK: []model.CourseEvaluationSummary{},
	}
	if total == 0 {
		return recap, nil
	}

	var sumKepuasan, sumKelulusan float64
	submittedCount := 0
	for _, e := range evals {
		sumKepuasan += e.IndeksKepuasanMhs
		sumKelulusan += e.PersentaseKelulusan
		if e.IsSubmitted {
			submittedCount++
		}
	}

	var sumCPMK float64
	for _, c := range cpmks {
		sumCPMK += c.RealisasiKetercapaian
	}
	if len(cpmks) > 0 {
		recap.RataRataCPMK = sumCPMK / float64(len(cpmks))
	}

	recap.SudahMengisi = submittedCount
	recap.BelumMengisi = total - submittedCount
	recap.RataRataKepuasan = sumKepuasan / float64(total)
	recap.RataRataKelulusan = sumKelulusan / float64(total)
	recap.PersentaseSubmitted = (float64(submittedCount) / float64(total)) * 100
	return recap, nil
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memoryEvaluationRepository struct {
	mu    sync.RWMutex
	evals map[string]*model.CourseEvaluation
	plans map[string]*model.CourseImprovementPlan
}

func NewMemoryEvaluationRepository() EvaluationRepository {
	return &memoryEvaluationRepository{
		evals: make(map[string]*model.CourseEvaluation),
		plans: make(map[string]*model.CourseImprovementPlan),
	}
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
			eval.Status = "TERKIRIM"
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
		if p.StatusPenerapan == "" {
			p.StatusPenerapan = "BELUM_DITERAPKAN"
		}
		p.EvaluationID = eval.ID
		p.CreatedAt = time.Now()
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
	p.StatusPenerapan = status
	p.AppliedInRpsID = rpsID
	p.CatatanPenerapan = catatan
	return nil
}

func (r *memoryEvaluationRepository) GetRecap() (*model.EvaluationRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	total := len(r.evals)
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
	for _, e := range r.evals {
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
	return recap, nil
}
