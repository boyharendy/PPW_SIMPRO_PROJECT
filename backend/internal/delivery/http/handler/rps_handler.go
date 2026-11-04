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
		ReviewerID  string   `json:"reviewer_id"`
		ReviewerIDs []string `json:"reviewer_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data penugasan reviewer tidak valid", err.Error())
		return
	}
	targetIDs := req.ReviewerIDs
	if len(targetIDs) == 0 && req.ReviewerID != "" {
		targetIDs = []string{req.ReviewerID}
	}
	if len(targetIDs) == 0 {
		response.BadRequest(c, "Minimal satu reviewer wajib dipilih", nil)
		return
	}

	if err := h.usecase.AssignReviewers(id, targetIDs); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Tim Reviewer SPMI berhasil ditetapkan untuk RPS ini", nil)
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

// PUT /rps/reviews/:reviewId/items (5 Komponen SPMI Checklist)
func (h *RpsHandler) UpdateReviewItems(c *gin.Context) {
	reviewID := c.Param("reviewId")
	var req struct {
		Items []*model.RpsReviewItem `json:"items" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data 5 komponen instrumen review SPMI tidak valid", err.Error())
		return
	}
	if err := h.usecase.UpdateReviewItems(reviewID, req.Items); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Instrumen 5 komponen review RPS berhasil diperbarui", nil)
}

// POST /rps/reviews/:reviewId/complete
func (h *RpsHandler) CompleteReview(c *gin.Context) {
	reviewID := c.Param("reviewId")
	var req struct {
		Rekomendasi string `json:"rekomendasi" binding:"required"`
		Komentar    string `json:"komentar"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Rekomendasi review wajib dipilih (DISETUJUI / PERLU_REVISI)", err.Error())
		return
	}
	if err := h.usecase.CompleteReview(reviewID, req.Rekomendasi, req.Komentar); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Penilaian review RPS berhasil diselesaikan", nil)
}

// PUT /rps/submissions/:id/improvement-plans
func (h *RpsHandler) UpdateImprovementPlans(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Plans []*model.CourseImprovementPlan `json:"plans" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data rencana tindak lanjut perbaikan tidak valid", err.Error())
		return
	}
	if err := h.usecase.UpdateImprovementPlans(id, req.Plans); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Status tindak lanjut perbaikan RPS berhasil diperbarui", nil)
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
		response.InternalServerError(c, "Gagal mengambil rekapitulasi: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi RPS", recap)
}
