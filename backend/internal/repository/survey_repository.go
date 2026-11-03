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

type SurveyRepository interface {
	FindSurveys() ([]*model.PartnerSurvey, error)
	FindSurveyByID(id string) (*model.PartnerSurvey, error)
	CreateSurvey(survey *model.PartnerSurvey) (*model.PartnerSurvey, error)
	UpdateSurvey(id string, survey *model.PartnerSurvey) (*model.PartnerSurvey, error)
	DeleteSurvey(id string) error
	FindInvitationByToken(token string) (*model.PartnerInvitation, error)
	CreateInvitation(inv *model.PartnerInvitation) (*model.PartnerInvitation, error)
	SubmitResponse(sub *model.PartnerResponseSubmission) error
	GetRecap(surveyID string) (*model.SurveyRecap, error)
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabaseSurveyRepository struct {
	client *database.SupabaseClient
}

func NewSupabaseSurveyRepository(client *database.SupabaseClient) SurveyRepository {
	return &supabaseSurveyRepository{client: client}
}

func (r *supabaseSurveyRepository) FindSurveys() ([]*model.PartnerSurvey, error) {
	var surveys []*model.PartnerSurvey
	err := r.client.Select("partner_surveys", map[string]string{
		"order": "created_at.desc",
	}, &surveys)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil daftar survei: %w", err)
	}
	return surveys, nil
}

func (r *supabaseSurveyRepository) FindSurveyByID(id string) (*model.PartnerSurvey, error) {
	var surveys []*model.PartnerSurvey
	err := r.client.Select("partner_surveys", map[string]string{
		"id":    fmt.Sprintf("eq.%s", id),
		"limit": "1",
	}, &surveys)
	if err != nil || len(surveys) == 0 {
		return nil, errors.New("survei tidak ditemukan")
	}

	survey := surveys[0]
	var questions []*model.SurveyQuestion
	_ = r.client.Select("survey_questions", map[string]string{
		"survey_id": fmt.Sprintf("eq.%s", id),
		"order":     "urutan.asc",
	}, &questions)
	survey.Questions = questions

	return survey, nil
}

func (r *supabaseSurveyRepository) CreateSurvey(survey *model.PartnerSurvey) (*model.PartnerSurvey, error) {
	if survey.ID == "" {
		survey.ID = uuid.New().String()
	}

	payload := map[string]interface{}{
		"id":             survey.ID,
		"judul":          survey.Judul,
		"program":        string(survey.Program),
		"tahun_akademik": survey.TahunAkademik,
		"is_active":      survey.IsActive,
	}

	var inserted []*model.PartnerSurvey
	if err := r.client.Insert("partner_surveys", payload, &inserted); err != nil {
		return nil, fmt.Errorf("gagal membuat survei: %w", err)
	}

	for _, q := range survey.Questions {
		if q.ID == "" {
			q.ID = uuid.New().String()
		}
		qPayload := map[string]interface{}{
			"id":         q.ID,
			"survey_id":  survey.ID,
			"aspek":      q.Aspek,
			"pertanyaan": q.Pertanyaan,
			"urutan":     q.Urutan,
			"skala_min":  q.SkalaMin,
			"skala_max":  q.SkalaMax,
		}
		_ = r.client.Insert("survey_questions", qPayload, nil)
	}

	survey.CreatedAt = time.Now()
	survey.UpdatedAt = time.Now()
	return survey, nil
}

func (r *supabaseSurveyRepository) UpdateSurvey(id string, survey *model.PartnerSurvey) (*model.PartnerSurvey, error) {
	payload := map[string]interface{}{
		"judul":     survey.Judul,
		"is_active": survey.IsActive,
	}
	var updated []*model.PartnerSurvey
	err := r.client.Update("partner_surveys", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, &updated)
	if err != nil {
		return nil, err
	}
	return r.FindSurveyByID(id)
}

