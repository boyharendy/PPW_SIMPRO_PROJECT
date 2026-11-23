package main

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"log"
	"net"
	"net/http"
	"simpro-backend/internal/config"
	"simpro-backend/internal/database"
	delivery "simpro-backend/internal/delivery/http"
	"simpro-backend/internal/delivery/http/handler"
	"simpro-backend/internal/identity"
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/scheduler"
	"simpro-backend/internal/storage"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/permit"
	"time"
)

type repos struct {
	users      repository.UserRepository
	ref        repository.ReferenceRepository
	surveys    repository.SurveyRepository
	complaints repository.ComplaintRepository
	pubs       repository.PublicationRepository
	trips      repository.TripRepository
	rka        repository.RkaRepository
	rps        repository.RpsRepository
	eval       repository.EvaluationRepository
	files      repository.AttachmentRepository
	admin      repository.AdminRepository
}

func fromStore(store database.Store) repos {
	return repos{
		users:      repository.NewSupabaseUserRepository(store),
		ref:        repository.NewSupabaseReferenceRepository(store),
		surveys:    repository.NewSupabaseSurveyRepository(store),
		complaints: repository.NewSupabaseComplaintRepository(store),
		pubs:       repository.NewSupabasePublicationRepository(store),
		trips:      repository.NewSupabaseTripRepository(store),
		rka:        repository.NewSupabaseRkaRepository(store),
		rps:        repository.NewSupabaseRpsRepository(store),
		eval:       repository.NewSupabaseEvaluationRepository(store),
		files:      repository.NewSupabaseAttachmentRepository(store),
		admin:      repository.NewSupabaseAdminRepository(store),
	}
}
func memory() repos {
	return repos{
		users:      repository.NewMemoryUserRepository(),
		ref:        repository.NewMemoryReferenceRepository(),
		surveys:    repository.NewMemorySurveyRepository(),
		complaints: repository.NewMemoryComplaintRepository(),
		pubs:       repository.NewMemoryPublicationRepository(),
		trips:      repository.NewMemoryTripRepository(),
		rka:        repository.NewMemoryRkaRepository(),
		rps:        repository.NewMemoryRpsRepository(),
		eval:       repository.NewMemoryEvaluationRepository(),
		files:      repository.NewMemoryAttachmentRepository(),
		admin:      repository.NewMemoryAdminRepository(),
	}
}

type application struct {
	cfg     *config.Config
	permits *permit.PermitManager
	objects storage.Objects
	auth    *handler.AuthHandler
	jobs    scheduler.Scheduler
}

