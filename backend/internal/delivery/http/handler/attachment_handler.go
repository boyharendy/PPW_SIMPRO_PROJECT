package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type AttachmentHandler struct {
	usecase usecase.AttachmentUsecase
}

func NewAttachmentHandler(uc usecase.AttachmentUsecase) *AttachmentHandler {
	return &AttachmentHandler{usecase: uc}
}

func (h *AttachmentHandler) Upload(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "Berkas file wajib diunggah dalam format multipart/form-data", err.Error())
		return
	}

	entityTypeStr := c.DefaultPostForm("entity_type", "COMPLAINT")
	entityID := c.PostForm("entity_id")

	f, err := fileHeader.Open()
	if err != nil {
		response.InternalServerError(c, "Gagal membuka berkas yang diunggah: "+err.Error())
		return
	}
	defer f.Close()

	var uploadedBy *string
	userID := c.GetString(middleware.CtxUserID)
	if userID != "" {
		uploadedBy = &userID
	}

	att, err := h.usecase.UploadFile(
		f,
		fileHeader.Filename,
		fileHeader.Size,
		fileHeader.Header.Get("Content-Type"),
		model.AttachmentEntityType(entityTypeStr),
		entityID,
		uploadedBy,
	)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	resp := &model.AttachmentUploadResponse{
		ID:        att.ID,
		FileName:  att.FileName,
		FileURL:   att.FileURL,
		FileSize:  att.FileSize,
		MimeType:  att.MimeType,
		CreatedAt: att.CreatedAt,
	}

	response.Success(c, http.StatusCreated, "Berkas berhasil diunggah dan disanitasi", resp)
}

func (h *AttachmentHandler) GetURL(c *gin.Context) {
	id := c.Param("id")
	url, err := h.usecase.GetAttachmentURL(id)
	if err != nil {
		response.NotFound(c, "Lampiran tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "URL lampiran berhasil diambil", gin.H{
		"id":  id,
		"url": url,
	})
}

