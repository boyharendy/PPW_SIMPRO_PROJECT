package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type RkaHandler struct {
	usecase usecase.RkaUsecase
}

func NewRkaHandler(uc usecase.RkaUsecase) *RkaHandler {
	return &RkaHandler{usecase: uc}
}

func (h *RkaHandler) GetRkaList(c *gin.Context) {
	list, err := h.usecase.GetRkaList()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar dokumen RKA: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Daftar dokumen RKA berhasil diambil", list)
}

func (h *RkaHandler) GetRkaByYear(c *gin.Context) {
	tahun := c.Param("tahun")
	doc, err := h.usecase.GetRkaByYear(tahun)
	if err != nil {
		response.NotFound(c, "Dokumen RKA tahun "+tahun+" tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Detail dokumen RKA berhasil diambil", doc)
}

func (h *RkaHandler) CreateRka(c *gin.Context) {
	var req model.RkaDocument
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data RKA tidak valid", err.Error())
		return
	}
	created, err := h.usecase.CreateRka(&req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Dokumen RKA berhasil dibuat", created)
}

func (h *RkaHandler) UpdateRka(c *gin.Context) {
	tahun := c.Param("tahun")
	var req model.RkaDocument
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data update RKA tidak valid", err.Error())
		return
	}
	updated, err := h.usecase.UpdateRka(tahun, &req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Dokumen RKA berhasil diperbarui", updated)
}

func (h *RkaHandler) AddRealization(c *gin.Context) {
	tahun := c.Param("tahun")
	var req model.RkaRealization
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data realisasi tidak valid", err.Error())
		return
	}
	if err := h.usecase.AddRealization(tahun, &req); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Realisasi anggaran berhasil dicatatkan", nil)
}

func (h *RkaHandler) GetSerapan(c *gin.Context) {
	tahun := c.Param("tahun")
	serapan, err := h.usecase.GetSerapan(tahun)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Informasi serapan anggaran RKA", serapan)
}