func (a application) handlers(ctx context.Context, r repos, rollback func(func())) delivery.RouterParams {
	complaints := usecase.NewSecureComplaints(r.complaints, a.permits, []byte(a.cfg.TicketPepper))
	files := usecase.NewPrivateAttachments(ctx, r.files, r.admin, a.objects, rollback)
	return delivery.RouterParams{Config: a.cfg, AuthHandler: a.auth, HealthHandler: handler.NewHealthHandler(a.cfg),
		UserHandler: handler.NewUserHandler(usecase.NewUserUsecase(r.users)), ReferenceHandler: handler.NewReferenceHandler(r.ref),
		ComplaintHandler: handler.NewComplaintHandler(complaints, files), AttachmentHandler: handler.NewAttachmentHandler(files, r.attachmentAccess),
		PublicationHandler: handler.NewPublicationHandler(usecase.NewPublicationUsecase(r.pubs)), TripHandler: handler.NewTripHandler(usecase.NewTripUsecase(r.trips, r.rka), files),
		RpsHandler: handler.NewRpsHandler(usecase.NewRpsUsecase(r.rps, r.eval)), EvaluationHandler: handler.NewEvaluationHandler(usecase.NewEvaluationUsecase(r.eval)),
		RkaHandler: handler.NewRkaHandler(usecase.NewRkaUsecase(r.rka)), SurveyHandler: handler.NewSurveyHandler(usecase.NewSurveyUsecase(r.surveys)),
		DashboardHandler: handler.NewDashboardHandler(r.surveys, r.pubs, r.trips, r.rka, r.rps, r.eval, r.complaints), AdminHandler: handler.NewAdminHandler(usecase.NewAdminUsecase(r.admin, a.jobs))}
}
func (r repos) attachmentAccess(user *model.User, kind model.AttachmentEntityType, id string, write bool) bool {
	uid, role := user.ID, user.ActiveRole
	switch kind {
	case model.AttachmentEntityPublication:
		p, err := r.pubs.FindByID(id)
		return err == nil && ((!write && p.Visible(uid, role)) || (p.Author(uid) && p.StatusVerifikasi != "TERVERIFIKASI"))
	case model.AttachmentEntityBusinessTrip:
		t, err := r.trips.FindByID(id)
		return err == nil && (t.Participant(uid) || !write && (role == model.RoleAdminProdi || role == model.RoleKaprodi))
	case model.AttachmentEntityRps:
		s, err := r.rps.FindByID(id)
		return err == nil && (s.DosenPenyusunID == uid || s.Reviewer(uid) || !write && (role == model.RoleKaprodi || role == model.RoleGKM))
	case model.AttachmentEntityCourseEval:
		e, err := r.eval.FindByID(id)
		return err == nil && (e.DiisiOleh == uid || !write && (role == model.RoleKaprodi || role == model.RoleGKM))
	case model.AttachmentEntityComplaint, model.AttachmentEntityComplaintMessage:
		if kind == model.AttachmentEntityComplaintMessage {
			m, err := r.complaints.MessageByID(id)
			if err != nil {
				return false
			}
			id = m.ComplaintID
		}
		c, err := r.complaints.FindByID(id)
		return err == nil && ((!c.IsSensitif && c.Assigned(uid)) || role == model.RolePetugasKekerasan || role == model.RolePengelolaAduan && (user.PenangananKekerasan || !c.IsSensitif) || role == model.RoleKaprodi && !c.IsSensitif)
	}
	return false
}
func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}
func run() error {
	cfg := config.LoadConfig()
	if err := cfg.Validate(); err != nil {
		return err
	}
	ctx := context.Background()
	app := application{cfg: cfg}
	var r repos
	var pool *pgxpool.Pool
	var local *storage.Memory
	if cfg.Local() {
		r = memory()
		app.auth = handler.NewAuthHandler(usecase.NewAuthUsecase(r.users, cfg))
		app.permits = permit.NewPermitManager(cfg.PermitSecret)
		local = storage.NewMemory(cfg.APIPrefix)
		app.objects = local
	} else {
		var err error
		pool, err = database.NewPostgresPool(ctx, cfg.DatabaseURL)
		if err != nil {
			return errors.New("koneksi PostgreSQL aplikasi gagal")
		}
		defer pool.Close()
		var safe bool
		err = pool.QueryRow(ctx, "SELECT current_user='simpro_runtime' AND NOT (rolsuper OR rolbypassrls OR rolcreaterole OR rolinherit) AND app.private_ready() FROM pg_roles WHERE rolname=current_user").Scan(&safe)
		if err != nil || !safe {
			return errors.New("login simpro_runtime atau migrasi keamanan belum siap")
		}
		jobPool, err := database.NewJobPool(ctx, cfg.DatabaseURL)
		if err != nil {
			return errors.New("koneksi penjadwal gagal")
		}
		defer jobPool.Close()
		r = fromStore(&database.TxStore{Ctx: ctx, Tx: jobPool})
		opts, err := redis.ParseURL(cfg.RedisURL)
		if err != nil {
			return errors.New("REDIS_URL tidak valid")
		}
		cache := redis.NewClient(opts)
		defer cache.Close()
		if err = cache.Ping(ctx).Err(); err != nil {
			return errors.New("layanan kuota anonim tidak tersedia")
		}
		app.permits = permit.NewShared(cfg.PermitSecret, cache)
		app.objects = storage.NewSupabase(cfg.SupabaseURL, cfg.SupabaseServiceKey)
		app.auth = handler.NewCloudAuthHandler(identity.New(cfg.SupabaseURL, cfg.SupabaseAnonKey, pool))
	}
	app.jobs = scheduler.NewScheduler(r.surveys, r.pubs, r.trips, r.rka, r.rps, r.eval, r.complaints, r.admin)
	app.jobs.Start()
	defer app.jobs.Stop()
	params := app.handlers(ctx, r, nil)
	params.Pool = pool
	if pool != nil {
		params.Bind = func(tx *database.TxStore) delivery.RouterParams {
			return app.handlers(tx.Ctx, fromStore(tx), tx.OnRollback)
		}
	}
	router := delivery.SetupRouter(params)
	if local != nil {
		router.GET(cfg.APIPrefix+"/attachments/local/:key", func(c *gin.Context) {
			b, mime, ok := local.Open(c.Param("key"), c.Query("exp"), c.Query("sig"))
			if !ok {
				c.Status(404)
				return
			}
			c.Header("Cache-Control", "no-store")
			c.Header("X-Content-Type-Options", "nosniff")
			c.Header("Content-Disposition", "attachment")
			c.Data(200, mime, b)
		})
	}
	server := http.Server{Addr: net.JoinHostPort(cfg.ServerHost, cfg.ServerPort), Handler: router, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 60 * time.Second, WriteTimeout: 90 * time.Second, IdleTimeout: 60 * time.Second}
	log.Printf("SIMPRO API berjalan dalam mode %s", cfg.ServerEnv)
	return server.ListenAndServe()
}
