package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/export"
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
	var req model.PartnerResponseSubmission
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
	format := c.Query("format")
	if format == "xlsx" || format == "csv" || format == "pdf" {
		c.Header("Content-Disposition", "attachment; filename=rekap-kepuasan-mitra.csv")
		c.Data(http.StatusOK, "text/csv; charset=utf-8", export.ExportSurveyRecapCSV(recap))
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi kepuasan mitra berhasil diambil", recap)
}

// ActivateTemplate handles POST /api/v1/surveys/templates/:id/activate
func (h *SurveyHandler) ActivateTemplate(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.ActivateTemplate(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Template instrumen survei berhasil diaktifkan", nil)
}

// DuplicateTemplate handles POST /api/v1/surveys/templates/:id/duplicate
func (h *SurveyHandler) DuplicateTemplate(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)
	dup, err := h.usecase.DuplicateTemplate(id, userID)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Template instrumen survei berhasil diduplikasi sebagai draf baru", dup)
}

// ArchiveTemplate handles POST /api/v1/surveys/templates/:id/archive
func (h *SurveyHandler) ArchiveTemplate(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.ArchiveTemplate(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Template instrumen survei berhasil diarsipkan", nil)
}

// SendInvitation handles POST /api/v1/surveys/invitations/:id/send
func (h *SurveyHandler) SendInvitation(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.SendInvitation(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Undangan survei mitra berhasil dikirim", nil)
}

// RemindInvitation handles POST /api/v1/surveys/invitations/:id/remind
func (h *SurveyHandler) RemindInvitation(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.RemindInvitation(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Pengingat kuesioner mitra berhasil dikirimkan", nil)
}

// ResendInvitation handles POST /api/v1/surveys/invitations/:id/resend
func (h *SurveyHandler) ResendInvitation(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.ResendInvitation(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Tautan undangan baru berhasil dibuat dan dikirimkan ulang ke mitra", nil)
}

// CancelInvitation handles POST /api/v1/surveys/invitations/:id/cancel
func (h *SurveyHandler) CancelInvitation(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.CancelInvitation(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Undangan survei mitra berhasil dibatalkan", nil)
}

// GetPlacements handles GET /api/v1/surveys/placements
func (h *SurveyHandler) GetPlacements(c *gin.Context) {
	program := c.Query("program")
	academicPeriodID := c.Query("academic_period_id")
	placements, err := h.usecase.GetPlacements(program, academicPeriodID)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil data penempatan mahasiswa: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Daftar penempatan mahasiswa mitra berhasil diambil", placements)
}

// VoidResponse handles POST /api/v1/surveys/responses/:id/void
func (h *SurveyHandler) VoidResponse(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)
	var req struct {
		Alasan string `json:"alasan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Alasan pembatalan (void) respons wajib diisi", err.Error())
		return
	}
	if err := h.usecase.VoidResponse(id, userID, req.Alasan); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Respons survei mitra berhasil dibatalkan (void)", nil)
}
