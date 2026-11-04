package http

import (
	"github.com/gin-gonic/gin"
	"simpro-backend/internal/config"
	"simpro-backend/internal/delivery/http/handler"
	"simpro-backend/internal/delivery/http/middleware"
)

type RouterParams struct {
	Config             *config.Config
	AuthHandler        *handler.AuthHandler
	UserHandler        *handler.UserHandler
	HealthHandler      *handler.HealthHandler
	ReferenceHandler   *handler.ReferenceHandler
	SurveyHandler      *handler.SurveyHandler
	ComplaintHandler   *handler.ComplaintHandler
	PublicationHandler *handler.PublicationHandler
	TripHandler        *handler.TripHandler
	RkaHandler         *handler.RkaHandler
	RpsHandler         *handler.RpsHandler
	EvaluationHandler  *handler.EvaluationHandler
	DashboardHandler   *handler.DashboardHandler
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

		// Public Routes (No Auth Required)
		if params.ComplaintHandler != nil {
			pubComplaints := api.Group("/public/complaints")
			{
				pubComplaints.POST("", params.ComplaintHandler.CreatePublicComplaint)
				pubComplaints.GET("/:ticket", params.ComplaintHandler.GetPublicComplaint)
				pubComplaints.POST("/:ticket/messages", params.ComplaintHandler.AddPublicMessage)
				pubComplaints.POST("/:ticket/rating", params.ComplaintHandler.SubmitPublicRating)
			}
		}

		if params.SurveyHandler != nil {
			pubSurveys := api.Group("/public/surveys")
			{
				pubSurveys.GET("/:token", params.SurveyHandler.GetPublicSurvey)
				pubSurveys.POST("/:token/submit", params.SurveyHandler.SubmitPublicResponse)
			}
		}

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
			users.POST("", params.UserHandler.CreateUser)
			users.GET("/roles", params.UserHandler.GetRoles)
			users.GET("/:id", params.UserHandler.GetUserByID)
			users.PUT("/:id", params.UserHandler.UpdateUser)
			users.DELETE("/:id", params.UserHandler.DeleteUser)
		}

		// Reference Data Routes (Protected)
		if params.ReferenceHandler != nil {
			ref := api.Group("/ref")
			ref.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				ref.GET("/academic-periods", params.ReferenceHandler.GetAcademicPeriods)
				ref.GET("/courses", params.ReferenceHandler.GetCourses)
				ref.GET("/course-classes", params.ReferenceHandler.GetCourseClasses)
				ref.GET("/partners", params.ReferenceHandler.GetPartners)
			}
		}

		// Modul 7: Kepuasan Mitra (Protected)
		if params.SurveyHandler != nil {
			surveys := api.Group("/surveys")
			surveys.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				surveys.GET("", params.SurveyHandler.GetSurveys)
				surveys.POST("", params.SurveyHandler.CreateSurvey)
				surveys.GET("/invitations", params.SurveyHandler.GetInvitations)
				surveys.POST("/invitations", params.SurveyHandler.CreateInvitation)
				surveys.POST("/manual-responses", params.SurveyHandler.SubmitManualResponse)
				surveys.GET("/:id", params.SurveyHandler.GetSurveyByID)
				surveys.PUT("/:id", params.SurveyHandler.UpdateSurvey)
				surveys.DELETE("/:id", params.SurveyHandler.DeleteSurvey)
				surveys.GET("/:id/recap", params.SurveyHandler.GetRecap)
			}
		}

		// Modul 13: Layanan Aduan (Protected)
		if params.ComplaintHandler != nil {
			complaints := api.Group("/complaints")
			complaints.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				complaints.GET("", params.ComplaintHandler.GetComplaints)
				complaints.GET("/recap", params.ComplaintHandler.GetRecap)
				complaints.GET("/:id", params.ComplaintHandler.GetComplaintByID)
				complaints.PATCH("/:id/status", params.ComplaintHandler.UpdateStatus)
				complaints.POST("/:id/messages", params.ComplaintHandler.AddInternalMessage)
				complaints.POST("/:id/dispositions", params.ComplaintHandler.AddDisposition)
				complaints.POST("/:id/forward-satgas", params.ComplaintHandler.ForwardToSatgas)
			}
		}

		// Modul 8: Publikasi Ilmiah (Protected)
		if params.PublicationHandler != nil {
			pubs := api.Group("/publications")
			pubs.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				pubs.GET("", params.PublicationHandler.GetPublications)
				pubs.POST("", params.PublicationHandler.CreatePublication)
				pubs.GET("/recap", params.PublicationHandler.GetRecap)
				pubs.GET("/:id", params.PublicationHandler.GetPublicationByID)
				pubs.PUT("/:id", params.PublicationHandler.UpdatePublication)
				pubs.DELETE("/:id", params.PublicationHandler.DeletePublication)
				pubs.POST("/:id/submit", params.PublicationHandler.SubmitPublication)
				pubs.POST("/:id/stages", params.PublicationHandler.AddStageLog)
				pubs.POST("/:id/verify", params.PublicationHandler.VerifyPublication)
				pubs.POST("/:id/reviews", params.PublicationHandler.AddReview)
			}
		}

		// Modul 9: Perjalanan Dinas (Protected)
		if params.TripHandler != nil {
			trips := api.Group("/trips")
			trips.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				trips.GET("", params.TripHandler.GetTrips)
				trips.POST("", params.TripHandler.CreateTrip)
				trips.GET("/recap", params.TripHandler.GetRecap)
				trips.GET("/:id", params.TripHandler.GetTripByID)
				trips.PUT("/:id", params.TripHandler.UpdateTrip)
				trips.DELETE("/:id", params.TripHandler.DeleteTrip)
				trips.POST("/:id/submit", params.TripHandler.SubmitTrip)
				trips.POST("/:id/approve", params.TripHandler.ApproveTrip)
				trips.POST("/:id/report", params.TripHandler.SubmitReport)
				trips.POST("/:id/proofs", params.TripHandler.AddProof)
			}
		}

		// Modul 10: RKA Prodi (Protected)
		if params.RkaHandler != nil {
			rka := api.Group("/rka")
			rka.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				rka.GET("", params.RkaHandler.GetRkaList)
				rka.POST("", params.RkaHandler.CreateRka)
				rka.GET("/:tahun", params.RkaHandler.GetRkaByYear)
				rka.PUT("/:tahun", params.RkaHandler.UpdateRka)
				rka.POST("/:tahun/realizations", params.RkaHandler.AddRealization)
				rka.GET("/:tahun/serapan", params.RkaHandler.GetSerapan)
			}
		}

		// Modul 11: Review RPS (Protected)
		if params.RpsHandler != nil {
			rps := api.Group("/rps")
			rps.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				rps.GET("", params.RpsHandler.GetSubmissions)
				rps.POST("", params.RpsHandler.CreateSubmission)
				rps.GET("/recap", params.RpsHandler.GetRecap)
				rps.GET("/:id", params.RpsHandler.GetSubmissionByID)
				rps.POST("/:id/submit", params.RpsHandler.SubmitForReview)
				rps.POST("/:id/assign-reviewer", params.RpsHandler.AssignReviewer)
				rps.POST("/:id/review", params.RpsHandler.ReviewSubmission)
				rps.POST("/:id/ratify", params.RpsHandler.RatifySubmission)
			}
		}

		// Modul 12: Post Evaluasi Perkuliahan (Protected)
		if params.EvaluationHandler != nil {
			evals := api.Group("/evaluations")
			evals.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				evals.GET("", params.EvaluationHandler.GetEvaluations)
				evals.POST("", params.EvaluationHandler.SaveEvaluation)
				evals.GET("/recap", params.EvaluationHandler.GetRecap)
				evals.GET("/class/:classId", params.EvaluationHandler.GetEvaluationByClass)
				evals.POST("/class/:classId/submit", params.EvaluationHandler.SubmitEvaluation)
				evals.GET("/course/:courseId/improvement-plans", params.EvaluationHandler.GetImprovementPlansByCourse)
				evals.PATCH("/improvement-plans/:planId", params.EvaluationHandler.UpdateImprovementPlan)
			}
		}

		// Cross-Module: Dashboard Stats & Notifications (Protected)
		if params.DashboardHandler != nil {
			dash := api.Group("/dashboard")
			dash.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				dash.GET("/stats", params.DashboardHandler.GetDashboardStats)
			}

			notifs := api.Group("/notifications")
			notifs.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				notifs.GET("", params.DashboardHandler.GetNotifications)
				notifs.PATCH("/:id/read", params.DashboardHandler.MarkNotificationRead)
			}
		}
	}

	return r
}
