package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"simpro-backend/pkg/response"
)

type HealthHandler struct {
	startTime time.Time
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{startTime: time.Now()}
}

func (h *HealthHandler) Health(c *gin.Context) {
	data := gin.H{
		"service": "simpro-backend",
		"status":  "healthy",
		"uptime":  time.Since(h.startTime).String(),
		"time":    time.Now().Format(time.RFC3339),
	}
	response.Success(c, http.StatusOK, "Backend SIMPRO berjalan normal", data)
}
