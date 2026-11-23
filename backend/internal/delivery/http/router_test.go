package http_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"simpro-backend/internal/config"
	deliveryHttp "simpro-backend/internal/delivery/http"
	"simpro-backend/internal/delivery/http/handler"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func setupTestRouter() *deliveryHttp.RouterParams {
	cfg := &config.Config{
		ServerPort:         "8080",
		ServerEnv:          "test",
		APIPrefix:          "/api/v1",
		FrontendURL:        "http://localhost:3000",
		JWTSecret:          "test_jwt_secret_12345",
		JWTExpirationHours: 24,
		JWTRefreshDays:     7,
	}

	memRepo := repository.NewMemoryUserRepository()
	refRepo := repository.NewMemoryReferenceRepository()
	surveyRepo := repository.NewMemorySurveyRepository()
	complaintRepo := repository.NewMemoryComplaintRepository()
	pubRepo := repository.NewMemoryPublicationRepository()
	tripRepo := repository.NewMemoryTripRepository()
	rkaRepo := repository.NewMemoryRkaRepository()
	rpsRepo := repository.NewMemoryRpsRepository()
	evalRepo := repository.NewMemoryEvaluationRepository()

	authUsecase := usecase.NewAuthUsecase(memRepo, cfg)
	userUsecase := usecase.NewUserUsecase(memRepo)
	surveyUsecase := usecase.NewSurveyUsecase(surveyRepo)
	complaintUsecase := usecase.NewComplaintUsecase(complaintRepo)
	pubUsecase := usecase.NewPublicationUsecase(pubRepo)
	tripUsecase := usecase.NewTripUsecase(tripRepo)
	rkaUsecase := usecase.NewRkaUsecase(rkaRepo)
	rpsUsecase := usecase.NewRpsUsecase(rpsRepo)
	evalUsecase := usecase.NewEvaluationUsecase(evalRepo)
	adminRepo := repository.NewMemoryAdminRepository()
	adminUsecase := usecase.NewAdminUsecase(adminRepo, nil)

	return &deliveryHttp.RouterParams{
		Config:             cfg,
		AuthHandler:        handler.NewAuthHandler(authUsecase),
		UserHandler:        handler.NewUserHandler(userUsecase),
		HealthHandler:      handler.NewHealthHandler(cfg),
		ReferenceHandler:   handler.NewReferenceHandler(refRepo),
		SurveyHandler:      handler.NewSurveyHandler(surveyUsecase),
		ComplaintHandler:   handler.NewComplaintHandler(complaintUsecase),
		PublicationHandler: handler.NewPublicationHandler(pubUsecase),
		TripHandler:        handler.NewTripHandler(tripUsecase),
		RkaHandler:         handler.NewRkaHandler(rkaUsecase),
		RpsHandler:         handler.NewRpsHandler(rpsUsecase),
		EvaluationHandler:  handler.NewEvaluationHandler(evalUsecase),
		DashboardHandler:   handler.NewDashboardHandler(surveyRepo, pubRepo, tripRepo, rkaRepo, rpsRepo, evalRepo, complaintRepo),
		AdminHandler:       handler.NewAdminHandler(adminUsecase),
	}
}

