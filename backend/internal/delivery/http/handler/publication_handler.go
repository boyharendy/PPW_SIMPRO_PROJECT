package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/export"
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

func (h *PublicationHandler) UpdatePublicationStatus(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)
	var req struct {
		Status  model.PublicationStatus `json:"status" binding:"required"`
		Catatan string                  `json:"catatan"`
		Bukti   string                  `json:"bukti"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Status publikasi tidak valid", err.Error())
		return
	}

	updated, err := h.usecase.UpdatePublicationStatus(id, userID, req.Status, req.Catatan, req.Bukti)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Status publikasi berhasil diperbarui", updated)
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

func (h *PublicationHandler) AddStageLog(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)
	var req model.PublicationStageLog
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format log tahapan publikasi tidak valid", err.Error())
		return
	}
	if err := h.usecase.AddStageLog(id, userID, &req); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Log tahapan publikasi berhasil dicatat", nil)
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
		ReviewerID    string `json:"reviewer_id"`
		ReviewerNama  string `json:"reviewer_nama"`
		TenggatReview string `json:"tenggat_review"`
		Catatan       string `json:"catatan"`
		Rekomendasi   string `json:"rekomendasi"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data review publikasi tidak valid", err.Error())
		return
	}

	if req.ReviewerID != "" {
		review := &model.PublicationReview{
			ReviewerID:    req.ReviewerID,
			ReviewerNama:  req.ReviewerNama,
			TenggatReview: req.TenggatReview,
			Catatan:       req.Catatan,
			Rekomendasi:   req.Rekomendasi,
		}
		if err := h.usecase.AssignReviewer(id, userID, review); err != nil {
			response.BadRequest(c, err.Error(), nil)
			return
		}
		response.Success(c, http.StatusCreated, "Reviewer internal publikasi berhasil ditetapkan", review)
		return
	}

	if middleware.NormalizeRole(middleware.ActiveRole(c)) == model.RoleMahasiswa {
		response.Forbidden(c, "Hanya dosen reviewer internal yang dapat mengisi hasil review")
		return
	}

	if req.Catatan == "" || req.Rekomendasi == "" {
		response.BadRequest(c, "Catatan dan rekomendasi wajib diisi", nil)
		return
	}

	if err := h.usecase.AddReview(id, userID, req.Catatan, req.Rekomendasi); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Review publikasi berhasil ditambahkan", nil)
}

// GetReviews handles GET /api/v1/publications/reviews
func (h *PublicationHandler) GetReviews(c *gin.Context) {
	reviewerID := c.Query("reviewer_id")
	reviews, err := h.usecase.GetReviews(reviewerID)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar review internal: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Daftar review internal publikasi berhasil diambil", reviews)
}

// UpdateAuthors handles PUT /api/v1/publications/:id/authors
func (h *PublicationHandler) UpdateAuthors(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Authors []*model.PublicationAuthor `json:"authors" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data daftar penulis tidak valid", err.Error())
		return
	}

	if err := h.usecase.UpdateAuthors(id, req.Authors); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Daftar penulis publikasi berhasil diperbarui (total kontribusi tepat 100%)", nil)
}

// GetVerificationQueue handles GET /api/v1/publications/verification-queue
func (h *PublicationHandler) GetVerificationQueue(c *gin.Context) {
	verifierID := c.Query("verifier_id")
	if verifierID == "" {
		verifierID = c.GetString(middleware.CtxUserID)
	}
	queue, err := h.usecase.GetVerificationQueue(verifierID)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil antrean verifikasi: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Antrean verifikasi publikasi berhasil diambil", queue)
}

// AssignVerifier handles PUT /api/v1/publications/:id/verifier
func (h *PublicationHandler) AssignVerifier(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		VerifierID string `json:"verifier_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "verifier_id wajib diisi", err.Error())
		return
	}
	if err := h.usecase.AssignVerifier(id, req.VerifierID); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Dosen verifikator independen berhasil ditetapkan", nil)
}

// VerifyStage handles POST /api/v1/publications/stages/:stageId/verify
func (h *PublicationHandler) VerifyStage(c *gin.Context) {
	stageID := c.Param("stageId")
	verifierID := c.GetString(middleware.CtxUserID)
	var req struct {
		Status  string `json:"status" binding:"required"`
		Catatan string `json:"catatan"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Status verifikasi (TERVERIFIKASI/DITOLAK) wajib diisi", err.Error())
		return
	}
	if err := h.usecase.VerifyStage(stageID, verifierID, req.Status, req.Catatan); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Tahapan publikasi berhasil diverifikasi", nil)
}

// CompleteReview handles POST /api/v1/publications/reviews/:reviewId/complete
func (h *PublicationHandler) CompleteReview(c *gin.Context) {
	reviewID := c.Param("reviewId")
	var req struct {
		Rekomendasi string `json:"rekomendasi" binding:"required"`
		Catatan     string `json:"catatan"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Rekomendasi review wajib diisi", err.Error())
		return
	}
	if err := h.usecase.CompleteReview(reviewID, req.Rekomendasi, req.Catatan); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Review internal publikasi berhasil diselesaikan", nil)
}

func (h *PublicationHandler) GetRecap(c *gin.Context) {
	recap, err := h.usecase.GetRecap()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil rekapitulasi: "+err.Error())
		return
	}
	format := c.Query("format")
	if format == "xlsx" || format == "csv" || format == "pdf" {
		pubs, _, _ := h.usecase.GetPublications("", "", 0, 1, 1000)
		c.Header("Content-Disposition", "attachment; filename=rekap-publikasi-ilmiah.csv")
		c.Data(http.StatusOK, "text/csv; charset=utf-8", export.ExportPublicationRecapCSV(pubs))
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi publikasi ilmiah", recap)
}
