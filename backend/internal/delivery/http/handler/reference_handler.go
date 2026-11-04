package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/repository"
	"simpro-backend/pkg/response"
)

type ReferenceHandler struct {
	repo repository.ReferenceRepository
}

func NewReferenceHandler(repo repository.ReferenceRepository) *ReferenceHandler {
	return &ReferenceHandler{repo: repo}
}

func (h *ReferenceHandler) GetAcademicPeriods(c *gin.Context) {
	periods, err := h.repo.GetAcademicPeriods()
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Data periode akademik berhasil diambil", periods)
}

func (h *ReferenceHandler) GetCourses(c *gin.Context) {
	courses, err := h.repo.GetCourses()
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Data mata kuliah berhasil diambil", courses)
}

func (h *ReferenceHandler) GetCourseClasses(c *gin.Context) {
	classes, err := h.repo.GetCourseClasses()
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Data kelas mata kuliah berhasil diambil", classes)
}

func (h *ReferenceHandler) GetPartners(c *gin.Context) {
	partners, err := h.repo.GetPartners()
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Data mitra institusi berhasil diambil", partners)
}

