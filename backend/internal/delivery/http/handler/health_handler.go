package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/config"
	"simpro-backend/pkg/response"
)

type HealthHandler struct{}

func NewHealthHandler(_ *config.Config) *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Health(c *gin.Context) {
	response.Success(c, http.StatusOK, "Backend SIMPRO aktif", gin.H{"service": "simpro-backend", "status": "healthy"})
}
