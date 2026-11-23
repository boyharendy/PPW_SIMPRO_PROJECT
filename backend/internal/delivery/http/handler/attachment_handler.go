package handler

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type AttachmentAccess func(*model.User, model.AttachmentEntityType, string, bool) bool
type AttachmentHandler struct {
	usecase usecase.AttachmentUsecase
	allowed AttachmentAccess
}

func NewAttachmentHandler(uc usecase.AttachmentUsecase, access ...AttachmentAccess) *AttachmentHandler {
	h := &AttachmentHandler{usecase: uc}
	if len(access) > 0 {
		h.allowed = access[0]
	}
	return h
}
func (h *AttachmentHandler) authorize(c *gin.Context, kind model.AttachmentEntityType, id string, write bool) bool {
	value, _ := c.Get("principal")
	u, _ := value.(*model.User)
	if h.allowed == nil || u == nil || id == "" || !h.allowed(u, kind, id, write) {
		response.Forbidden(c, "Akses lampiran ditolak")
		return false
	}
	return true
}
func prepareMultipart(c *gin.Context, uc usecase.AttachmentUsecase, optional bool) (*usecase.PreparedFile, bool) {
	if uc == nil {
		response.InternalServerError(c, "Layanan lampiran tidak tersedia")
		return nil, false
	}
	limit, err := uc.Limit()
	if err != nil {
		response.InternalServerError(c, "Konfigurasi unggahan tidak tersedia")
		return nil, false
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit+(128<<10))
	err = c.Request.ParseMultipartForm(1 << 20)
	if err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			response.Error(c, 413, "Ukuran unggahan melebihi batas", "FILE_TOO_LARGE", nil)
		} else {
			response.BadRequest(c, "Formulir multipart tidak valid", nil)
		}
		return nil, false
	}
	files := c.Request.MultipartForm.File["file"]
	if len(files) == 0 && len(c.Request.MultipartForm.File) == 0 && optional {
		return nil, true
	}
	if len(files) != 1 || len(c.Request.MultipartForm.File) != 1 {
		response.BadRequest(c, "Sertakan satu berkas", nil)
		return nil, false
	}
	file, err := files[0].Open()
	if err != nil {
		response.BadRequest(c, "Berkas gagal dibaca", nil)
		return nil, false
	}
	defer file.Close()
	f, err := uc.Prepare(file, files[0].Filename, files[0].Size)
	if errors.Is(err, usecase.ErrTooLarge) {
		response.Error(c, 413, err.Error(), "FILE_TOO_LARGE", nil)
		return nil, false
	}
	if err != nil {
		response.Error(c, 415, "Tipe atau isi berkas tidak valid", "UNSUPPORTED_MEDIA_TYPE", nil)
		return nil, false
	}
	return f, true
}
func (h *AttachmentHandler) Upload(c *gin.Context) {
	f, ok := prepareMultipart(c, h.usecase, false)
	if !ok {
		return
	}
	kind := model.AttachmentEntityType(c.PostForm("entity_type"))
	id := c.PostForm("entity_id")
	if !h.authorize(c, kind, id, true) {
		return
	}
	uid := c.GetString("user_id")
	a, err := h.usecase.Save(f, kind, id, &uid)
	if err != nil {
		response.InternalServerError(c, "Penyimpanan berkas gagal")
		return
	}
	response.Success(c, 201, "Lampiran tersimpan", model.AttachmentUploadResponse{ID: a.ID, FileName: a.FileName, FileSize: a.FileSize, MimeType: a.MimeType, CreatedAt: a.CreatedAt})
}
func (h *AttachmentHandler) GetURL(c *gin.Context) {
	a, err := h.usecase.GetAttachmentByID(c.Param("id"))
	if err != nil {
		response.NotFound(c, "Lampiran tidak ditemukan")
		return
	}
	if !h.authorize(c, a.EntityType, a.EntityID, false) {
		return
	}
	signedAttachment(c, h.usecase, a.ID)
}
func signedAttachment(c *gin.Context, uc usecase.AttachmentUsecase, id string) {
	link, err := uc.GetAttachmentURL(id)
	if err != nil {
		response.NotFound(c, "Berkas tidak tersedia")
		return
	}
	c.Header("Cache-Control", "no-store")
	response.Success(c, 200, "URL lampiran", gin.H{"id": id, "url": link})
}