func (r *supabaseSurveyRepository) DeleteSurvey(id string) error {
	return r.client.Delete("partner_surveys", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	})
}

func (r *supabaseSurveyRepository) FindInvitationByToken(token string) (*model.PartnerInvitation, error) {
	var invs []*model.PartnerInvitation
	err := r.client.Select("partner_invitations", map[string]string{
		"token": fmt.Sprintf("eq.%s", token),
		"limit": "1",
	}, &invs)
	if err != nil || len(invs) == 0 {
		return nil, errors.New("token survei tidak valid atau tidak ditemukan")
	}
	return invs[0], nil
}

func (r *supabaseSurveyRepository) CreateInvitation(inv *model.PartnerInvitation) (*model.PartnerInvitation, error) {
	if inv.ID == "" {
		inv.ID = uuid.New().String()
	}
	if inv.Token == "" {
		inv.Token = uuid.New().String()
	}

	payload := map[string]interface{}{
		"id":              inv.ID,
		"survey_id":       inv.SurveyID,
		"partner_id":      inv.PartnerID,
		"token":           inv.Token,
		"nama_pembimbing": inv.NamaPembimbing,
		"email_tujuan":    inv.EmailTujuan,
		"is_completed":    false,
	}
	var inserted []*model.PartnerInvitation
	if err := r.client.Insert("partner_invitations", payload, &inserted); err != nil {
		return nil, fmt.Errorf("gagal membuat undangan survei: %w", err)
	}
	inv.CreatedAt = time.Now()
	return inv, nil
}

func (r *supabaseSurveyRepository) SubmitResponse(sub *model.PartnerResponseSubmission) error {
	inv, err := r.FindInvitationByToken(sub.InvitationToken)
	if err != nil {
		return err
	}
	if inv.IsCompleted {
		return errors.New("survei ini sudah pernah diisi sebelumnya")
	}

	responseID := uuid.New().String()
	var totalScore float64
	for _, a := range sub.Answers {
		totalScore += float64(a.Nilai)
	}
	avgScore := 0.0
	if len(sub.Answers) > 0 {
		avgScore = totalScore / float64(len(sub.Answers))
	}

	respPayload := map[string]interface{}{
		"id":             responseID,
		"invitation_id":  inv.ID,
		"survey_id":      inv.SurveyID,
		"skor_rata_rata": avgScore,
		"saran_masukan":  sub.SaranMasukan,
	}
	if err := r.client.Insert("partner_responses", respPayload, nil); err != nil {
		return fmt.Errorf("gagal menyimpan respon survei: %w", err)
	}

	for _, a := range sub.Answers {
		itemPayload := map[string]interface{}{
			"id":          uuid.New().String(),
			"response_id": responseID,
			"question_id": a.QuestionID,
			"nilai":       a.Nilai,
		}
		_ = r.client.Insert("partner_response_items", itemPayload, nil)
	}

	_ = r.client.Update("partner_invitations", map[string]string{
		"id": fmt.Sprintf("eq.%s", inv.ID),
	}, map[string]interface{}{"is_completed": true}, nil)

	return nil
}

