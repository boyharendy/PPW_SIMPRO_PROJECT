package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"simpro-backend/pkg/response"
)

// Anonymous submissions and retired ticket URLs must never appear in request or panic logs.
func PrivateRecovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if recover() != nil {
				c.Abort()
				response.InternalServerError(c, "Terjadi kesalahan server")
			}
		}()
		c.Next()
	}
}

func Anonymous() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		if c.GetHeader("Authorization") != "" {
			response.BadRequest(c, "Kirim secara anonim tanpa sesi akun", nil)
			c.Abort()
			return
		}
		if c.ContentType() != "multipart/form-data" {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
		}
		c.Next()
	}
}
