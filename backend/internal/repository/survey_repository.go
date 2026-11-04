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
	FindInvitations() ([]*model.PartnerInvitation, error)
	FindInvitationByToken(token string) (*model.PartnerInvitation, error)
	CreateInvitation(inv *model.PartnerInvitation) (*model.PartnerInvitation, error)
	SubmitResponse(sub *model.PartnerResponseSubmission) error
	SubmitManualResponse(sub *model.PartnerResponseSubmission) error
	ActivateTemplate(id string) error
	DuplicateTemplate(id string, createdBy string) (*model.PartnerSurvey, error)
	ArchiveTemplate(id string) error
	UpdateInvitationStatus(id string, status string) error
	FindPlacements(program, academicPeriodID string) ([]*model.StudentPlacement, error)
	VoidResponse(id string, voidedBy, alasan string) error
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
	if survey.Judul == "" && survey.Nama != "" {
		survey.Judul = survey.Nama
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

func (r *supabaseSurveyRepository) FindInvitations() ([]*model.PartnerInvitation, error) {
	var invs []*model.PartnerInvitation
	err := r.client.Select("partner_invitations", map[string]string{
		"order": "created_at.desc",
	}, &invs)
	if err != nil {
		return nil, err
	}
	return invs, nil
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
		"id":                       inv.ID,
		"survey_id":                inv.SurveyID,
		"partner_id":               inv.PartnerID,
		"token":                    inv.Token,
		"nama_pembimbing_lapangan": inv.NamaPembimbing,
		"email_tujuan":             inv.EmailTujuan,
		"is_completed":             false,
	}
	if inv.PlacementID != "" {
		payload["placement_id"] = inv.PlacementID
	}
	if inv.AcademicPeriodID != "" {
		payload["academic_period_id"] = inv.AcademicPeriodID
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
		"id":              responseID,
		"invitation_id":   inv.ID,
		"survey_id":       inv.SurveyID,
		"partner_id":      inv.PartnerID,
		"nama_pengisi":    sub.NamaPengisi,
		"jabatan_pengisi": sub.Jabatan,
		"sumber":          "TAUTAN_MITRA",
		"skor_rata_rata":  avgScore,
		"saran_masukan":   sub.SaranMasukan,
	}
	if inv.PlacementID != "" {
		respPayload["placement_id"] = inv.PlacementID
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
	}, map[string]interface{}{"is_completed": true, "status": "DIISI"}, nil)

	return nil
}

