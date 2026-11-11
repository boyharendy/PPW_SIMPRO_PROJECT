package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
)

func TestRequireRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name         string
		setContext   func(c *gin.Context)
		allowedRoles []model.Role
		expectedCode int
	}{
		{
			name: "No role in context returns 403",
			setContext: func(c *gin.Context) {
				// No role set
			},
			allowedRoles: []model.Role{model.RoleKaprodi},
			expectedCode: http.StatusForbidden,
		},
		{
			name: "Mahasiswa cannot access Kaprodi endpoint",
			setContext: func(c *gin.Context) {
				c.Set(middleware.CtxActiveRole, model.RoleMahasiswa)
			},
			allowedRoles: []model.Role{model.RoleKaprodi},
			expectedCode: http.StatusForbidden,
		},
		{
			name: "Kaprodi can access Kaprodi endpoint",
			setContext: func(c *gin.Context) {
				c.Set(middleware.CtxActiveRole, model.RoleKaprodi)
			},
			allowedRoles: []model.Role{model.RoleKaprodi},
			expectedCode: http.StatusOK,
		},
		{
			name: "Role string type in context handled safely",
			setContext: func(c *gin.Context) {
				c.Set(middleware.CtxActiveRole, "KAPRODI")
			},
			allowedRoles: []model.Role{model.RoleKaprodi},
			expectedCode: http.StatusOK,
		},
		{
			name: "Koordinator KP alias matches Koordinator KP_PSI_PDLK",
			setContext: func(c *gin.Context) {
				c.Set(middleware.CtxActiveRole, model.RoleKoordKP)
			},
			allowedRoles: []model.Role{model.RoleKoordKP_PSI_PDLK},
			expectedCode: http.StatusOK,
		},
		{
			name: "Petugas Kekerasan alias matches Pengelola Aduan",
			setContext: func(c *gin.Context) {
				c.Set(middleware.CtxActiveRole, model.RolePetugasKekerasan)
			},
			allowedRoles: []model.Role{model.RolePengelolaAduan},
			expectedCode: http.StatusOK,
		},
		{
			name: "Himpunan alias matches Pengurus Himpunan",
			setContext: func(c *gin.Context) {
				c.Set(middleware.CtxActiveRole, model.RoleHimpunan)
			},
			allowedRoles: []model.Role{model.RolePengurusHimpunan},
			expectedCode: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.GET("/protected", func(c *gin.Context) {
				tt.setContext(c)
				c.Next()
			}, middleware.RequireRole(tt.allowedRoles...), func(c *gin.Context) {
				c.String(http.StatusOK, "OK")
			})

			req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != tt.expectedCode {
				t.Errorf("expected status %d, got %d", tt.expectedCode, w.Code)
			}
		})
	}
}

