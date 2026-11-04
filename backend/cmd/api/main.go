package main

import (
	"fmt"
	"log"

	"simpro-backend/internal/config"
	"simpro-backend/internal/database"
	deliveryHttp "simpro-backend/internal/delivery/http"
	"simpro-backend/internal/delivery/http/handler"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func main() {
	// 1. Load Configurations
	cfg := config.LoadConfig()

	// 2. Initialize Database / Repositories
	var userRepo repository.UserRepository
	var refRepo repository.ReferenceRepository
	var surveyRepo repository.SurveyRepository
	var complaintRepo repository.ComplaintRepository
	var pubRepo repository.PublicationRepository
	var tripRepo repository.TripRepository
	var rkaRepo repository.RkaRepository
	var rpsRepo repository.RpsRepository
	var evalRepo repository.EvaluationRepository

	if cfg.SupabaseURL != "" && cfg.SupabaseServiceKey != "" {
		log.Println("🔌 Menghubungkan ke Supabase Database...")
		supabaseClient := database.NewSupabaseClient(cfg.SupabaseURL, cfg.SupabaseServiceKey)
		userRepo = repository.NewSupabaseUserRepository(supabaseClient)
		refRepo = repository.NewSupabaseReferenceRepository(supabaseClient)
		surveyRepo = repository.NewSupabaseSurveyRepository(supabaseClient)
		complaintRepo = repository.NewSupabaseComplaintRepository(supabaseClient)
		pubRepo = repository.NewSupabasePublicationRepository(supabaseClient)
		tripRepo = repository.NewSupabaseTripRepository(supabaseClient)
		rkaRepo = repository.NewSupabaseRkaRepository(supabaseClient)
		rpsRepo = repository.NewSupabaseRpsRepository(supabaseClient)
		evalRepo = repository.NewSupabaseEvaluationRepository(supabaseClient)
		log.Println("✅ Supabase Repositories aktif")
	} else {
		log.Println("⚠️ Kredensial Supabase tidak lengkap, menggunakan Memory Repositories (Mock)")
		userRepo = repository.NewMemoryUserRepository()
		refRepo = repository.NewMemoryReferenceRepository()
		surveyRepo = repository.NewMemorySurveyRepository()
		complaintRepo = repository.NewMemoryComplaintRepository()
		pubRepo = repository.NewMemoryPublicationRepository()
		tripRepo = repository.NewMemoryTripRepository()
		rkaRepo = repository.NewMemoryRkaRepository()
		rpsRepo = repository.NewMemoryRpsRepository()
		evalRepo = repository.NewMemoryEvaluationRepository()
	}

	// 3. Initialize Usecases
	authUsecase := usecase.NewAuthUsecase(userRepo, cfg)
	userUsecase := usecase.NewUserUsecase(userRepo)
	surveyUsecase := usecase.NewSurveyUsecase(surveyRepo)
	complaintUsecase := usecase.NewComplaintUsecase(complaintRepo)
	pubUsecase := usecase.NewPublicationUsecase(pubRepo)
	tripUsecase := usecase.NewTripUsecase(tripRepo)
	rkaUsecase := usecase.NewRkaUsecase(rkaRepo)
	rpsUsecase := usecase.NewRpsUsecase(rpsRepo)
	evalUsecase := usecase.NewEvaluationUsecase(evalRepo)

	// 4. Initialize Handlers
	authHandler := handler.NewAuthHandler(authUsecase)
	userHandler := handler.NewUserHandler(userUsecase)
	healthHandler := handler.NewHealthHandler(cfg)
	refHandler := handler.NewReferenceHandler(refRepo)
	surveyHandler := handler.NewSurveyHandler(surveyUsecase)
	complaintHandler := handler.NewComplaintHandler(complaintUsecase)
	pubHandler := handler.NewPublicationHandler(pubUsecase)
	tripHandler := handler.NewTripHandler(tripUsecase)
	rkaHandler := handler.NewRkaHandler(rkaUsecase)
	rpsHandler := handler.NewRpsHandler(rpsUsecase)
	evalHandler := handler.NewEvaluationHandler(evalUsecase)
	dashboardHandler := handler.NewDashboardHandler(surveyRepo, pubRepo, tripRepo, rkaRepo, rpsRepo, evalRepo, complaintRepo)

	// 5. Setup Router
	router := deliveryHttp.SetupRouter(deliveryHttp.RouterParams{
		Config:             cfg,
		AuthHandler:        authHandler,
		UserHandler:        userHandler,
		HealthHandler:      healthHandler,
		ReferenceHandler:   refHandler,
		SurveyHandler:      surveyHandler,
		ComplaintHandler:   complaintHandler,
		PublicationHandler: pubHandler,
		TripHandler:        tripHandler,
		RkaHandler:         rkaHandler,
		RpsHandler:         rpsHandler,
		EvaluationHandler:  evalHandler,
		DashboardHandler:   dashboardHandler,
	})

	// 6. Start Server
	serverAddr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("==================================================")
	log.Printf("🚀 SIMPRO Golang Backend Server running on port %s", cfg.ServerPort)
	log.Printf("👉 Health check: http://localhost:%s%s/health", cfg.ServerPort, cfg.APIPrefix)
	log.Printf("👉 Frontend CORS allowed: %s", cfg.FrontendURL)
	if cfg.SupabaseURL != "" {
		log.Printf("👉 Supabase Project: %s", cfg.SupabaseURL)
	}
	log.Printf("==================================================")

	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("Server gagal dijalankan: %v", err)
	}
}
