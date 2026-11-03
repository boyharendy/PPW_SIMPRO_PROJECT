package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// PaginationMeta standard metadata for paginated results
type PaginationMeta struct {
	Page         int  `json:"page"`
	Limit        int  `json:"limit"`
	TotalRecords int  `json:"total_records"`
	TotalPages   int  `json:"total_pages"`
	HasNext      bool `json:"has_next"`
	HasPrev      bool `json:"has_prev"`
}

// SuccessResponse standard success JSON envelope
type SuccessResponse struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    interface{}     `json:"data"`
	Meta    *PaginationMeta `json:"meta,omitempty"`
}

// ErrorResponse standard error JSON envelope
type ErrorResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Code    string      `json:"code,omitempty"`
	Errors  interface{} `json:"errors,omitempty"`
}

// Success sends a standard HTTP success response
func Success(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// SuccessWithMeta sends a standard HTTP success response with pagination meta
func SuccessWithMeta(c *gin.Context, statusCode int, message string, data interface{}, meta *PaginationMeta) {
	c.JSON(statusCode, SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	})
}

// Error sends a standard HTTP error response
func Error(c *gin.Context, statusCode int, message string, code string, errors interface{}) {
	c.JSON(statusCode, ErrorResponse{
		Success: false,
		Message: message,
		Code:    code,
		Errors:  errors,
	})
}

// BadRequest sends a 400 Bad Request error
func BadRequest(c *gin.Context, message string, errors interface{}) {
	Error(c, http.StatusBadRequest, message, "BAD_REQUEST", errors)
}

// Unauthorized sends a 401 Unauthorized error
func Unauthorized(c *gin.Context, message string) {
	Error(c, http.StatusUnauthorized, message, "UNAUTHORIZED", nil)
}

// Forbidden sends a 403 Forbidden error
func Forbidden(c *gin.Context, message string) {
	Error(c, http.StatusForbidden, message, "FORBIDDEN", nil)
}

// NotFound sends a 404 Not Found error
func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, message, "NOT_FOUND", nil)
}

// InternalServerError sends a 500 Internal Server Error
func InternalServerError(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, message, "INTERNAL_SERVER_ERROR", nil)
}
