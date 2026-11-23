package handler

import (
	"context"
	"net/http"
	"simpro-backend/internal/identity"
	"strings"

	"github.com/gin-gonic/gin"

	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type AuthHandler struct {
	authUsecase usecase.AuthUsecase
	provider    *identity.Provider
}

func NewAuthHandler(authUsecase usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{authUsecase: authUsecase}
}

func NewCloudAuthHandler(p *identity.Provider) *AuthHandler { return &AuthHandler{provider: p} }
func bearer(c *gin.Context) string {
	_, v, _ := strings.Cut(c.GetHeader("Authorization"), " ")
	return v
}
func (h *AuthHandler) Authenticate(ctx context.Context, token string) (*model.User, error) {
	if h.provider != nil {
		return h.provider.Authenticate(ctx, token)
	}
	return h.authUsecase.Authenticate(token)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data login tidak valid", err.Error())
		return
	}

	var res *model.AuthResponse
	var err error
	if h.provider != nil {
		res, err = h.provider.Login(c.Request.Context(), &req)
	} else {
		res, err = h.authUsecase.Login(&req)
	}
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Login berhasil", res)
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data registrasi tidak lengkap atau tidak valid", err.Error())
		return
	}

	if h.provider != nil {
		if err := h.provider.Register(c.Request.Context(), &req); err != nil {
			response.BadRequest(c, "Registrasi gagal", nil)
			return
		}
		response.Success(c, http.StatusAccepted, "Periksa email dan tunggu aktivasi profil prodi", nil)
		return
	}
	res, err := h.authUsecase.Register(&req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, "Registrasi berhasil", res)
}

func (h *AuthHandler) Me(c *gin.Context) {
	user, ok := c.Get("principal")
	if !ok {
		response.Unauthorized(c, "Sesi tidak valid")
		return
	}
	response.Success(c, http.StatusOK, "Data profil berhasil diambil", user)
}

func (h *AuthHandler) SwitchRole(c *gin.Context) {

	var req model.SwitchRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Pilihan role tidak valid", err.Error())
		return
	}

	var res *model.AuthResponse
	var err error
	if h.provider != nil {
		res, err = h.provider.Switch(c.Request.Context(), bearer(c), req.Role)
	} else {
		res, err = h.authUsecase.SwitchRole(bearer(c), req.Role)
	}
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Peran aktif berhasil diubah", res)
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req model.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Refresh token wajib dikirim", err.Error())
		return
	}

	var tokens *model.AuthTokens
	var err error
	if h.provider != nil {
		tokens, err = h.provider.Refresh(c.Request.Context(), &req)
	} else {
		tokens, err = h.authUsecase.RefreshToken(req.RefreshToken)
	}
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Token berhasil diperbarui", tokens)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var err error
	if h.provider != nil {
		err = h.provider.Logout(c.Request.Context(), bearer(c))
	} else {
		err = h.authUsecase.Logout(bearer(c))
	}
	if err != nil {
		response.Unauthorized(c, "Sesi tidak valid")
		return
	}
	response.Success(c, http.StatusOK, "Logout berhasil", nil)
}
