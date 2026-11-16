package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type AdminHandler struct {
	usecase usecase.AdminUsecase
}

func NewAdminHandler(uc usecase.AdminUsecase) *AdminHandler {
	return &AdminHandler{usecase: uc}
}

func (h *AdminHandler) GetSettings(c *gin.Context) {
	settings, err := h.usecase.GetSettings()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil pengaturan sistem: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Pengaturan sistem berhasil diambil", settings)
}

func (h *AdminHandler) UpdateSetting(c *gin.Context) {
	key := c.Param("key")

	activeRole := middleware.NormalizeRole(middleware.ActiveRole(c))
	if activeRole == model.RoleAdminProdi && key != "max_upload_mb" {
		response.Forbidden(c, "Akses ditolak: Admin Prodi hanya memiliki hak akses mengubah batasan unggahan (max_upload_mb)")
		return
	}

	var req struct {
		Value string `json:"value" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Nilai konfigurasi (value) wajib diisi", err.Error())
		return
	}
	if err := h.usecase.UpdateSetting(key, req.Value); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Pengaturan sistem berhasil diperbarui", nil)
}

func (h *AdminHandler) GetUserRoles(c *gin.Context) {
	roles, err := h.usecase.GetUserRoles()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar peran pengguna: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Daftar penugasan peran khusus berhasil diambil", roles)
}

func (h *AdminHandler) AssignUserRole(c *gin.Context) {
	var req model.UserRoleAssignment
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data penugasan peran tidak valid", err.Error())
		return
	}
	if err := h.usecase.AssignUserRole(&req); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Peran khusus pengguna berhasil ditugaskan", req)
}

func (h *AdminHandler) RevokeUserRole(c *gin.Context) {
	id := c.Param("id")
	if err := h.usecase.RevokeUserRole(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Peran khusus pengguna berhasil dicabut", nil)
}

func (h *AdminHandler) GetAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	logs, total, err := h.usecase.GetAuditLogs(page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil log audit: "+err.Error())
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

	response.SuccessWithMeta(c, http.StatusOK, "Log audit sistem berhasil diambil", logs, meta)
}

func (h *AdminHandler) RunScheduler(c *gin.Context) {
	results := h.usecase.RunSchedulerJobs()
	response.Success(c, http.StatusOK, "Batch scheduler 07:00 WIB berhasil dijalankan", results)
}

