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

		c.Next()
	}
}

// RequireRole guards endpoints by specific roles
func RequireRole(allowedRoles ...model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		activeRoleVal, exists := c.Get(CtxActiveRole)
		if !exists {
			response.Forbidden(c, "Akses ditolak: role tidak ditemukan")
			c.Abort()
			return
		}

		activeRole := activeRoleVal.(model.Role)
		for _, r := range allowedRoles {
			if r == activeRole {
				c.Next()
				return
			}
		}

		response.Forbidden(c, "Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini")
		c.Abort()
	}
}
