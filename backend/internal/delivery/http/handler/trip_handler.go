package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type TripHandler struct {
	usecase usecase.TripUsecase
}

func NewTripHandler(uc usecase.TripUsecase) *TripHandler {
	return &TripHandler{usecase: uc}
}

func (h *TripHandler) GetTrips(c *gin.Context) {
	status := c.Query("status")
	userID := c.Query("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	trips, total, err := h.usecase.GetTrips(status, userID, page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar perjalanan dinas: "+err.Error())
		return
	}

	totalPages := (total + limit - 1) / limit
	meta := &response.PaginationMeta{
		Page:         page,
		Limit:        limit,
		TotalRecords: total,
		TotalPages:   totalPages,
		HasNext:      page < totalPages,
		HasPrev:      page > 1,
	}

	response.SuccessWithMeta(c, http.StatusOK, "Daftar perjalanan dinas berhasil diambil", trips, meta)
}

func (h *TripHandler) GetTripByID(c *gin.Context) {
	id := c.Param("id")
	trip, err := h.usecase.GetTripByID(id)
	if err != nil {
		response.NotFound(c, "Perjalanan dinas tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Detail perjalanan dinas berhasil diambil", trip)
}

func (h *TripHandler) CreateTrip(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)
	var req model.TravelOrder
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data perjalanan dinas tidak valid", err.Error())
		return
	}

	created, err := h.usecase.CreateTrip(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Pengajuan perjalanan dinas berhasil dibuat", created)
}

func (h *TripHandler) UpdateTrip(c *gin.Context) {
	id := c.Param("id")
	var req model.TravelOrder
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data update perjalanan dinas tidak valid", err.Error())
		return
	}

	updated, err := h.usecase.UpdateTrip(id, &req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Pengajuan perjalanan dinas berhasil diperbarui", updated)
}

func (h *TripHandler) DeleteTrip(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.DeleteTrip(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Pengajuan perjalanan dinas berhasil dihapus", nil)
}

func (h *TripHandler) SubmitTrip(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.SubmitTrip(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Pengajuan perjalanan dinas berhasil diajukan ke Kaprodi", nil)
}

func (h *TripHandler) ApproveTrip(c *gin.Context) {
	id := c.Param("id")
	approverID := c.GetString(middleware.CtxUserID)

	var req struct {
		Approved bool `json:"approved"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Keputusan persetujuan tidak valid", err.Error())
		return
	}

	if err := h.usecase.ApproveTrip(id, approverID, req.Approved); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	msg := "Perjalanan dinas berhasil disetujui"
	if !req.Approved {
		msg = "Perjalanan dinas telah ditolak"
	}
	response.Success(c, http.StatusOK, msg, nil)
}

func (h *TripHandler) SubmitReport(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)

	var req struct {
		RingkasanHasil string  `json:"ringkasan_hasil" binding:"required"`
		FileLaporanURL string  `json:"file_laporan_url"`
		TotalRealisasi float64 `json:"total_realisasi"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format laporan tidak valid", err.Error())
		return
	}

	if err := h.usecase.SubmitReport(id, userID, req.RingkasanHasil, req.FileLaporanURL, req.TotalRealisasi); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Laporan perjalanan dinas berhasil dikirim dan diverifikasi", nil)
}

func (h *TripHandler) AddProof(c *gin.Context) {
	id := c.Param("id")
	var req model.TravelProof
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format bukti perjalanan tidak valid", err.Error())
		return
	}
	if err := h.usecase.AddProof(id, &req); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Bukti perjalanan dinas berhasil diunggah", nil)
}

func (h *TripHandler) GetRecap(c *gin.Context) {
	recap, err := h.usecase.GetRecap()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil rekapitulasi: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi perjalanan dinas", recap)
}
