package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/model"
	"simpro-backend/pkg/response"
	"simpro-backend/pkg/utils"
)

const (
	CtxUserID     = "user_id"
	CtxUserEmail  = "user_email"
	CtxUserRoles  = "user_roles"
	CtxActiveRole = "active_role"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "Authorization header tidak ditemukan")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.Unauthorized(c, "Format Authorization header harus 'Bearer <token>'")
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			response.Unauthorized(c, "Token tidak valid atau sudah kadaluarsa")
			c.Abort()
			return
		}

		// Store user details in context
		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxUserEmail, claims.Email)
		c.Set(CtxUserRoles, claims.Roles)
		c.Set(CtxActiveRole, claims.ActiveRole)
		c.Set("is_violence_handler", claims.PenangananKekerasan)

		c.Next()
	}
}

// roleAlias maps legacy or specific roles to the 13 canonical actors (SKPL Bab 2)
var roleAlias = map[model.Role]model.Role{
	model.RoleKoordKP:          model.RoleKoordKP_PSI_PDLK,
	model.RoleKoordPSI:         model.RoleKoordKP_PSI_PDLK,
	model.RoleKoordPDLK:        model.RoleKoordKP_PSI_PDLK,
	model.RolePetugasKekerasan: model.RolePengelolaAduan,
	model.RoleHimpunan:         model.RolePengurusHimpunan,
	model.RoleMitraEksternal:   model.RoleMitra,
}

// NormalizeRole resolves aliases to canonical 13 roles
func NormalizeRole(r model.Role) model.Role {
	if canonical, ok := roleAlias[r]; ok {
		return canonical
	}
	return r
}

// ActiveRole safely extracts the active role from gin context
func ActiveRole(c *gin.Context) model.Role {
	val, exists := c.Get(CtxActiveRole)
	if !exists || val == nil {
		return ""
	}
	switch v := val.(type) {
	case model.Role:
		return v
	case string:
		return model.Role(v)
	default:
		return ""
	}
}

// RequireRole guards endpoints by specific roles (with canonical role normalization)
func RequireRole(allowedRoles ...model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		activeRole := ActiveRole(c)
		if activeRole == "" {
			response.Forbidden(c, "Akses ditolak: role tidak ditemukan")
			c.Abort()
			return
		}

		normalizedActive := NormalizeRole(activeRole)

		for _, r := range allowedRoles {
			if r == activeRole || NormalizeRole(r) == normalizedActive {
				c.Next()
				return
			}
		}

		response.Forbidden(c, "Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini")
		c.Abort()
	}
}
