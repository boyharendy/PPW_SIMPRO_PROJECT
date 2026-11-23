package http

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"simpro-backend/internal/config"
	"simpro-backend/internal/database"
	"simpro-backend/internal/delivery/http/handler"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
)

type RouterParams struct {
	Pool               *pgxpool.Pool
	Bind               func(*database.TxStore) RouterParams
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

	r := gin.New()
	r.Use(middleware.PrivateRecovery())

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
			for _, prefix := range []string{"/public/aduan", "/public/complaints"} {
				g := api.Group(prefix, middleware.Anonymous())
				g.POST("", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.CreatePublicComplaint }))
				g.POST("/track", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.GetPublicComplaint }))
				g.POST("/track/messages", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.AddPublicMessage }))
				g.POST("/track/rating", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.SubmitPublicRating }))
				g.POST("/track/attachment", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.PublicAttachment }))
			}
		}

		// Public Attachments / Sanitized Upload
		if params.AttachmentHandler != nil {
			attachments := api.Group("/attachments", middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				attachments.POST("", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.AttachmentHandler.Upload }))
				attachments.GET("/:id/url", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.AttachmentHandler.GetURL }))
			}
		}

		if params.SurveyHandler != nil {
			pubSurveys := api.Group("/public/surveys")
			{
				pubSurveys.GET("/:token", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.GetPublicSurvey }))
				pubSurveys.POST("/:token/submit", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.SubmitPublicResponse }))
			}
		}

		// Auth Routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", params.AuthHandler.Login)
			auth.POST("/register", params.AuthHandler.Register)
			auth.POST("/refresh", params.AuthHandler.RefreshToken)
			auth.POST("/logout", middleware.AuthMiddleware(params.AuthHandler.Authenticate), params.AuthHandler.Logout)

			// Protected Auth Routes
			authProtected := auth.Group("")
			authProtected.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				authProtected.GET("/me", params.AuthHandler.Me)
				authProtected.POST("/switch-role", params.AuthHandler.SwitchRole)
			}
		}

		// User Routes (Protected)
		users := api.Group("/users")
		users.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
		{
			users.GET("", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RolePengelolaAduan, model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.UserHandler.GetUsers }))
			users.POST("", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.UserHandler.CreateUser }))
			users.GET("/roles", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.UserHandler.GetRoles }))
			users.GET("/:id", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RolePengelolaAduan, model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.UserHandler.GetUserByID }))
			users.PUT("/:id", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.UserHandler.UpdateUser }))
			users.DELETE("/:id", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.UserHandler.DeleteUser }))
		}

		// Reference Data Routes (Protected)
		if params.ReferenceHandler != nil {
			ref := api.Group("/ref")
			ref.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				ref.GET("/academic-periods", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ReferenceHandler.GetAcademicPeriods }))
				ref.GET("/lecturers", allow(model.RoleMahasiswa, model.RoleDosen, model.RoleKaprodi, model.RoleAdminProdi, model.RoleGKM), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ReferenceHandler.Lecturers }))
				ref.GET("/courses", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ReferenceHandler.GetCourses }))
				ref.GET("/course-classes", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ReferenceHandler.GetCourseClasses }))
				ref.GET("/partners", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ReferenceHandler.GetPartners }))
			}
		}

		// Modul 7: Kepuasan Mitra (Protected)
		if params.SurveyHandler != nil {
			registerSurveyRoutes := func(grp *gin.RouterGroup) {
				grp.GET("", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.GetSurveys }))
				grp.POST("", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.CreateSurvey }))
				grp.POST("/templates/:id/activate", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.ActivateTemplate }))
				grp.POST("/templates/:id/duplicate", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.DuplicateTemplate }))
				grp.POST("/templates/:id/archive", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.ArchiveTemplate }))
				grp.GET("/invitations", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.GetInvitations }))
				grp.POST("/invitations", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.CreateInvitation }))
				grp.POST("/invitations/:id/send", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.SendInvitation }))
				grp.POST("/invitations/:id/remind", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.RemindInvitation }))
				grp.POST("/invitations/:id/resend", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.ResendInvitation }))
				grp.POST("/invitations/:id/cancel", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.CancelInvitation }))
				grp.GET("/placements", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.GetPlacements }))
				grp.POST("/responses/:id/void", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.VoidResponse }))
				grp.POST("/manual-responses", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.SubmitManualResponse }))
				grp.GET("/:id", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.GetSurveyByID }))
				grp.PUT("/:id", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.UpdateSurvey }))
				grp.DELETE("/:id", allow(model.RoleKoordKP_PSI_PDLK), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.DeleteSurvey }))
				grp.GET("/:id/recap", allow(model.RoleKoordKP_PSI_PDLK, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.SurveyHandler.GetRecap }))
			}

			surveys := api.Group("/surveys")
			surveys.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			registerSurveyRoutes(surveys)

			partnerSurveys := api.Group("/partner-surveys")
			partnerSurveys.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			registerSurveyRoutes(partnerSurveys)
		}

		// Modul 13: Layanan Aduan (Protected)
		if params.ComplaintHandler != nil {
			registerComplaintRoutes := func(grp *gin.RouterGroup) {
				grp.POST("/permit", allow(model.RoleMahasiswa), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.IssuePermit }))
				grp.GET("", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.GetComplaints }))
				grp.GET("/recap", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.GetRecap }))
				grp.GET("/escalations", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.GetEscalations }))
				grp.GET("/my-dispositions", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RoleDosen, model.RolePengelolaAduan), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.GetMyDispositions }))
				grp.GET("/:id", allow(model.RolePengelolaAduan, model.RoleKaprodi, model.RoleDosen, model.RoleAdminProdi, model.RoleGKM), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.GetComplaintByID }))
				grp.PATCH("/:id/status", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.UpdateStatus }))
				grp.POST("/:id/verify", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.Verify }))
				grp.POST("/:id/resolve", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RoleDosen, model.RolePengelolaAduan), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.Resolve }))
				grp.POST("/:id/close", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.Close }))
				grp.POST("/:id/messages", allow(model.RoleKaprodi, model.RoleGKM, model.RoleAdminProdi, model.RoleDosen, model.RolePengelolaAduan), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.AddInternalMessage }))
				grp.POST("/:id/dispositions", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.AddDisposition }))
				grp.POST("/:id/forward-satgas", allow(model.RolePengelolaAduan, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.ComplaintHandler.ForwardToSatgas }))
			}

			complaints := api.Group("/complaints")
			complaints.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			registerComplaintRoutes(complaints)

			aduan := api.Group("/aduan")
			aduan.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			registerComplaintRoutes(aduan)
		}

		// Modul 8: Publikasi Ilmiah (Protected)
		if params.PublicationHandler != nil {
			pubs := api.Group("/publications")
			pubs.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				pubs.GET("", allow(model.RoleDosen, model.RoleDosenVerifikator, model.RoleMahasiswa, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.GetPublications }))
				pubs.POST("", allow(model.RoleDosen, model.RoleMahasiswa), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.CreatePublication }))
				pubs.GET("/recap", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.GetRecap }))
				pubs.GET("/reviews", allow(model.RoleDosen, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.GetReviews }))
				pubs.GET("/verification-queue", allow(model.RoleDosenVerifikator, model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.GetVerificationQueue }))
				pubs.GET("/:id", allow(model.RoleDosen, model.RoleDosenVerifikator, model.RoleMahasiswa, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.GetPublicationByID }))
				pubs.PUT("/:id", allow(model.RoleDosen, model.RoleMahasiswa), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.UpdatePublication }))
				pubs.PATCH("/:id/status", allow(model.RoleDosen, model.RoleMahasiswa), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.UpdatePublicationStatus }))
				pubs.DELETE("/:id", allow(model.RoleDosen, model.RoleMahasiswa), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.DeletePublication }))
				pubs.PUT("/:id/authors", allow(model.RoleDosen, model.RoleMahasiswa), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.UpdateAuthors }))
				pubs.PUT("/:id/verifier", allow(model.RoleKaprodi, model.RoleDosen, model.RoleMahasiswa, model.RoleDosenVerifikator), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.AssignVerifier }))
				pubs.POST("/:id/submit", allow(model.RoleDosen, model.RoleMahasiswa), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.SubmitPublication }))
				pubs.POST("/:id/stages", allow(model.RoleDosen, model.RoleMahasiswa), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.AddStageLog }))
				pubs.POST("/stages/:stageId/verify", allow(model.RoleDosenVerifikator, model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.VerifyStage }))
				pubs.POST("/:id/verify", allow(model.RoleDosenVerifikator, model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.VerifyPublication }))
				pubs.POST("/:id/reviews", allow(model.RoleDosen, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.AddReview }))
				pubs.POST("/reviews/:reviewId/complete", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.PublicationHandler.CompleteReview }))
			}
		}

		// Modul 9: Perjalanan Dinas (Protected)
		if params.TripHandler != nil {
			trips := api.Group("/trips")
			trips.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				trips.GET("", allow(model.RoleDosen, model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.GetTrips }))
				trips.GET("/budget-options", allow(model.RoleDosen, model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.BudgetOptions }))
				trips.POST("", allow(model.RoleDosen, model.RoleAdminProdi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.CreateTrip }))
				trips.GET("/recap", allow(model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.GetRecap }))
				trips.GET("/flags", allow(model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.GetFlags }))
				trips.GET("/:id", allow(model.RoleDosen, model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.GetTripByID }))
				trips.PUT("/:id", allow(model.RoleDosen, model.RoleAdminProdi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.UpdateTrip }))
				trips.DELETE("/:id", allow(model.RoleDosen, model.RoleAdminProdi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.DeleteTrip }))
				trips.POST("/:id/submit", allow(model.RoleDosen, model.RoleAdminProdi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.SubmitTrip }))
				trips.POST("/:id/approve", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.ApproveTrip }))
				trips.POST("/:id/report", allow(model.RoleDosen, model.RoleAdminProdi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.SubmitReport }))
				trips.POST("/:id/proofs", allow(model.RoleDosen, model.RoleAdminProdi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.AddProof }))
				trips.PUT("/:id/costs", allow(model.RoleDosen, model.RoleAdminProdi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.UpdateCosts }))
				trips.PUT("/:id/costs/realization", allow(model.RoleDosen, model.RoleAdminProdi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.UpdateRealizationCosts }))
				trips.POST("/:id/confirm", allow(model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.ConfirmTrip }))
				trips.GET("/:id/completeness", allow(model.RoleDosen, model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.TripHandler.GetCompleteness }))
			}
		}

		// Modul 10: RKA Prodi (Protected)
		if params.RkaHandler != nil {
			rka := api.Group("/rka")
			rka.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				rka.GET("", allow(model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.GetRkaList }))
				rka.POST("", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.CreateRka }))
				rka.GET("/:id", allow(model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.GetRkaByYear }))
				rka.PUT("/:id", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.UpdateRka }))
				rka.POST("/:id/realizations", allow(model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.AddRealization }))
				rka.GET("/:id/serapan", allow(model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.GetSerapan }))
				rka.GET("/:id/working-version", allow(model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.GetWorkingVersion }))
				rka.PUT("/:id/working-version", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.UpdateWorkingVersion }))
				rka.POST("/:id/working-version/submit", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.SubmitWorkingVersion }))
				rka.GET("/:id/versions/:nomor/diff", allow(model.RoleAdminProdi, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.GetVersionDiff }))
				rka.POST("/:id/versions/:nomor/decision", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.DecideVersion }))
				rka.POST("/:id/close", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RkaHandler.CloseRka }))
			}
		}

		// Modul 11: Review RPS (Protected)
		if params.RpsHandler != nil {
			rps := api.Group("/rps")
			rps.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				rps.GET("", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.GetSubmissions }))
				rps.POST("", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.CreateSubmission }))
				rps.GET("/recap", allow(model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.GetRecap }))
				rps.GET("/:id", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.GetSubmissionByID }))
				rps.POST("/:id/submit", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.SubmitForReview }))
				rps.POST("/:id/assign-reviewer", allow(model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.AssignReviewer }))
				rps.POST("/submissions/:id/assign-reviewers", allow(model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.AssignReviewer }))
				rps.POST("/:id/review", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.ReviewSubmission }))
				rps.PUT("/reviews/:reviewId/items", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.UpdateReviewItems }))
				rps.POST("/reviews/:reviewId/complete", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.CompleteReview }))
				rps.PUT("/submissions/:id/improvement-plans", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.UpdateImprovementPlans }))
				rps.POST("/:id/ratify", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.RpsHandler.RatifySubmission }))
			}
		}

		// Modul 12: Post Evaluasi Perkuliahan (Protected)
		if params.EvaluationHandler != nil {
			evals := api.Group("/evaluations")
			evals.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				evals.GET("", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.GetEvaluations }))
				evals.POST("", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.SaveEvaluation }))
				evals.GET("/recap", allow(model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.GetRecap }))
				evals.GET("/:id", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.GetEvaluationByID }))
				evals.GET("/:id/student-feedback", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.GetStudentFeedback }))
				evals.POST("/:id/review", allow(model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.ReviewEvaluation }))
				evals.GET("/class/:classId", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.GetEvaluationByClass }))
				evals.POST("/class/:classId/submit", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.SubmitEvaluation }))
				evals.GET("/course/:courseId/improvement-plans", allow(model.RoleDosen, model.RoleGKM, model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.GetImprovementPlansByCourse }))
				evals.PATCH("/improvement-plans/:planId", allow(model.RoleDosen), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.EvaluationHandler.UpdateImprovementPlan }))
			}
		}

		// Cross-Module: Dashboard Stats & Notifications (Protected)
		if params.DashboardHandler != nil {
			dash := api.Group("/dashboard")
			dash.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				dash.GET("/stats", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.DashboardHandler.GetDashboardStats }))
			}

			notifs := api.Group("/notifications")
			notifs.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				notifs.GET("", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.DashboardHandler.GetNotifications }))
				notifs.PATCH("/:id/read", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.DashboardHandler.MarkNotificationRead }))
			}
		}

		// Admin & System Settings (Protected)
		if params.AdminHandler != nil {
			admin := api.Group("/admin")
			admin.Use(middleware.AuthMiddleware(params.AuthHandler.Authenticate))
			{
				admin.GET("/settings", params.serve(func(p *RouterParams) gin.HandlerFunc { return p.AdminHandler.GetSettings }))
				admin.PUT("/settings/:key", allow(model.RoleKaprodi, model.RoleAdminProdi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.AdminHandler.UpdateSetting }))
				admin.GET("/user-roles", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.AdminHandler.GetUserRoles }))
				admin.POST("/user-roles", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.AdminHandler.AssignUserRole }))
				admin.DELETE("/user-roles/:id", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.AdminHandler.RevokeUserRole }))
				admin.GET("/audit-logs", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.AdminHandler.GetAuditLogs }))
				admin.POST("/scheduler/run", allow(model.RoleKaprodi), params.serve(func(p *RouterParams) gin.HandlerFunc { return p.AdminHandler.RunScheduler }))
			}
		}
	}

	return r
}
