package main

import (
	"fmt"
	"log"

	"simpro-backend/internal/config"
	deliveryHttp "simpro-backend/internal/delivery/http"
	"simpro-backend/internal/delivery/http/handler"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func main() {
	// 1. Load Configurations
	cfg := config.LoadConfig()

	// 2. Initialize Repositories
	userRepo := repository.NewMemoryUserRepository()

	// 3. Initialize Usecases
	authUsecase := usecase.NewAuthUsecase(userRepo, cfg)
	userUsecase := usecase.NewUserUsecase(userRepo)

	// 4. Initialize Handlers
	authHandler := handler.NewAuthHandler(authUsecase)
	userHandler := handler.NewUserHandler(userUsecase)
	healthHandler := handler.NewHealthHandler()

	// 5. Setup Router
	router := deliveryHttp.SetupRouter(deliveryHttp.RouterParams{
		Config:        cfg,
		AuthHandler:   authHandler,
		UserHandler:   userHandler,
		HealthHandler: healthHandler,
	})

	// 6. Start Server
	serverAddr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("==================================================")
	log.Printf("🚀 SIMPRO Golang Backend Server running on port %s", cfg.ServerPort)
	log.Printf("👉 Health check: http://localhost:%s%s/health", cfg.ServerPort, cfg.APIPrefix)
	log.Printf("👉 Frontend CORS allowed: %s", cfg.FrontendURL)
	log.Printf("==================================================")

	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("Server gagal dijalankan: %v", err)
	}
}
