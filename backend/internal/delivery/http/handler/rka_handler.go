package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/export"
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
	tahun := c.Param("id")
	if tahun == "" {
		tahun = c.Param("tahun")
	}
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
	tahun := c.Param("id")
	if tahun == "" {
		tahun = c.Param("tahun")
	}
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
	tahun := c.Param("id")
	if tahun == "" {
		tahun = c.Param("tahun")
	}
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
	tahun := c.Param("id")
	if tahun == "" {
		tahun = c.Param("tahun")
	}
	serapan, err := h.usecase.GetSerapan(tahun)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	format := c.Query("format")
	if format == "xlsx" || format == "csv" || format == "pdf" {
		c.Header("Content-Disposition", "attachment; filename=monitoring-serapan-rka.csv")
		c.Data(http.StatusOK, "text/csv; charset=utf-8", export.ExportRkaSerapanCSV(serapan))
		return
	}
	response.Success(c, http.StatusOK, "Informasi serapan anggaran RKA", serapan)
}

// PRD Milestone 2 Endpoints:

// GET /rka/:id/working-version
func (h *RkaHandler) GetWorkingVersion(c *gin.Context) {
	id := c.Param("id")
	ver, err := h.usecase.GetWorkingVersion(id)
	if err != nil {
		response.NotFound(c, "Versi kerja RKA tidak ditemukan: "+err.Error())
		return
	}
	c.Header("ETag", fmt.Sprintf("\"%d\"", ver.RowVersion))
	response.Success(c, http.StatusOK, "Versi kerja RKA berhasil diambil", ver)
}

// PUT /rka/:id/working-version (Optimistic Locking via If-Match header)
func (h *RkaHandler) UpdateWorkingVersion(c *gin.Context) {
	id := c.Param("id")
	ifMatch := repository.ParseIfMatch(c.GetHeader("If-Match"))

	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.BadRequest(c, "Format data draf versi kerja tidak valid", err.Error())
		return
	}

	updated, err := h.usecase.UpdateWorkingVersion(id, ifMatch, payload)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "precondition failed") {
			c.JSON(http.StatusPreconditionFailed, gin.H{
				"success": false,
				"error":   err.Error(),
				"message": "Konflik versi: dokumen telah diedit oleh pengguna lain.",
			})
			return
		}
		response.BadRequest(c, err.Error(), nil)
		return
	}

	c.Header("ETag", fmt.Sprintf("\"%d\"", updated.RowVersion))
	response.Success(c, http.StatusOK, "Draf versi kerja RKA berhasil disimpan", updated)
}

// POST /rka/:id/working-version/submit
func (h *RkaHandler) SubmitWorkingVersion(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.SubmitWorkingVersion(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Versi kerja RKA berhasil diajukan ke Kaprodi", nil)
}

// GET /rka/:id/versions/:nomor/diff
func (h *RkaHandler) GetVersionDiff(c *gin.Context) {
	id := c.Param("id")
	nomor, _ := strconv.Atoi(c.Param("nomor"))
	diff, err := h.usecase.GetVersionDiff(id, nomor)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Perbandingan diff versi RKA berhasil dihitung", diff)
}

// POST /rka/:id/versions/:nomor/decision
func (h *RkaHandler) DecideVersion(c *gin.Context) {
	id := c.Param("id")
	nomor, _ := strconv.Atoi(c.Param("nomor"))
	actorID := c.GetString(middleware.CtxUserID)

	var req struct {
		Approved bool `json:"approved"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format keputusan versi tidak valid", err.Error())
		return
	}

	if err := h.usecase.DecideVersion(id, nomor, req.Approved, actorID); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	msg := fmt.Sprintf("Versi RKA nomor %d berhasil disetujui dan diterapkan", nomor)
	if !req.Approved {
		msg = fmt.Sprintf("Versi RKA nomor %d telah ditolak", nomor)
	}
	response.Success(c, http.StatusOK, msg, nil)
}

// POST /rka/:id/close
func (h *RkaHandler) CloseRka(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.CloseRka(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Tahun anggaran RKA berhasil ditutup", nil)
}
