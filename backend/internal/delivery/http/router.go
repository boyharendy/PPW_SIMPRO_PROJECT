package http

import (
	"github.com/gin-gonic/gin"
	"simpro-backend/internal/config"
	"simpro-backend/internal/delivery/http/handler"
	"simpro-backend/internal/delivery/http/middleware"
)

type RouterParams struct {
	Config        *config.Config
	AuthHandler   *handler.AuthHandler
	UserHandler   *handler.UserHandler
	HealthHandler *handler.HealthHandler
}

func SetupRouter(params RouterParams) *gin.Engine {
	if params.Config.ServerEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Apply CORS
	r.Use(middleware.CORSMiddleware(params.Config.FrontendURL))

	// API Group
	api := r.Group(params.Config.APIPrefix)
	{
		// Public Endpoints
		api.GET("/health", params.HealthHandler.Health)

		// Auth Routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", params.AuthHandler.Login)
			auth.POST("/register", params.AuthHandler.Register)
			auth.POST("/refresh", params.AuthHandler.RefreshToken)
			auth.POST("/logout", params.AuthHandler.Logout)

			// Protected Auth Routes
			authProtected := auth.Group("")
			authProtected.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				authProtected.GET("/me", params.AuthHandler.Me)
				authProtected.POST("/switch-role", params.AuthHandler.SwitchRole)
			}
		}

		// User Routes (Protected)
		users := api.Group("/users")
		users.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
		{
			users.GET("", params.UserHandler.GetUsers)
			users.GET("/:id", params.UserHandler.GetUserByID)
			users.PUT("/:id", params.UserHandler.UpdateUser)
			users.DELETE("/:id", params.UserHandler.DeleteUser)
		}
	}

	return r
}