func TestRouter_Health(t *testing.T) {
	params := setupTestRouter()
	r := deliveryHttp.SetupRouter(*params)

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestRouter_Auth_LoginAndProtectedRoutes(t *testing.T) {
	params := setupTestRouter()
	r := deliveryHttp.SetupRouter(*params)

	// 1. Unauthorized access to protected route
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/users", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 unauthorized, got %d", w.Code)
	}

	// 2. Login with valid seed credentials
	loginBody, _ := json.Marshal(map[string]string{
		"email":    "kaprodi@universitas.ac.id",
		"password": "password123",
	})
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 login success, got %d: %s", w.Code, w.Body.String())
	}

	var loginResp struct {
		Success bool `json:"success"`
		Data    struct {
			Tokens struct {
				AccessToken string `json:"access_token"`
			} `json:"tokens"`
		} `json:"data"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &loginResp)
	token := loginResp.Data.Tokens.AccessToken
	if token == "" {
		t.Fatalf("expected access token from login, got empty")
	}

	// 3. Access /auth/me with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /auth/me, got %d: %s", w.Code, w.Body.String())
	}

	// 4. Access /users/roles with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/users/roles", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /users/roles, got %d: %s", w.Code, w.Body.String())
	}

	// 5. Access /users list with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/users", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /users, got %d: %s", w.Code, w.Body.String())
	}

	// 6. Access /ref/academic-periods with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/ref/academic-periods", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /ref/academic-periods, got %d: %s", w.Code, w.Body.String())
	}

	// 7. Access /ref/courses with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/ref/courses", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /ref/courses, got %d: %s", w.Code, w.Body.String())
	}

	// 8. Test Public Complaint Submission & Tracking
	student := jsonRequest(t, r, "/api/v1/auth/register", "", map[string]any{"nama_lengkap": "Mahasiswa Uji", "email": "student@example.test", "password": "student-password"}, 201)
	studentAccess := student["data"].(map[string]any)["tokens"].(map[string]any)["access_token"].(string)
	grant := jsonRequest(t, r, "/api/v1/aduan/permit", studentAccess, nil, 200)
	permit := grant["data"].(map[string]any)["permit_token"].(string)
	complaintBody, _ := json.Marshal(map[string]interface{}{
		"kategori":    "FASILITAS",
		"judul":       "Lampu Ruang 301 Mati",
		"isi_aduan":   "Lampu di depan proyektor tidak menyala saat perkuliahan",
		"is_sensitif": false, "permit_token": permit,
	})
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/public/complaints", bytes.NewBuffer(complaintBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 for public complaint, got %d: %s", w.Code, w.Body.String())
	}

	var pubResp struct {
		Data struct {
			KodeTiket string `json:"kode_tiket"`
		} `json:"data"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &pubResp)
	ticket := pubResp.Data.KodeTiket
	if ticket == "" {
		t.Fatalf("expected non-empty ticket code")
	}

	// Public Track Complaint
	trackBody, _ := json.Marshal(map[string]string{"ticket": ticket})
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/public/complaints/track", bytes.NewReader(trackBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for tracking complaint, got %d: %s", w.Code, w.Body.String())
	}

	// 9. Access /complaints with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/complaints", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /complaints, got %d: %s", w.Code, w.Body.String())
	}

	// 10. Access /surveys with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/surveys", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /surveys, got %d: %s", w.Code, w.Body.String())
	}

	// 11. Access /publications with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/publications", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /publications, got %d: %s", w.Code, w.Body.String())
	}

	// 12. Access /trips with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/trips", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /trips, got %d: %s", w.Code, w.Body.String())
	}

	// 13. Access /rka with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/rka", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /rka, got %d: %s", w.Code, w.Body.String())
	}

	// 14. Access /rps with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/rps", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /rps, got %d: %s", w.Code, w.Body.String())
	}

	// 15. Access /evaluations with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/evaluations", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /evaluations, got %d: %s", w.Code, w.Body.String())
	}

	// 16. Access /dashboard/stats with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/dashboard/stats", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /dashboard/stats, got %d: %s", w.Code, w.Body.String())
	}

	// 17. Access /notifications with Bearer token
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/notifications", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /notifications, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRouter_RBAC_StudentRestricted(t *testing.T) {
	params := setupTestRouter()
	r := deliveryHttp.SetupRouter(*params)

	// 1. Register a student trying to escalate role to KAPRODI
	regBody, _ := json.Marshal(map[string]interface{}{
		"nama_lengkap": "Budi Mahasiswa",
		"email":        "budi@mahasiswa.ac.id",
		"password":     "password123",
		"roles":        []string{"KAPRODI"}, // Should be ignored; strictly MAHASISWA
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(regBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 created, got %d: %s", w.Code, w.Body.String())
	}

	var regResp struct {
		Data struct {
			Tokens struct {
				AccessToken string `json:"access_token"`
			} `json:"tokens"`
			User struct {
				ActiveRole string   `json:"active_role"`
				Roles      []string `json:"roles"`
			} `json:"user"`
		} `json:"data"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &regResp)
	mhsToken := regResp.Data.Tokens.AccessToken
	if regResp.Data.User.ActiveRole != "MAHASISWA" {
		t.Errorf("expected active role MAHASISWA, got %s", regResp.Data.User.ActiveRole)
	}

	// 2. Mahasiswa cannot access Kaprodi/Staff-only endpoints (Expect 403)
	forbiddenEndpoints := []struct {
		method string
		url    string
	}{
		{http.MethodGet, "/api/v1/dashboard/stats"},
		{http.MethodPost, "/api/v1/rps/sub-1/ratify"},
		{http.MethodPost, "/api/v1/trips/trip-1/approve"},
		{http.MethodPost, "/api/v1/admin/user-roles"},
		{http.MethodGet, "/api/v1/admin/audit-logs"},
		{http.MethodGet, "/api/v1/rka"},
		{http.MethodGet, "/api/v1/complaints"},
		{http.MethodGet, "/api/v1/surveys"},
	}

	for _, ep := range forbiddenEndpoints {
		req, _ = http.NewRequest(ep.method, ep.url, nil)
		req.Header.Set("Authorization", "Bearer "+mhsToken)
		w = httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusForbidden {
			t.Errorf("expected 403 Forbidden for Mahasiswa on %s %s, got %d", ep.method, ep.url, w.Code)
		}
	}

	// 3. Mahasiswa CAN access permit request
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/complaints/permit", nil)
	req.Header.Set("Authorization", "Bearer "+mhsToken)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code == http.StatusForbidden {
		t.Errorf("Mahasiswa should NOT get 403 on /complaints/permit, got %d", w.Code)
	}
}

func TestRouter_Publication_RBAC_And_StatusUpdate(t *testing.T) {
	params := setupTestRouter()
	r := deliveryHttp.SetupRouter(*params)

	// 1. Login as Kaprodi (active role KAPRODI)
	loginBody, _ := json.Marshal(map[string]string{
		"email":    "kaprodi@universitas.ac.id",
		"password": "password123",
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	var loginResp struct {
		Data struct {
			Tokens struct {
				AccessToken string `json:"access_token"`
			} `json:"tokens"`
		} `json:"data"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &loginResp)
	kaprodiToken := loginResp.Data.Tokens.AccessToken

	// Kaprodi can monitor publications, reviews, and recap
	for _, url := range []string{"/api/v1/publications", "/api/v1/publications/reviews", "/api/v1/publications/recap"} {
		req, _ = http.NewRequest(http.MethodGet, url, nil)
		req.Header.Set("Authorization", "Bearer "+kaprodiToken)
		w = httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("expected 200 for Kaprodi GET %s, got %d", url, w.Code)
		}
	}

	// Kaprodi cannot mutate status, verify its contents, or create a publication
	kaprodiForbidden := []struct {
		method string
		url    string
	}{
		{http.MethodPost, "/api/v1/publications"},
		{http.MethodPatch, "/api/v1/publications/pub-1/status"},
		{http.MethodPost, "/api/v1/publications/pub-1/stages"},
		{http.MethodPost, "/api/v1/publications/pub-1/verify"},
	}
	for _, ep := range kaprodiForbidden {
		req, _ = http.NewRequest(ep.method, ep.url, nil)
		req.Header.Set("Authorization", "Bearer "+kaprodiToken)
		w = httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusForbidden {
			t.Errorf("expected 403 Forbidden for Kaprodi on %s %s, got %d", ep.method, ep.url, w.Code)
		}
	}

	// 2. Register Mahasiswa and publish + update status + assign internal reviewer
	regBody, _ := json.Marshal(map[string]interface{}{
		"nama_lengkap": "Sari Mahasiswa",
		"email":        "sari@mahasiswa.ac.id",
		"password":     "password123",
	})
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(regBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	var regResp struct {
		Data struct {
			Tokens struct {
				AccessToken string `json:"access_token"`
			} `json:"tokens"`
		} `json:"data"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &regResp)
	mhsToken := regResp.Data.Tokens.AccessToken

	createBody, _ := json.Marshal(map[string]interface{}{
		"judul":         "Implementasi Audit Sistem",
		"tipe":          "JURNAL",
		"tipe_pencatat": "MAHASISWA",
		"tahun_terbit":  2025,
	})
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/publications", bytes.NewBuffer(createBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+mhsToken)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 for mahasiswa create publication, got %d: %s", w.Code, w.Body.String())
	}
	var pubResp struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &pubResp)

	// Only the designated academic role assigns an independent internal reviewer.
	revBody, _ := json.Marshal(map[string]string{
		"reviewer_id":   "dosen-rev-1",
		"reviewer_nama": "Dr. Reviewer",
	})
	jsonRequest(t, r, "/api/v1/publications/"+pubResp.Data.ID+"/reviews", mhsToken, map[string]string{"reviewer_id": "dosen-rev-1"}, 403)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/publications/"+pubResp.Data.ID+"/reviews", bytes.NewBuffer(revBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+kaprodiToken)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 for assigning internal reviewer, got %d: %s", w.Code, w.Body.String())
	}

	// Mahasiswa updates publication status directly to DIAJUKAN
	statusBody, _ := json.Marshal(map[string]string{
		"status":  "DIAJUKAN",
		"catatan": "Sudah submit ke jurnal",
		"bukti":   "Bukti_Submit.pdf",
	})
	req, _ = http.NewRequest(http.MethodPatch, "/api/v1/publications/"+pubResp.Data.ID+"/status", bytes.NewBuffer(statusBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+mhsToken)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 for mahasiswa updating status, got %d: %s", w.Code, w.Body.String())
	}

	// Mahasiswa cannot verify their own publication
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/publications/"+pubResp.Data.ID+"/verify", nil)
	req.Header.Set("Authorization", "Bearer "+mhsToken)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden when mahasiswa verifies publication, got %d", w.Code)
	}
}

func jsonRequest(t *testing.T, r http.Handler, path, token string, data any, want int) map[string]any {
	t.Helper()
	body, err := json.Marshal(data)
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != want {
		t.Fatalf("%s status %d, expected %d", path, w.Code, want)
	}
	var result map[string]any
	if err = json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	return result
}
