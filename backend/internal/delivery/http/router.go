package http

import (
	"github.com/gin-gonic/gin"
	"simpro-backend/internal/config"
	"simpro-backend/internal/delivery/http/handler"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
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

	allow := middleware.RequireRole

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
			users.GET("", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RolePengelolaAduan, model.RoleKoordKP_PSI_PDLK), params.UserHandler.GetUsers)
			users.POST("", allow(model.RoleKaprodi), params.UserHandler.CreateUser)
			users.GET("/roles", params.UserHandler.GetRoles)
			users.GET("/:id", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RolePengelolaAduan, model.RoleKoordKP_PSI_PDLK), params.UserHandler.GetUserByID)
			users.PUT("/:id", allow(model.RoleKaprodi), params.UserHandler.UpdateUser)
			users.DELETE("/:id", allow(model.RoleKaprodi), params.UserHandler.DeleteUser)
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
				grp.GET("", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.SurveyHandler.GetSurveys)
				grp.POST("", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.CreateSurvey)
				grp.POST("/templates/:id/activate", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.ActivateTemplate)
				grp.POST("/templates/:id/duplicate", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.DuplicateTemplate)
				grp.POST("/templates/:id/archive", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.ArchiveTemplate)
				grp.GET("/invitations", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.SurveyHandler.GetInvitations)
				grp.POST("/invitations", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.CreateInvitation)
				grp.POST("/invitations/:id/send", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.SendInvitation)
				grp.POST("/invitations/:id/remind", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.RemindInvitation)
				grp.POST("/invitations/:id/resend", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.ResendInvitation)
				grp.POST("/invitations/:id/cancel", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.CancelInvitation)
				grp.GET("/placements", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.SurveyHandler.GetPlacements)
				grp.POST("/responses/:id/void", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.VoidResponse)
				grp.POST("/manual-responses", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.SubmitManualResponse)
				grp.GET("/:id", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.SurveyHandler.GetSurveyByID)
				grp.PUT("/:id", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.UpdateSurvey)
				grp.DELETE("/:id", allow(model.RoleKoordKP_PSI_PDLK), params.SurveyHandler.DeleteSurvey)
				grp.GET("/:id/recap", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.SurveyHandler.GetRecap)
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
				grp.POST("/permit", allow(model.RoleMahasiswa), params.ComplaintHandler.IssuePermit)
				grp.GET("", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.ComplaintHandler.GetComplaints)
				grp.GET("/recap", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.ComplaintHandler.GetRecap)
				grp.GET("/escalations", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.ComplaintHandler.GetEscalations)
				grp.GET("/my-dispositions", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RoleDosen, model.RolePengelolaAduan), params.ComplaintHandler.GetMyDispositions)
				grp.GET("/:id", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.ComplaintHandler.GetComplaintByID)
				grp.PATCH("/:id/status", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.ComplaintHandler.UpdateStatus)
				grp.POST("/:id/verify", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.ComplaintHandler.Verify)
				grp.POST("/:id/resolve", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RoleDosen, model.RolePengelolaAduan), params.ComplaintHandler.Resolve)
				grp.POST("/:id/close", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.ComplaintHandler.Close)
				grp.POST("/:id/messages", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RoleDosen, model.RolePengelolaAduan), params.ComplaintHandler.AddInternalMessage)
				grp.POST("/:id/dispositions", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.ComplaintHandler.AddDisposition)
				grp.POST("/:id/forward-satgas", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.ComplaintHandler.ForwardToSatgas)
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
				pubs.GET("", allow(model.RoleDosen, model.RoleDosenVerifikator, model.RoleMahasiswa, model.RoleKaprodi), params.PublicationHandler.GetPublications)
				pubs.POST("", allow(model.RoleDosen, model.RoleMahasiswa), params.PublicationHandler.CreatePublication)
				pubs.GET("/recap", allow(model.RoleKaprodi), params.PublicationHandler.GetRecap)
				pubs.GET("/verification-queue", allow(model.RoleDosenVerifikator, model.RoleDosen), params.PublicationHandler.GetVerificationQueue)
				pubs.GET("/:id", allow(model.RoleDosen, model.RoleDosenVerifikator, model.RoleMahasiswa, model.RoleKaprodi), params.PublicationHandler.GetPublicationByID)
				pubs.PUT("/:id", allow(model.RoleDosen, model.RoleMahasiswa), params.PublicationHandler.UpdatePublication)
				pubs.DELETE("/:id", allow(model.RoleDosen, model.RoleMahasiswa), params.PublicationHandler.DeletePublication)
				pubs.PUT("/:id/authors", allow(model.RoleDosen, model.RoleMahasiswa), params.PublicationHandler.UpdateAuthors)
				pubs.PUT("/:id/verifier", allow(model.RoleKaprodi), params.PublicationHandler.AssignVerifier)
				pubs.POST("/:id/submit", allow(model.RoleDosen, model.RoleMahasiswa), params.PublicationHandler.SubmitPublication)
				pubs.POST("/:id/stages", allow(model.RoleDosen, model.RoleMahasiswa), params.PublicationHandler.AddStageLog)
				pubs.POST("/stages/:stageId/verify", allow(model.RoleDosenVerifikator, model.RoleDosen), params.PublicationHandler.VerifyStage)
				pubs.POST("/:id/verify", allow(model.RoleDosenVerifikator, model.RoleDosen), params.PublicationHandler.VerifyPublication)
				pubs.POST("/:id/reviews", allow(model.RoleDosen), params.PublicationHandler.AddReview)
				pubs.POST("/reviews/:reviewId/complete", allow(model.RoleDosen), params.PublicationHandler.CompleteReview)
			}
		}

		// Modul 9: Perjalanan Dinas (Protected)
		if params.TripHandler != nil {
			trips := api.Group("/trips")
			trips.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				trips.GET("", allow(model.RoleDosen, model.RoleAdminProdi, model.RoleKaprodi), params.TripHandler.GetTrips)
				trips.POST("", allow(model.RoleDosen, model.RoleAdminProdi), params.TripHandler.CreateTrip)
				trips.GET("/recap", allow(model.RoleAdminProdi, model.RoleKaprodi), params.TripHandler.GetRecap)
				trips.GET("/flags", allow(model.RoleAdminProdi, model.RoleKaprodi), params.TripHandler.GetFlags)
				trips.GET("/:id", allow(model.RoleDosen, model.RoleAdminProdi, model.RoleKaprodi), params.TripHandler.GetTripByID)
				trips.PUT("/:id", allow(model.RoleDosen, model.RoleAdminProdi), params.TripHandler.UpdateTrip)
				trips.DELETE("/:id", allow(model.RoleDosen, model.RoleAdminProdi), params.TripHandler.DeleteTrip)
				trips.POST("/:id/submit", allow(model.RoleDosen, model.RoleAdminProdi), params.TripHandler.SubmitTrip)
				trips.POST("/:id/approve", allow(model.RoleKaprodi), params.TripHandler.ApproveTrip)
				trips.POST("/:id/report", allow(model.RoleDosen, model.RoleAdminProdi), params.TripHandler.SubmitReport)
				trips.POST("/:id/proofs", allow(model.RoleDosen, model.RoleAdminProdi), params.TripHandler.AddProof)
				trips.PUT("/:id/costs", allow(model.RoleDosen, model.RoleAdminProdi), params.TripHandler.UpdateCosts)
				trips.PUT("/:id/costs/realization", allow(model.RoleDosen, model.RoleAdminProdi), params.TripHandler.UpdateRealizationCosts)
				trips.POST("/:id/confirm", allow(model.RoleAdminProdi), params.TripHandler.ConfirmTrip)
				trips.GET("/:id/completeness", allow(model.RoleDosen, model.RoleAdminProdi, model.RoleKaprodi), params.TripHandler.GetCompleteness)
			}
		}

		// Modul 10: RKA Prodi (Protected)
		if params.RkaHandler != nil {
			rka := api.Group("/rka")
			rka.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				rka.GET("", allow(model.RoleAdminProdi, model.RoleKaprodi), params.RkaHandler.GetRkaList)
				rka.POST("", allow(model.RoleAdminProdi, model.RoleKaprodi), params.RkaHandler.CreateRka)
				rka.GET("/:tahun", allow(model.RoleAdminProdi, model.RoleKaprodi), params.RkaHandler.GetRkaByYear)
				rka.PUT("/:tahun", allow(model.RoleAdminProdi, model.RoleKaprodi), params.RkaHandler.UpdateRka)
				rka.POST("/:tahun/realizations", allow(model.RoleAdminProdi), params.RkaHandler.AddRealization)
				rka.GET("/:tahun/serapan", allow(model.RoleAdminProdi, model.RoleKaprodi), params.RkaHandler.GetSerapan)
				rka.GET("/:id/working-version", allow(model.RoleAdminProdi, model.RoleKaprodi), params.RkaHandler.GetWorkingVersion)
				rka.PUT("/:id/working-version", allow(model.RoleAdminProdi, model.RoleKaprodi), params.RkaHandler.UpdateWorkingVersion)
				rka.POST("/:id/working-version/submit", allow(model.RoleAdminProdi, model.RoleKaprodi), params.RkaHandler.SubmitWorkingVersion)
				rka.GET("/:id/versions/:nomor/diff", allow(model.RoleAdminProdi, model.RoleKaprodi), params.RkaHandler.GetVersionDiff)
				rka.POST("/:id/versions/:nomor/decision", allow(model.RoleKaprodi), params.RkaHandler.DecideVersion)
				rka.POST("/:id/close", allow(model.RoleKaprodi), params.RkaHandler.CloseRka)
			}
		}

		// Modul 11: Review RPS (Protected)
		if params.RpsHandler != nil {
			rps := api.Group("/rps")
			rps.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				rps.GET("", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.RpsHandler.GetSubmissions)
				rps.POST("", allow(model.RoleDosen), params.RpsHandler.CreateSubmission)
				rps.GET("/recap", allow(model.RoleGKM, model.RoleKaprodi), params.RpsHandler.GetRecap)
				rps.GET("/:id", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.RpsHandler.GetSubmissionByID)
				rps.POST("/:id/submit", allow(model.RoleDosen), params.RpsHandler.SubmitForReview)
				rps.POST("/:id/assign-reviewer", allow(model.RoleGKM, model.RoleKaprodi), params.RpsHandler.AssignReviewer)
				rps.POST("/submissions/:id/assign-reviewers", allow(model.RoleGKM, model.RoleKaprodi), params.RpsHandler.AssignReviewer)
				rps.POST("/:id/review", allow(model.RoleDosen), params.RpsHandler.ReviewSubmission)
				rps.PUT("/reviews/:reviewId/items", allow(model.RoleDosen), params.RpsHandler.UpdateReviewItems)
				rps.POST("/reviews/:reviewId/complete", allow(model.RoleDosen), params.RpsHandler.CompleteReview)
				rps.PUT("/submissions/:id/improvement-plans", allow(model.RoleDosen), params.RpsHandler.UpdateImprovementPlans)
				rps.POST("/:id/ratify", allow(model.RoleKaprodi), params.RpsHandler.RatifySubmission)
			}
		}

		// Modul 12: Post Evaluasi Perkuliahan (Protected)
		if params.EvaluationHandler != nil {
			evals := api.Group("/evaluations")
			evals.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				evals.GET("", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.EvaluationHandler.GetEvaluations)
				evals.POST("", allow(model.RoleDosen), params.EvaluationHandler.SaveEvaluation)
				evals.GET("/recap", allow(model.RoleGKM, model.RoleKaprodi), params.EvaluationHandler.GetRecap)
				evals.GET("/:id", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.EvaluationHandler.GetEvaluationByID)
				evals.GET("/:id/student-feedback", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.EvaluationHandler.GetStudentFeedback)
				evals.POST("/:id/review", allow(model.RoleGKM, model.RoleKaprodi), params.EvaluationHandler.ReviewEvaluation)
				evals.GET("/class/:classId", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.EvaluationHandler.GetEvaluationByClass)
				evals.POST("/class/:classId/submit", allow(model.RoleDosen), params.EvaluationHandler.SubmitEvaluation)
				evals.GET("/course/:courseId/improvement-plans", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.EvaluationHandler.GetImprovementPlansByCourse)
				evals.PATCH("/improvement-plans/:planId", allow(model.RoleDosen), params.EvaluationHandler.UpdateImprovementPlan)
			}
		}

		// Cross-Module: Dashboard Stats & Notifications (Protected)
		if params.DashboardHandler != nil {
			dash := api.Group("/dashboard")
			dash.Use(middleware.AuthMiddleware(params.Config.JWTSecret))
			{
				dash.GET("/stats", allow(model.RoleKaprodi), params.DashboardHandler.GetDashboardStats)
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
				admin.PUT("/settings/:key", allow(model.RoleKaprodi, model.RoleAdminProdi), params.AdminHandler.UpdateSetting)
				admin.GET("/user-roles", allow(model.RoleKaprodi), params.AdminHandler.GetUserRoles)
				admin.POST("/user-roles", allow(model.RoleKaprodi), params.AdminHandler.AssignUserRole)
				admin.DELETE("/user-roles/:id", allow(model.RoleKaprodi), params.AdminHandler.RevokeUserRole)
				admin.GET("/audit-logs", allow(model.RoleKaprodi), params.AdminHandler.GetAuditLogs)
				admin.POST("/scheduler/run", allow(model.RoleKaprodi), params.AdminHandler.RunScheduler)
			}
		}
	}

	return r
}
