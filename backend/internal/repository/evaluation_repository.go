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

	return eval, nil
}

func (r *supabaseEvaluationRepository) Save(eval *model.CourseEvaluation) (*model.CourseEvaluation, error) {
	existing, _ := r.FindByClassID(eval.CourseClassID)
	if existing != nil {
		eval.ID = existing.ID
		payload := map[string]interface{}{
			"indeks_kepuasan_mhs":  eval.IndeksKepuasanMhs,
			"persentase_kelulusan": eval.PersentaseKelulusan,
			"kendala":              eval.Kendala,
			"solusi":               eval.Solusi,
			"is_submitted":         eval.IsSubmitted,
		}
		_ = r.client.Update("course_evaluations", map[string]string{
			"id": fmt.Sprintf("eq.%s", eval.ID),
		}, payload, nil)
	} else {
		if eval.ID == "" {
			eval.ID = uuid.New().String()
		}
		payload := map[string]interface{}{
			"id":                   eval.ID,
			"course_class_id":      eval.CourseClassID,
			"indeks_kepuasan_mhs":  eval.IndeksKepuasanMhs,
			"persentase_kelulusan": eval.PersentaseKelulusan,
			"kendala":              eval.Kendala,
			"solusi":               eval.Solusi,
			"is_submitted":         eval.IsSubmitted,
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
		}
		_ = r.client.Insert("cpmk_evaluations", cpmkPayload, nil)
	}

	eval.CreatedAt = time.Now()
	eval.UpdatedAt = time.Now()
	return eval, nil
}

func (r *supabaseEvaluationRepository) GetRecap() (*model.EvaluationRecap, error) {
	var evals []*model.CourseEvaluation
	_ = r.client.Select("course_evaluations", map[string]string{
		"select": "id,indeks_kepuasan_mhs,persentase_kelulusan,is_submitted",
	}, &evals)

	total := len(evals)
	recap := &model.EvaluationRecap{TotalEvaluasi: total}
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
}

func NewMemoryEvaluationRepository() EvaluationRepository {
	return &memoryEvaluationRepository{
		evals: make(map[string]*model.CourseEvaluation),
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
	for _, cpmk := range eval.CPMKList {
		if cpmk.ID == "" {
			cpmk.ID = uuid.New().String()
		}
		cpmk.EvaluationID = eval.ID
	}
	eval.CreatedAt = time.Now()
	eval.UpdatedAt = time.Now()
	r.evals[eval.CourseClassID] = eval
	return eval, nil
}

func (r *memoryEvaluationRepository) GetRecap() (*model.EvaluationRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	total := len(r.evals)
	recap := &model.EvaluationRecap{TotalEvaluasi: total}
	if total == 0 {
		return recap, nil
	}

	var sumKepuasan, sumKelulusan float64
	submittedCount := 0
	for _, e := range r.evals {
		sumKepuasan += e.IndeksKepuasanMhs
		sumKelulusan += e.PersentaseKelulusan
		if e.IsSubmitted {
			submittedCount++
		}
	}

	recap.RataRataKepuasan = sumKepuasan / float64(total)
	recap.RataRataKelulusan = sumKelulusan / float64(total)
	recap.PersentaseSubmitted = (float64(submittedCount) / float64(total)) * 100
	return recap, nil
}
