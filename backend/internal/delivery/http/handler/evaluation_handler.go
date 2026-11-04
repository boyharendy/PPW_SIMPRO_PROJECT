package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type EvaluationHandler struct {
	usecase usecase.EvaluationUsecase
}

func NewEvaluationHandler(uc usecase.EvaluationUsecase) *EvaluationHandler {
	return &EvaluationHandler{usecase: uc}
}

func (h *EvaluationHandler) GetEvaluations(c *gin.Context) {
	evals, err := h.usecase.GetEvaluations()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar evaluasi perkuliahan: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Daftar evaluasi perkuliahan berhasil diambil", evals)
}

func (h *EvaluationHandler) GetEvaluationByID(c *gin.Context) {
	id := c.Param("id")
	eval, err := h.usecase.GetEvaluationByID(id)
	if err != nil {
		response.NotFound(c, "Evaluasi perkuliahan tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Detail evaluasi perkuliahan berhasil diambil", eval)
}

func (h *EvaluationHandler) GetEvaluationByClass(c *gin.Context) {
	classID := c.Param("classId")
	eval, err := h.usecase.GetEvaluationByClass(classID)
	if err != nil {
		response.NotFound(c, "Evaluasi untuk kelas ini belum diisi")
		return
	}
	response.Success(c, http.StatusOK, "Detail evaluasi perkuliahan berhasil diambil", eval)
}

func (h *EvaluationHandler) SaveEvaluation(c *gin.Context) {
	var req model.CourseEvaluation
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data evaluasi perkuliahan tidak valid", err.Error())
		return
	}
	saved, err := h.usecase.SaveEvaluation(&req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Evaluasi perkuliahan berhasil disimpan", saved)
}

func (h *EvaluationHandler) SubmitEvaluation(c *gin.Context) {
	classID := c.Param("classId")
	if err := h.usecase.SubmitEvaluation(classID); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Evaluasi perkuliahan berhasil diserahkan secara final", nil)
}

func (h *EvaluationHandler) GetImprovementPlansByCourse(c *gin.Context) {
	courseID := c.Param("courseId")
	plans, err := h.usecase.GetImprovementPlansByCourse(courseID)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil rencana perbaikan mata kuliah: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Rencana perbaikan dari evaluasi semester sebelumnya", plans)
}

func (h *EvaluationHandler) UpdateImprovementPlan(c *gin.Context) {
	planID := c.Param("planId")
	var req struct {
		Status           string `json:"status"`
		StatusPenerapan  string `json:"status_penerapan"`
		AppliedInRpsID   string `json:"applied_in_rps_id"`
		CatatanPenerapan string `json:"catatan_penerapan"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format update rencana perbaikan tidak valid", err.Error())
		return
	}
	status := req.Status
	if status == "" {
		status = req.StatusPenerapan
	}
	if err := h.usecase.UpdateImprovementPlan(planID, status, req.AppliedInRpsID, req.CatatanPenerapan); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Status penerapan rencana perbaikan RPS berhasil diperbarui", nil)
}

func (h *EvaluationHandler) GetRecap(c *gin.Context) {
	recap, err := h.usecase.GetRecap()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil rekapitulasi evaluasi: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi post evaluasi perkuliahan", recap)
}

// PRD Milestone 3 Endpoints:

// GET /evaluations/:id/student-feedback (Umpan Balik EDOM Mahasiswa)
func (h *EvaluationHandler) GetStudentFeedback(c *gin.Context) {
	id := c.Param("id")
	fb, err := h.usecase.GetStudentFeedback(id)
	if err != nil {
		response.NotFound(c, "Umpan balik mahasiswa tidak ditemukan: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Umpan balik mahasiswa (EDOM) berhasil diambil", fb)
}

// POST /evaluations/:id/review (Tinjauan Tim GKM)
func (h *EvaluationHandler) ReviewEvaluation(c *gin.Context) {
	id := c.Param("id")
	reviewerID := c.GetString(middleware.CtxUserID)

	var req struct {
		CatatanGKM       string                         `json:"catatan_gkm" binding:"required"`
		Rekomendasi      string                         `json:"rekomendasi"`
		ImprovementPlans []*model.CourseImprovementPlan `json:"improvement_plans"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data tinjauan GKM tidak valid", err.Error())
		return
	}

	if err := h.usecase.ReviewEvaluation(id, reviewerID, req.CatatanGKM, req.Rekomendasi, req.ImprovementPlans); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Tinjauan evaluasi perkuliahan oleh tim GKM berhasil disimpan", nil)
}
