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

type PublicationHandler struct {
	usecase usecase.PublicationUsecase
}

func NewPublicationHandler(uc usecase.PublicationUsecase) *PublicationHandler {
	return &PublicationHandler{usecase: uc}
}

func (h *PublicationHandler) GetPublications(c *gin.Context) {
	status := c.Query("status")
	tipe := c.Query("tipe")
	tahun, _ := strconv.Atoi(c.Query("tahun"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	pubs, total, err := h.usecase.GetPublications(status, tipe, tahun, page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar publikasi: "+err.Error())
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

	response.SuccessWithMeta(c, http.StatusOK, "Daftar publikasi ilmiah berhasil diambil", pubs, meta)
}

func (h *PublicationHandler) GetPublicationByID(c *gin.Context) {
	id := c.Param("id")
	pub, err := h.usecase.GetPublicationByID(id)
	if err != nil {
		response.NotFound(c, "Publikasi tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Detail publikasi berhasil diambil", pub)
}

func (h *PublicationHandler) CreatePublication(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)
	var req model.Publication
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data publikasi tidak valid", err.Error())
		return
	}

	created, err := h.usecase.CreatePublication(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Publikasi berhasil ditambahkan ke draf", created)
}

func (h *PublicationHandler) UpdatePublication(c *gin.Context) {
	id := c.Param("id")
	var req model.Publication
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data update publikasi tidak valid", err.Error())
		return
	}

	updated, err := h.usecase.UpdatePublication(id, &req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Publikasi berhasil diperbarui", updated)
}

func (h *PublicationHandler) DeletePublication(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.DeletePublication(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Publikasi berhasil dihapus", nil)
}

func (h *PublicationHandler) SubmitPublication(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.SubmitPublication(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Publikasi berhasil diajukan untuk verifikasi", nil)
}

func (h *PublicationHandler) VerifyPublication(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)

	var req struct {
		Status  model.PublicationStatus `json:"status" binding:"required"`
		Catatan string                  `json:"catatan"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Status verifikasi tidak valid", err.Error())
		return
	}

	if err := h.usecase.VerifyPublication(id, req.Status, userID, req.Catatan); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Verifikasi publikasi berhasil disimpan", nil)
}

func (h *PublicationHandler) AddReview(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)

	var req struct {
		Catatan     string `json:"catatan" binding:"required"`
		Rekomendasi string `json:"rekomendasi" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Catatan dan rekomendasi wajib diisi", err.Error())
		return
	}

	if err := h.usecase.AddReview(id, userID, req.Catatan, req.Rekomendasi); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Review publikasi berhasil ditambahkan", nil)
}

func (h *PublicationHandler) GetRecap(c *gin.Context) {
	recap, err := h.usecase.GetRecap()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil rekapitulasi: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi publikasi ilmiah", recap)
}
