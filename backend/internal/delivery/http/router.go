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
	AttachmentHandler  *handler.AttachmentHandler
	AdminHandler       *handler.AdminHandler
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
			// Format URL lama (/public/complaints)
			pubComplaints := api.Group("/public/complaints")
			{
				pubComplaints.POST("", params.ComplaintHandler.CreatePublicComplaint)
				pubComplaints.GET("/:ticket", params.ComplaintHandler.GetPublicComplaint)
				pubComplaints.POST("/:ticket/messages", params.ComplaintHandler.AddPublicMessage)
				pubComplaints.POST("/:ticket/rating", params.ComplaintHandler.SubmitPublicRating)
			}

			// Format URL PRD (/public/aduan)
			pubAduan := api.Group("/public/aduan")
			{
				pubAduan.POST("", params.ComplaintHandler.CreatePublicComplaint)
				pubAduan.GET("/:ticket", params.ComplaintHandler.GetPublicComplaint)
				pubAduan.POST("/track", params.ComplaintHandler.GetPublicComplaint)
				pubAduan.POST("/track/messages", params.ComplaintHandler.AddPublicMessage)
				pubAduan.POST("/track/rating", params.ComplaintHandler.SubmitPublicRating)
			}
		}

		// Public Attachments / Sanitized Upload
		if params.AttachmentHandler != nil {
			attachments := api.Group("/attachments")
			{
				attachments.POST("", params.AttachmentHandler.Upload)
				attachments.GET("/:id/url", params.AttachmentHandler.GetURL)
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
			registerSurveyRoutes := func(grp *gin.RouterGroup) {
				grp.GET("", params.SurveyHandler.GetSurveys)
				grp.POST("", params.SurveyHandler.CreateSurvey)
				grp.POST("/templates/:id/activate", params.SurveyHandler.ActivateTemplate)
				grp.POST("/templates/:id/duplicate", params.SurveyHandler.DuplicateTemplate)
				grp.POST("/templates/:id/archive", params.SurveyHandler.ArchiveTemplate)
				grp.GET("/invitations", params.SurveyHandler.GetInvitations)
				grp.POST("/invitations", params.SurveyHandler.CreateInvitation)
				grp.POST("/invitations/:id/send", params.SurveyHandler.SendInvitation)
				grp.POST("/invitations/:id/remind", params.SurveyHandler.RemindInvitation)
				grp.POST("/invitations/:id/resend", params.SurveyHandler.ResendInvitation)
				grp.POST("/invitations/:id/cancel", params.SurveyHandler.CancelInvitation)
				grp.GET("/placements", params.SurveyHandler.GetPlacements)
				grp.POST("/responses/:id/void", params.SurveyHandler.VoidResponse)
				grp.POST("/manual-responses", params.SurveyHandler.SubmitManualResponse)
				grp.GET("/:id", params.SurveyHandler.GetSurveyByID)
				grp.PUT("/:id", params.SurveyHandler.UpdateSurvey)
				grp.DELETE("/:id", params.SurveyHandler.DeleteSurvey)
				grp.GET("/:id/recap", params.SurveyHandler.GetRecap)
			}

			surveys := api.Group("/surveys")
			surveys.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			registerSurveyRoutes(surveys)

			partnerSurveys := api.Group("/partner-surveys")
			partnerSurveys.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			registerSurveyRoutes(partnerSurveys)
		}

		// Modul 13: Layanan Aduan (Protected)
		if params.ComplaintHandler != nil {
			registerComplaintRoutes := func(grp *gin.RouterGroup) {
				grp.POST("/permit", params.ComplaintHandler.IssuePermit)
				grp.GET("", params.ComplaintHandler.GetComplaints)
				grp.GET("/recap", params.ComplaintHandler.GetRecap)
				grp.GET("/escalations", params.ComplaintHandler.GetEscalations)
				grp.GET("/my-dispositions", params.ComplaintHandler.GetMyDispositions)
				grp.GET("/:id", params.ComplaintHandler.GetComplaintByID)
				grp.PATCH("/:id/status", params.ComplaintHandler.UpdateStatus)
				grp.POST("/:id/verify", params.ComplaintHandler.Verify)
				grp.POST("/:id/resolve", params.ComplaintHandler.Resolve)
				grp.POST("/:id/close", params.ComplaintHandler.Close)
				grp.POST("/:id/messages", params.ComplaintHandler.AddInternalMessage)
				grp.POST("/:id/dispositions", params.ComplaintHandler.AddDisposition)
				grp.POST("/:id/forward-satgas", params.ComplaintHandler.ForwardToSatgas)
			}

			complaints := api.Group("/complaints")
			complaints.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			registerComplaintRoutes(complaints)

			aduan := api.Group("/aduan")
			aduan.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			registerComplaintRoutes(aduan)
		}

		// Modul 8: Publikasi Ilmiah (Protected)
		if params.PublicationHandler != nil {
			pubs := api.Group("/publications")
			pubs.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				pubs.GET("", params.PublicationHandler.GetPublications)
				pubs.POST("", params.PublicationHandler.CreatePublication)
				pubs.GET("/recap", params.PublicationHandler.GetRecap)
				pubs.GET("/verification-queue", params.PublicationHandler.GetVerificationQueue)
				pubs.GET("/:id", params.PublicationHandler.GetPublicationByID)
				pubs.PUT("/:id", params.PublicationHandler.UpdatePublication)
				pubs.DELETE("/:id", params.PublicationHandler.DeletePublication)
				pubs.PUT("/:id/authors", params.PublicationHandler.UpdateAuthors)
				pubs.PUT("/:id/verifier", params.PublicationHandler.AssignVerifier)
				pubs.POST("/:id/submit", params.PublicationHandler.SubmitPublication)
				pubs.POST("/:id/stages", params.PublicationHandler.AddStageLog)
				pubs.POST("/stages/:stageId/verify", params.PublicationHandler.VerifyStage)
				pubs.POST("/:id/verify", params.PublicationHandler.VerifyPublication)
				pubs.POST("/:id/reviews", params.PublicationHandler.AddReview)
				pubs.POST("/reviews/:reviewId/complete", params.PublicationHandler.CompleteReview)
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
				trips.GET("/flags", params.TripHandler.GetFlags)
				trips.GET("/:id", params.TripHandler.GetTripByID)
				trips.PUT("/:id", params.TripHandler.UpdateTrip)
				trips.DELETE("/:id", params.TripHandler.DeleteTrip)
				trips.POST("/:id/submit", params.TripHandler.SubmitTrip)
				trips.POST("/:id/approve", params.TripHandler.ApproveTrip)
				trips.POST("/:id/report", params.TripHandler.SubmitReport)
				trips.POST("/:id/proofs", params.TripHandler.AddProof)
				trips.PUT("/:id/costs", params.TripHandler.UpdateCosts)
				trips.PUT("/:id/costs/realization", params.TripHandler.UpdateRealizationCosts)
				trips.POST("/:id/confirm", params.TripHandler.ConfirmTrip)
				trips.GET("/:id/completeness", params.TripHandler.GetCompleteness)
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
				rka.GET("/:id/working-version", params.RkaHandler.GetWorkingVersion)
				rka.PUT("/:id/working-version", params.RkaHandler.UpdateWorkingVersion)
				rka.POST("/:id/working-version/submit", params.RkaHandler.SubmitWorkingVersion)
				rka.GET("/:id/versions/:nomor/diff", params.RkaHandler.GetVersionDiff)
				rka.POST("/:id/versions/:nomor/decision", params.RkaHandler.DecideVersion)
				rka.POST("/:id/close", params.RkaHandler.CloseRka)
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
				rps.POST("/submissions/:id/assign-reviewers", params.RpsHandler.AssignReviewer)
				rps.POST("/:id/review", params.RpsHandler.ReviewSubmission)
				rps.PUT("/reviews/:reviewId/items", params.RpsHandler.UpdateReviewItems)
				rps.POST("/reviews/:reviewId/complete", params.RpsHandler.CompleteReview)
				rps.PUT("/submissions/:id/improvement-plans", params.RpsHandler.UpdateImprovementPlans)
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
				evals.GET("/:id", params.EvaluationHandler.GetEvaluationByID)
				evals.GET("/:id/student-feedback", params.EvaluationHandler.GetStudentFeedback)
				evals.POST("/:id/review", params.EvaluationHandler.ReviewEvaluation)
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

		// Admin & System Settings (Protected)
		if params.AdminHandler != nil {
			admin := api.Group("/admin")
			admin.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				admin.GET("/settings", params.AdminHandler.GetSettings)
				admin.PUT("/settings/:key", params.AdminHandler.UpdateSetting)
				admin.GET("/user-roles", params.AdminHandler.GetUserRoles)
				admin.POST("/user-roles", params.AdminHandler.AssignUserRole)
				admin.DELETE("/user-roles/:id", params.AdminHandler.RevokeUserRole)
				admin.GET("/audit-logs", params.AdminHandler.GetAuditLogs)
				admin.POST("/scheduler/run", params.AdminHandler.RunScheduler)
			}
		}
	}

	return r
}