func (r *supabaseSurveyRepository) SubmitManualResponse(sub *model.PartnerResponseSubmission) error {
	responseID := uuid.New().String()
	var totalScore float64
	for _, a := range sub.Answers {
		totalScore += float64(a.Nilai)
	}
	avgScore := sub.SkorRataRata
	if avgScore == 0 && len(sub.Answers) > 0 {
		avgScore = totalScore / float64(len(sub.Answers))
	}

	respPayload := map[string]interface{}{
		"id":                  responseID,
		"survey_id":           sub.SurveyID,
		"nama_pengisi":        sub.NamaPengisi,
		"jabatan_pengisi":     sub.Jabatan,
		"sumber":              "INPUT_KOORDINATOR",
		"alasan_input_manual": sub.AlasanInputManual,
		"bukti_dokumen_url":   sub.BuktiDokumenURL,
		"skor_rata_rata":      avgScore,
		"saran_masukan":       sub.SaranMasukan,
	}
	if sub.PartnerID != "" {
		respPayload["partner_id"] = sub.PartnerID
	}
	if sub.PlacementID != "" {
		respPayload["placement_id"] = sub.PlacementID
	}
	if sub.DiinputOleh != "" {
		respPayload["diinput_oleh"] = sub.DiinputOleh
	}

	if err := r.client.Insert("partner_responses", respPayload, nil); err != nil {
		return fmt.Errorf("gagal menyimpan input manual survei: %w", err)
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

	return nil
}

func (r *supabaseSurveyRepository) ActivateTemplate(id string) error {
	return r.client.Update("partner_surveys", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{
		"status":    "AKTIF",
		"is_active": true,
	}, nil)
}

func (r *supabaseSurveyRepository) DuplicateTemplate(id string, createdBy string) (*model.PartnerSurvey, error) {
	orig, err := r.FindSurveyByID(id)
	if err != nil {
		return nil, err
	}
	newID := uuid.New().String()
	newSurvey := &model.PartnerSurvey{
		ID:            newID,
		Judul:         orig.Judul + " (Salinan)",
		Nama:          orig.Judul + " (Salinan)",
		Program:       orig.Program,
		TahunAkademik: orig.TahunAkademik,
		SkalaMaks:     orig.SkalaMaks,
		Status:        "DRAF",
		IsActive:      false,
	}
	var inserted []*model.PartnerSurvey
	if err := r.client.Insert("partner_surveys", newSurvey, &inserted); err != nil {
		return nil, err
	}
	for _, q := range orig.Questions {
		newQ := *q
		newQ.ID = uuid.New().String()
		newQ.SurveyID = newID
		_ = r.client.Insert("survey_questions", newQ, nil)
	}
	return r.FindSurveyByID(newID)
}

func (r *supabaseSurveyRepository) ArchiveTemplate(id string) error {
	return r.client.Update("partner_surveys", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{
		"status":    "DIARSIPKAN",
		"is_active": false,
	}, nil)
}

func (r *supabaseSurveyRepository) UpdateInvitationStatus(id string, status string) error {
	payload := map[string]interface{}{
		"status": status,
	}
	if status == "TERKIRIM" {
		payload["terkirim_at"] = time.Now().Format(time.RFC3339)
	}
	return r.client.Update("partner_invitations", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabaseSurveyRepository) FindPlacements(program, academicPeriodID string) ([]*model.StudentPlacement, error) {
	params := map[string]string{
		"order": "nama_mahasiswa.asc",
	}
	if program != "" {
		params["program"] = fmt.Sprintf("eq.%s", program)
	}
	if academicPeriodID != "" {
		params["academic_period_id"] = fmt.Sprintf("eq.%s", academicPeriodID)
	}
	var list []*model.StudentPlacement
	err := r.client.Select("student_placements", params, &list)
	if err != nil {
		return nil, fmt.Errorf("gagal query student placements: %w", err)
	}
	return list, nil
}

func (r *supabaseSurveyRepository) VoidResponse(id string, voidedBy, alasan string) error {
	now := time.Now()
	return r.client.Update("partner_responses", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, map[string]interface{}{
		"is_void":     true,
		"alasan_void": alasan,
		"divoid_oleh": voidedBy,
		"divoid_at":   now.Format(time.RFC3339),
	}, nil)
}

func (r *supabaseSurveyRepository) GetRecap(surveyID string) (*model.SurveyRecap, error) {
	survey, err := r.FindSurveyByID(surveyID)
	if err != nil {
		return nil, err
	}

	var responses []struct {
		ID           string  `json:"id"`
		PartnerID    string  `json:"partner_id"`
		SkorRataRata float64 `json:"skor_rata_rata"`
	}
	_ = r.client.Select("partner_responses", map[string]string{
		"survey_id": fmt.Sprintf("eq.%s", surveyID),
	}, &responses)

	totalInv, _ := r.client.Count("partner_invitations", map[string]string{
		"survey_id": fmt.Sprintf("eq.%s", surveyID),
	})

	totalResponden := len(responses)
	totalScore := 0.0
	skorPerMitra := make(map[string]float64)
	countPerMitra := make(map[string]int)

	for _, resp := range responses {
		totalScore += resp.SkorRataRata
		if resp.PartnerID != "" {
			skorPerMitra[resp.PartnerID] += resp.SkorRataRata
			countPerMitra[resp.PartnerID]++
		}
	}

	for k, sum := range skorPerMitra {
		if countPerMitra[k] > 0 {
			skorPerMitra[k] = sum / float64(countPerMitra[k])
		}
	}

	avg := 0.0
	if totalResponden > 0 {
		avg = totalScore / float64(totalResponden)
	}

	responseRate := 0.0
	if totalInv > 0 {
		responseRate = (float64(totalResponden) / float64(totalInv)) * 100
	} else if totalResponden > 0 {
		responseRate = 100.0
	}

	return &model.SurveyRecap{
		SurveyID:       surveyID,
		Judul:          survey.Judul,
		TotalUndangan:  totalInv,
		TotalResponden: totalResponden,
		ResponseRate:   responseRate,
		SkorRataRata:   avg,
		SkorPerAspek:   map[string]float64{},
		SkorPerProgram: map[string]float64{string(survey.Program): avg},
		SkorPerMitra:   skorPerMitra,
		TrenPeriode: []*model.SurveyTrendPoint{
			{Periode: survey.TahunAkademik, SkorRataRata: avg, Responden: totalResponden},
		},
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
	if survey.Judul == "" && survey.Nama != "" {
		survey.Judul = survey.Nama
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
	if len(survey.Questions) > 0 {
		existing.Questions = survey.Questions
	}
	existing.UpdatedAt = time.Now()
	return existing, nil
}

func (r *memorySurveyRepository) DeleteSurvey(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.surveys, id)
	return nil
}

func (r *memorySurveyRepository) FindInvitations() ([]*model.PartnerInvitation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	res := make([]*model.PartnerInvitation, 0, len(r.invitations))
	for _, inv := range r.invitations {
		res = append(res, inv)
	}
	return res, nil
}

func (r *memorySurveyRepository) FindInvitationByToken(token string) (*model.PartnerInvitation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	inv, ok := r.invitations[token]
	if !ok {
		return nil, errors.New("token tidak valid")
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
		return errors.New("token tidak valid")
	}
	if inv.IsCompleted {
		return errors.New("survei sudah pernah diisi")
	}
	inv.IsCompleted = true
	inv.Status = "DIISI"
	if sub.SurveyID == "" {
		sub.SurveyID = inv.SurveyID
	}
	if sub.PartnerID == "" {
		sub.PartnerID = inv.PartnerID
	}
	if sub.Sumber == "" {
		sub.Sumber = "TAUTAN_MITRA"
	}
	sub.SubmittedAt = time.Now()
	r.submissions[sub.InvitationToken] = sub
	return nil
}

func (r *memorySurveyRepository) SubmitManualResponse(sub *model.PartnerResponseSubmission) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if sub.ID == "" {
		sub.ID = uuid.New().String()
	}
	sub.Sumber = "INPUT_KOORDINATOR"
	sub.SubmittedAt = time.Now()
	key := "manual-" + sub.ID
	r.submissions[key] = sub
	return nil
}

func (r *memorySurveyRepository) ActivateTemplate(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.surveys[id]
	if !ok {
		return errors.New("survei template tidak ditemukan")
	}
	s.Status = "AKTIF"
	s.IsActive = true
	s.UpdatedAt = time.Now()
	return nil
}

func (r *memorySurveyRepository) DuplicateTemplate(id string, createdBy string) (*model.PartnerSurvey, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.surveys[id]
	if !ok {
		return nil, errors.New("survei template tidak ditemukan")
	}
	newID := uuid.New().String()
	newSurvey := &model.PartnerSurvey{
		ID:            newID,
		Judul:         s.Judul + " (Salinan)",
		Nama:          s.Judul + " (Salinan)",
		Program:       s.Program,
		TahunAkademik: s.TahunAkademik,
		SkalaMaks:     s.SkalaMaks,
		Status:        "DRAF",
		IsActive:      false,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	var newQuestions []*model.SurveyQuestion
	for _, q := range s.Questions {
		newQ := *q
		newQ.ID = uuid.New().String()
		newQ.SurveyID = newID
		newQuestions = append(newQuestions, &newQ)
	}
	newSurvey.Questions = newQuestions
	r.surveys[newID] = newSurvey
	return newSurvey, nil
}

func (r *memorySurveyRepository) ArchiveTemplate(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.surveys[id]
	if !ok {
		return errors.New("survei template tidak ditemukan")
	}
	s.Status = "DIARSIPKAN"
	s.IsActive = false
	s.UpdatedAt = time.Now()
	return nil
}

func (r *memorySurveyRepository) UpdateInvitationStatus(id string, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	inv, ok := r.invitations[id]
	if !ok {
		return errors.New("undangan survei tidak ditemukan")
	}
	inv.Status = status
	if status == "DIISI" {
		inv.IsCompleted = true
	}
	return nil
}

func (r *memorySurveyRepository) FindPlacements(program, academicPeriodID string) ([]*model.StudentPlacement, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	mockPlacements := []*model.StudentPlacement{
		{
			ID:               "plc-001",
			StudentID:        "mhs-101",
			NamaMahasiswa:    "Fajar Pratama",
			NIM:              "1202200001",
			PartnerID:        "part-001",
			NamaMitra:        "PT Telkom Indonesia (Persero) Tbk",
			AcademicPeriodID: "2024-ganjil",
			PeriodeLabel:     "Ganjil 2024/2025",
			Program:          model.ProgramKP,
			TanggalMulai:     "2024-07-01",
			TanggalSelesai:   "2024-09-30",
		},
		{
			ID:               "plc-002",
			StudentID:        "mhs-102",
			NamaMahasiswa:    "Nabila Putri",
			NIM:              "1202200002",
			PartnerID:        "part-002",
			NamaMitra:        "Bank Mandiri (Persero) Tbk",
			AcademicPeriodID: "2024-ganjil",
			PeriodeLabel:     "Ganjil 2024/2025",
			Program:          model.ProgramPSI,
			TanggalMulai:     "2024-08-01",
			TanggalSelesai:   "2024-11-30",
		},
		{
			ID:               "plc-003",
			StudentID:        "mhs-103",
			NamaMahasiswa:    "Budi Santoso",
			NIM:              "1202200003",
			PartnerID:        "part-003",
			NamaMitra:        "PT Astra Graphia Information Technology",
			AcademicPeriodID: "2024-ganjil",
			PeriodeLabel:     "Ganjil 2024/2025",
			Program:          model.ProgramPDLK,
			TanggalMulai:     "2024-07-15",
			TanggalSelesai:   "2024-12-15",
		},
	}
	var results []*model.StudentPlacement
	for _, p := range mockPlacements {
		if program != "" && string(p.Program) != program {
			continue
		}
		if academicPeriodID != "" && p.AcademicPeriodID != academicPeriodID {
			continue
		}
		results = append(results, p)
	}
	return results, nil
}

func (r *memorySurveyRepository) VoidResponse(id string, voidedBy, alasan string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, resp := range r.responses {
		if resp.ID == id || resp.InvitationToken == id {
			now := time.Now()
			resp.IsVoid = true
			resp.AlasanVoid = alasan
			resp.DivoidOleh = voidedBy
			resp.DivoidAt = &now
			return nil
		}
	}
	return errors.New("respons survei tidak ditemukan")
}

func (r *memorySurveyRepository) GetRecap(surveyID string) (*model.SurveyRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.surveys[surveyID]
	if !ok {
		return nil, errors.New("survei tidak ditemukan")
	}

	totalInv := 0
	for _, inv := range r.invitations {
		if inv.SurveyID == surveyID {
			totalInv++
		}
	}

	totalResponden := 0
	totalScore := 0.0
	skorPerAspek := make(map[string]float64)
	countPerAspek := make(map[string]int)
	skorPerMitra := make(map[string]float64)
	countPerMitra := make(map[string]int)

	questionAspect := make(map[string]string)
	for _, q := range s.Questions {
		questionAspect[q.ID] = q.Aspek
	}

	for token, sub := range r.submissions {
		matchesSurvey := sub.SurveyID == surveyID
		var partnerKey string
		if inv, exists := r.invitations[token]; exists && inv.SurveyID == surveyID {
			matchesSurvey = true
			partnerKey = inv.PartnerID
		}
		if sub.PartnerID != "" {
			partnerKey = sub.PartnerID
		}
		if !matchesSurvey {
			continue
		}

		totalResponden++
		qSum := 0
		for _, a := range sub.Answers {
			qSum += a.Nilai
			aspek := a.Aspek
			if aspek == "" {
				aspek = questionAspect[a.QuestionID]
			}
			if aspek != "" {
				skorPerAspek[aspek] += float64(a.Nilai)
				countPerAspek[aspek]++
			}
		}

		respAvg := sub.SkorRataRata
		if len(sub.Answers) > 0 {
			respAvg = float64(qSum) / float64(len(sub.Answers))
		}
		totalScore += respAvg

		if partnerKey != "" {
			skorPerMitra[partnerKey] += respAvg
			countPerMitra[partnerKey]++
		}
	}

	for aspek, sum := range skorPerAspek {
		if countPerAspek[aspek] > 0 {
			skorPerAspek[aspek] = sum / float64(countPerAspek[aspek])
		}
	}
	for mitra, sum := range skorPerMitra {
		if countPerMitra[mitra] > 0 {
			skorPerMitra[mitra] = sum / float64(countPerMitra[mitra])
		}
	}

	avg := 0.0
	if totalResponden > 0 {
		avg = totalScore / float64(totalResponden)
	}

	responseRate := 0.0
	if totalInv > 0 {
		responseRate = (float64(totalResponden) / float64(totalInv)) * 100
	} else if totalResponden > 0 {
		responseRate = 100.0
	}

	return &model.SurveyRecap{
		SurveyID:       s.ID,
		Judul:          s.Judul,
		TotalUndangan:  totalInv,
		TotalResponden: totalResponden,
		ResponseRate:   responseRate,
		SkorRataRata:   avg,
		SkorPerAspek:   skorPerAspek,
		SkorPerProgram: map[string]float64{string(s.Program): avg},
		SkorPerMitra:   skorPerMitra,
		TrenPeriode: []*model.SurveyTrendPoint{
			{Periode: s.TahunAkademik, SkorRataRata: avg, Responden: totalResponden},
		},
	}, nil
}
