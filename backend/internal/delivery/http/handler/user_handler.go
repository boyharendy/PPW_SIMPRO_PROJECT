package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type UserHandler struct {
	userUsecase usecase.UserUsecase
}

func NewUserHandler(userUsecase usecase.UserUsecase) *UserHandler {
	return &UserHandler{userUsecase: userUsecase}
}

func (h *UserHandler) GetUsers(c *gin.Context) {
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	users, total, err := h.userUsecase.GetUsers(search, page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil data pengguna")
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

	response.SuccessWithMeta(c, http.StatusOK, "Daftar pengguna berhasil diambil", users, meta)
}

func (h *UserHandler) GetUserByID(c *gin.Context) {
	id := c.Param("id")
	user, err := h.userUsecase.GetUserByID(id)
	if err != nil {
		response.NotFound(c, "Pengguna tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Detail pengguna berhasil diambil", user)
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var req model.User
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data update tidak valid", err.Error())
		return
	}

	updated, err := h.userUsecase.UpdateUser(id, &req)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Pengguna berhasil diperbarui", updated)
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.userUsecase.DeleteUser(id); err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Pengguna berhasil dihapus", nil)
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var req model.User
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data pengguna tidak valid", err.Error())
		return
	}

	if req.NamaLengkap == "" || req.Email == "" {
		response.BadRequest(c, "Nama lengkap dan email wajib diisi", nil)
		return
	}

	created, err := h.userUsecase.CreateUser(&req)
	if err != nil {
		response.InternalServerError(c, "Gagal membuat pengguna baru: "+err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "Pengguna berhasil ditambahkan", created)
}

func (h *UserHandler) GetRoles(c *gin.Context) {
	roles := h.userUsecase.GetAvailableRoles()
	response.Success(c, http.StatusOK, "Daftar peran sistem SIMPRO", roles)
}
