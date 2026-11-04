package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/config"
	"simpro-backend/pkg/response"
)

type HealthHandler struct {
	cfg       *config.Config
	startTime time.Time
}

func NewHealthHandler(cfg *config.Config) *HealthHandler {
	return &HealthHandler{cfg: cfg, startTime: time.Now()}
}

func (h *HealthHandler) Health(c *gin.Context) {
	supabaseStatus := "not_configured"
	if h.cfg.SupabaseURL != "" && h.cfg.SupabaseAnonKey != "" {
		supabaseStatus = "configured"
	}

	dbStatus := "in_memory"
	if h.cfg.SupabaseURL != "" && h.cfg.SupabaseServiceKey != "" {
		dbStatus = "connected_supabase_cloud"
	} else if h.cfg.DatabaseURL != "" && !strings.Contains(h.cfg.DatabaseURL, "[YOUR-PASSWORD]") {
		dbStatus = "configured_postgres"
	}

	data := gin.H{
		"service":         "simpro-backend",
		"status":          "healthy",
		"uptime":          time.Since(h.startTime).String(),
		"time":            time.Now().Format(time.RFC3339),
		"frontend_url":    h.cfg.FrontendURL,
		"supabase_url":    h.cfg.SupabaseURL,
		"supabase_status": supabaseStatus,
		"db_status":       dbStatus,
	}
	response.Success(c, http.StatusOK, "Backend SIMPRO berjalan normal", data)
}
