package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
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

func (h *EvaluationHandler) GetRecap(c *gin.Context) {
	recap, err := h.usecase.GetRecap()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil rekapitulasi evaluasi: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi post evaluasi perkuliahan", recap)
}
