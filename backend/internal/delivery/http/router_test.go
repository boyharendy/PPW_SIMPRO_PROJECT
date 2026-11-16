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
	complaintBody, _ := json.Marshal(map[string]interface{}{
		"kategori":    "FASILITAS",
		"judul":       "Lampu Ruang 301 Mati",
		"isi_aduan":   "Lampu di depan proyektor tidak menyala saat perkuliahan",
		"is_sensitif": false,
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
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/public/complaints/"+ticket, nil)
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
