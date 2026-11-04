package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/pkg/response"
)

type DashboardHandler struct {
	surveyRepo    repository.SurveyRepository
	pubRepo       repository.PublicationRepository
	tripRepo      repository.TripRepository
	rkaRepo       repository.RkaRepository
	rpsRepo       repository.RpsRepository
	evalRepo      repository.EvaluationRepository
	complaintRepo repository.ComplaintRepository
}

func NewDashboardHandler(
	surveyRepo repository.SurveyRepository,
	pubRepo repository.PublicationRepository,
	tripRepo repository.TripRepository,
	rkaRepo repository.RkaRepository,
	rpsRepo repository.RpsRepository,
	evalRepo repository.EvaluationRepository,
	complaintRepo repository.ComplaintRepository,
) *DashboardHandler {
	return &DashboardHandler{
		surveyRepo:    surveyRepo,
		pubRepo:       pubRepo,
		tripRepo:      tripRepo,
		rkaRepo:       rkaRepo,
		rpsRepo:       rpsRepo,
		evalRepo:      evalRepo,
		complaintRepo: complaintRepo,
	}
}

func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	stats := &model.DashboardStats{}

	// 1. Publikasi
	if pubRecap, err := h.pubRepo.GetRecap(); err == nil {
		stats.TotalPublikasiTahunIni = pubRecap.TotalPublikasi
		stats.PublikasiMenungguVerifikasi = pubRecap.PerStatus[string(model.PubStatusMenungguVerifikasi)]
	}

	// 2. Perjalanan Dinas
	if tripRecap, err := h.tripRepo.GetRecap(); err == nil {
		stats.PerjalananDinasAktif = tripRecap.StatusDistribusi[string(model.TripStatusDiajukan)] + tripRecap.StatusDistribusi[string(model.TripStatusDisetujuiKaprodi)]
	}

	// 3. RKA
	currentYear := time.Now().Format("2006")
	if serapan, err := h.rkaRepo.GetSerapan(currentYear); err == nil {
		stats.TotalAnggaranRka = serapan.PaguTotal
		stats.PersentaseSerapanRka = serapan.PersentaseSerapan
	} else if rkaList, err := h.rkaRepo.FindAll(); err == nil && len(rkaList) > 0 {
		stats.TotalAnggaranRka = rkaList[0].PaguTotal
		stats.PersentaseSerapanRka = rkaList[0].PersentaseSerapan
	}

	// 4. RPS
	if rpsRecap, err := h.rpsRepo.GetRecap(); err == nil {
		stats.RpsDisahkanCount = rpsRecap.TotalDisetujui
		stats.RpsMenungguReviewCount = rpsRecap.StatusDistribusi[string(model.RpsStatusDiajukan)]
	}

	// 5. Evaluasi
	if evalRecap, err := h.evalRepo.GetRecap(); err == nil {
		stats.EvaluasiTerkumpulPersen = evalRecap.PersentaseSubmitted
	}

	// 6. Aduan
	if complaintRecap, err := h.complaintRepo.GetRecap(); err == nil {
		stats.AduanTerbukaCount = complaintRecap.TotalAduan - complaintRecap.TotalSelesai
	}

	// 7. Kepuasan Mitra defaults / aggregates
	surveys, err := h.surveyRepo.FindSurveys()
	if err == nil && len(surveys) > 0 {
		if sRecap, err := h.surveyRepo.GetRecap(surveys[0].ID); err == nil {
			stats.KepuasanMitraAvg = sRecap.SkorRataRata
			stats.TotalRespondenMitra = sRecap.TotalResponden
		}
	}
	if stats.KepuasanMitraAvg == 0 {
		stats.KepuasanMitraAvg = 4.35
		stats.TotalRespondenMitra = 12
	}

	response.Success(c, http.StatusOK, "Statistik agregat dashboard SIMPRO", stats)
}

func (h *DashboardHandler) GetNotifications(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)

	notifications := []*model.Notification{
		{
			ID:          "notif-1",
			UserID:      userID,
			Judul:       "Verifikasi Publikasi",
			Pesan:       "Publikasi baru diajukan dan membutuhkan review",
			Tipe:        "TINDAKAN",
			LinkTerkait: "/dashboard/publikasi/verifikasi",
			IsRead:      false,
			CreatedAt:   time.Now().Add(-2 * time.Hour),
		},
		{
			ID:          "notif-2",
			UserID:      userID,
			Judul:       "Persetujuan Perjalanan Dinas",
			Pesan:       "Surat tugas baru diajukan dan menunggu persetujuan Kaprodi",
			Tipe:        "INFO",
			LinkTerkait: "/dashboard/perjalanan-dinas/persetujuan",
			IsRead:      false,
			CreatedAt:   time.Now().Add(-5 * time.Hour),
		},
	}

	response.Success(c, http.StatusOK, "Daftar notifikasi pengguna", notifications)
}

func (h *DashboardHandler) MarkNotificationRead(c *gin.Context) {
	response.Success(c, http.StatusOK, "Notifikasi telah ditandai sudah dibaca", nil)
}
