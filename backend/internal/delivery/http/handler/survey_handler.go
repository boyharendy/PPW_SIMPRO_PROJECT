package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type SurveyHandler struct {
	usecase usecase.SurveyUsecase
}

func NewSurveyHandler(uc usecase.SurveyUsecase) *SurveyHandler {
	return &SurveyHandler{usecase: uc}
}

func (h *SurveyHandler) GetSurveys(c *gin.Context) {
	surveys, err := h.usecase.GetSurveys()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar survei: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Daftar instrumen survei berhasil diambil", surveys)
}

func (h *SurveyHandler) GetSurveyByID(c *gin.Context) {
	id := c.Param("id")
	survey, err := h.usecase.GetSurveyByID(id)
	if err != nil {
		response.NotFound(c, "Survei tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Detail survei berhasil diambil", survey)
}

func (h *SurveyHandler) CreateSurvey(c *gin.Context) {
	var req model.PartnerSurvey
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data survei tidak valid", err.Error())
		return
	}
	created, err := h.usecase.CreateSurvey(&req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Instrumen survei berhasil dibuat", created)
}

func (h *SurveyHandler) UpdateSurvey(c *gin.Context) {
	id := c.Param("id")
	var req model.PartnerSurvey
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data update survei tidak valid", err.Error())
		return
	}
	updated, err := h.usecase.UpdateSurvey(id, &req)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Instrumen survei berhasil diperbarui", updated)
}

func (h *SurveyHandler) DeleteSurvey(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.DeleteSurvey(id); err != nil {
		response.InternalServerError(c, "Gagal menghapus survei")
		return
	}
	response.Success(c, http.StatusOK, "Survei berhasil dihapus", nil)
}

func (h *SurveyHandler) CreateInvitation(c *gin.Context) {
	var req model.PartnerInvitation
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data undangan tidak valid", err.Error())
		return
	}
	inv, err := h.usecase.CreateInvitation(&req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Undangan survei berhasil dibuat", inv)
}

func (h *SurveyHandler) GetInvitations(c *gin.Context) {
	surveyID := c.Query("survey_id")
	invs, err := h.usecase.GetInvitations(surveyID)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar undangan: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Daftar undangan survei mitra berhasil diambil", invs)
}

func (h *SurveyHandler) SubmitManualResponse(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)
	var req model.ManualResponseSubmission
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format input manual survei tidak valid", err.Error())
		return
	}
	if err := h.usecase.SubmitManualResponse(userID, &req); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Penilaian kepuasan mitra (input manual koordinator) berhasil disimpan", nil)
}

func (h *SurveyHandler) GetPublicSurvey(c *gin.Context) {
	token := c.Param("token")
	survey, inv, err := h.usecase.GetPublicSurvey(token)
	if err != nil {
		response.NotFound(c, "Tautan survei tidak valid atau sudah kedaluwarsa")
		return
	}
	data := gin.H{
		"survey":     survey,
		"invitation": inv,
	}
	response.Success(c, http.StatusOK, "Formulir survei mitra", data)
}

func (h *SurveyHandler) SubmitPublicResponse(c *gin.Context) {
	token := c.Param("token")
	var req model.PartnerResponseSubmission
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data jawaban tidak valid", err.Error())
		return
	}
	req.InvitationToken = token
	if err := h.usecase.SubmitPublicResponse(&req); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Terima kasih, kuesioner kepuasan mitra berhasil dikirimkan", nil)
}

func (h *SurveyHandler) GetRecap(c *gin.Context) {
	id := c.Param("id")
	recap, err := h.usecase.GetRecap(id)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi kepuasan mitra berhasil diambil", recap)
}
