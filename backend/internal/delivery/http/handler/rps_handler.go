package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type RpsHandler struct {
	usecase usecase.RpsUsecase
}

func NewRpsHandler(uc usecase.RpsUsecase) *RpsHandler {
	return &RpsHandler{usecase: uc}
}

func (h *RpsHandler) GetSubmissions(c *gin.Context) {
	courseID := c.Query("course_id")
	status := c.Query("status")
	subs, err := h.usecase.GetSubmissions(courseID, status)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar pengajuan RPS: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Daftar pengajuan RPS berhasil diambil", subs)
}

func (h *RpsHandler) GetSubmissionByID(c *gin.Context) {
	id := c.Param("id")
	sub, err := h.usecase.GetSubmissionByID(id)
	if err != nil {
		response.NotFound(c, "Pengajuan RPS tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Detail pengajuan RPS berhasil diambil", sub)
}

func (h *RpsHandler) CreateSubmission(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)
	var req model.RpsSubmission
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data RPS tidak valid", err.Error())
		return
	}
	created, err := h.usecase.CreateSubmission(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Pengajuan RPS berhasil dibuat", created)
}

func (h *RpsHandler) SubmitForReview(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.SubmitForReview(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "RPS berhasil diajukan untuk ditinjau GKM", nil)
}

func (h *RpsHandler) AssignReviewer(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		ReviewerID string `json:"reviewer_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Reviewer ID wajib diisi", err.Error())
		return
	}
	if err := h.usecase.AssignReviewer(id, req.ReviewerID); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Reviewer GKM berhasil ditetapkan untuk RPS ini", nil)
}

func (h *RpsHandler) ReviewSubmission(c *gin.Context) {
	id := c.Param("id")
	reviewerID := c.GetString(middleware.CtxUserID)

	var req struct {
		Komentar    string                 `json:"komentar" binding:"required"`
		Rekomendasi string                 `json:"rekomendasi" binding:"required"`
		Items       []*model.RpsReviewItem `json:"items"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Komentar dan rekomendasi review wajib diisi", err.Error())
		return
	}

	if err := h.usecase.ReviewSubmissionWithChecklist(id, reviewerID, req.Komentar, req.Rekomendasi, req.Items); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Review RPS berhasil disimpan", nil)
}

func (h *RpsHandler) RatifySubmission(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.RatifySubmission(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "RPS berhasil disahkan oleh Kaprodi", nil)
}

func (h *RpsHandler) GetRecap(c *gin.Context) {
	recap, err := h.usecase.GetRecap()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil rekap RPS: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi kepatuhan RPS", recap)
}