func (r *supabaseSurveyRepository) GetRecap(surveyID string) (*model.SurveyRecap, error) {
	survey, err := r.FindSurveyByID(surveyID)
	if err != nil {
		return nil, err
	}

	var responses []struct {
		ID           string  `json:"id"`
		SkorRataRata float64 `json:"skor_rata_rata"`
	}
	_ = r.client.Select("partner_responses", map[string]string{
		"survey_id": fmt.Sprintf("eq.%s", surveyID),
	}, &responses)

	totalResponden := len(responses)
	totalScore := 0.0
	for _, resp := range responses {
		totalScore += resp.SkorRataRata
	}

	avg := 0.0
	if totalResponden > 0 {
		avg = totalScore / float64(totalResponden)
	}

	return &model.SurveyRecap{
		SurveyID:       surveyID,
		Judul:          survey.Judul,
		TotalResponden: totalResponden,
		SkorRataRata:   avg,
		SkorPerAspek:   map[string]float64{},
	}, nil
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memorySurveyRepository struct {
	mu          sync.RWMutex
	surveys     map[string]*model.PartnerSurvey
	invitations map[string]*model.PartnerInvitation
	submissions map[string]*model.PartnerResponseSubmission
}

func NewMemorySurveyRepository() SurveyRepository {
	return &memorySurveyRepository{
		surveys:     make(map[string]*model.PartnerSurvey),
		invitations: make(map[string]*model.PartnerInvitation),
		submissions: make(map[string]*model.PartnerResponseSubmission),
	}
}

func (r *memorySurveyRepository) FindSurveys() ([]*model.PartnerSurvey, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	res := make([]*model.PartnerSurvey, 0, len(r.surveys))
	for _, s := range r.surveys {
		res = append(res, s)
	}
	return res, nil
}

func (r *memorySurveyRepository) FindSurveyByID(id string) (*model.PartnerSurvey, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.surveys[id]
	if !ok {
		return nil, errors.New("survei tidak ditemukan")
	}
	return s, nil
}

func (r *memorySurveyRepository) CreateSurvey(survey *model.PartnerSurvey) (*model.PartnerSurvey, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if survey.ID == "" {
		survey.ID = uuid.New().String()
	}
	for _, q := range survey.Questions {
		if q.ID == "" {
			q.ID = uuid.New().String()
		}
	}
	survey.CreatedAt = time.Now()
	survey.UpdatedAt = time.Now()
	r.surveys[survey.ID] = survey
	return survey, nil
}

func (r *memorySurveyRepository) UpdateSurvey(id string, survey *model.PartnerSurvey) (*model.PartnerSurvey, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	existing, ok := r.surveys[id]
	if !ok {
		return nil, errors.New("survei tidak ditemukan")
	}
	existing.Judul = survey.Judul
	existing.IsActive = survey.IsActive
	existing.UpdatedAt = time.Now()
	return existing, nil
}

func (r *memorySurveyRepository) DeleteSurvey(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.surveys, id)
	return nil
}

func (r *memorySurveyRepository) FindInvitationByToken(token string) (*model.PartnerInvitation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	inv, ok := r.invitations[token]
	if !ok {
		return nil, errors.New("token tidak ditemukan")
	}
	return inv, nil
}

func (r *memorySurveyRepository) CreateInvitation(inv *model.PartnerInvitation) (*model.PartnerInvitation, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if inv.ID == "" {
		inv.ID = uuid.New().String()
	}
	if inv.Token == "" {
		inv.Token = uuid.New().String()
	}
	inv.CreatedAt = time.Now()
	r.invitations[inv.Token] = inv
	return inv, nil
}

func (r *memorySurveyRepository) SubmitResponse(sub *model.PartnerResponseSubmission) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	inv, ok := r.invitations[sub.InvitationToken]
	if !ok {
		return errors.New("undangan tidak ditemukan")
	}
	if inv.IsCompleted {
		return errors.New("survei sudah diisi")
	}
	inv.IsCompleted = true
	r.submissions[sub.InvitationToken] = sub
	return nil
}

func (r *memorySurveyRepository) GetRecap(surveyID string) (*model.SurveyRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.surveys[surveyID]
	if !ok {
		return nil, errors.New("survei tidak ditemukan")
	}

	total := 0
	var sumScore float64
	for _, sub := range r.submissions {
		total++
		for _, a := range sub.Answers {
			sumScore += float64(a.Nilai)
		}
	}

	avg := 0.0
	if total > 0 && len(s.Questions) > 0 {
		avg = sumScore / float64(total*len(s.Questions))
	}

	return &model.SurveyRecap{
		SurveyID:       surveyID,
		Judul:          s.Judul,
		TotalResponden: total,
		SkorRataRata:   avg,
		SkorPerAspek:   map[string]float64{},
	}, nil
}
