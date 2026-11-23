package handler

import (
	"errors"
	"github.com/google/uuid"
	"net/http"
	"simpro-backend/pkg/permit"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type ComplaintHandler struct {
	usecase     usecase.ComplaintUsecase
	attachments usecase.AttachmentUsecase
}

func NewComplaintHandler(uc usecase.ComplaintUsecase, attachments ...usecase.AttachmentUsecase) *ComplaintHandler {
	h := &ComplaintHandler{usecase: uc}
	if len(attachments) > 0 {
		h.attachments = attachments[0]
	}
	return h
}

// IssuePermit handles POST /api/v1/aduan/permit (FR-48)
func (h *ComplaintHandler) IssuePermit(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)
	v, _ := c.Get("principal")
	u, _ := v.(*model.User)
	if u == nil || (u.AcademicStatus != "AKTIF" && u.AcademicStatus != "CUTI") {
		response.Forbidden(c, "Permit memerlukan status akademik aktif atau cuti")
		return
	}
	token, exp, err := h.usecase.IssuePermit(c.Request.Context(), userID)
	if errors.Is(err, permit.ErrQuota) {
		response.Error(c, 429, err.Error(), "RATE_LIMITED", nil)
		return
	}
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Permit aduan anonim berhasil diterbitkan", gin.H{
		"permit_token": token,
		"expires_at":   exp.Format(time.RFC3339),
	})
}

func (h *ComplaintHandler) GetComplaints(c *gin.Context) {
	kategori := c.Query("kategori")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	activeRole := middleware.ActiveRole(c)
	isViolenceHandler := (activeRole == model.RolePengelolaAduan && c.GetBool("is_violence_handler")) || activeRole == model.RolePetugasKekerasan

	complaints, total, err := h.usecase.GetComplaints(activeRole, isViolenceHandler, kategori, status, page, limit, c.Query("is_sensitif") == "true")
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar aduan: "+err.Error())
		return
	}

	if limit < 1 {
		limit = 20
	}
	totalPages := (total + limit - 1) / limit
	meta := &response.PaginationMeta{
		Page:         page,
		Limit:        limit,
		TotalRecords: total,
		TotalPages:   totalPages,
		HasNext:      page < totalPages,
		HasPrev:      page > 1,
	}

	response.SuccessWithMeta(c, http.StatusOK, "Daftar aduan berhasil diambil", complaints, meta)
}

func (h *ComplaintHandler) GetComplaintByID(c *gin.Context) {
	id := c.Param("id")
	activeRole := middleware.ActiveRole(c)
	isViolenceHandler := (activeRole == model.RolePengelolaAduan && c.GetBool("is_violence_handler")) || activeRole == model.RolePetugasKekerasan

	if activeRole != model.RoleKaprodi && activeRole != model.RolePengelolaAduan && activeRole != model.RolePetugasKekerasan && !h.permitted(c, true) {
		return
	}
	complaint, err := h.usecase.GetComplaintByID(id, activeRole, isViolenceHandler)
	if err != nil {
		response.NotFound(c, "Aduan tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Detail aduan berhasil diambil", complaint)
}

func (h *ComplaintHandler) CreatePublicComplaint(c *gin.Context) {
	var req model.PublicComplaintRequest
	var file *usecase.PreparedFile
	if c.ContentType() == "multipart/form-data" {
		var ok bool
		file, ok = prepareMultipart(c, h.attachments, true)
		if !ok {
			return
		}
		req = model.PublicComplaintRequest{Judul: c.PostForm("judul"), IsiAduan: c.PostForm("isi_aduan"), Kategori: model.ComplaintCategory(c.PostForm("kategori")), PermitToken: c.PostForm("permit_token"), IsSensitif: c.PostForm("is_sensitif") == "true"}
	} else if c.ShouldBindJSON(&req) != nil {
		response.BadRequest(c, "Data aduan tidak valid", nil)
		return
	}
	if req.PermitToken == "" {
		req.PermitToken = c.GetHeader("X-Permit-Token")
	}
	req.LampiranURL = ""
	req.KontakSukarela = ""
	if file != nil {
		req.LampiranURL = file.ID()
	}
	created, err := h.usecase.CreatePublicComplaint(&req)
	if err != nil {
		response.BadRequest(c, "Data atau permit aduan tidak valid", nil)
		return
	}

	if file != nil {
		if _, err = h.attachments.Save(file, model.AttachmentEntityComplaint, created.ID, nil); err != nil {
			response.InternalServerError(c, "Gagal menyimpan lampiran")
			return
		}
	}
	response.Success(c, 201, "Simpan kode tiket untuk melacak aduan", gin.H{"kode_tiket": created.KodeTiket, "nomor_aduan": created.NomorAduan})
}

func (h *ComplaintHandler) GetPublicComplaint(c *gin.Context) {
	var req struct {
		Ticket string `json:"ticket" binding:"required"`
	}
	if c.ShouldBindJSON(&req) != nil {
		response.BadRequest(c, "Kode tiket diperlukan", nil)
		return
	}
	row, err := h.usecase.GetPublicComplaint(req.Ticket)
	if err != nil {
		response.NotFound(c, "Tiket tidak ditemukan")
		return
	}
	messages := make([]gin.H, 0)
	for _, m := range row.Messages {
		if !m.IsCatatanInternal {
			messages = append(messages, gin.H{"pengirim": m.SenderType, "isi": m.Pesan, "tanggal": m.CreatedAt.Format("2006-01-02"), "lampiran_id": attachmentID(m.LampiranURL)})
		}
	}
	response.Success(c, 200, "Status tiket", gin.H{"nomor_aduan": row.NomorAduan, "kategori": row.Kategori, "status": row.Status, "tanggal_diterima": row.TanggalPengaduan, "rating_kepuasan": row.RatingKepuasan, "messages": messages, "lampiran_id": attachmentID(row.LampiranURL)})
}
func attachmentID(value string) string {
	if uuid.Validate(value) == nil {
		return value
	}
	return ""
}
func (h *ComplaintHandler) AddPublicMessage(c *gin.Context) {
	var req struct {
		Ticket string `json:"ticket"`
		Pesan  string `json:"pesan"`
	}
	var file *usecase.PreparedFile
	if c.ContentType() == "multipart/form-data" {
		var ok bool
		file, ok = prepareMultipart(c, h.attachments, true)
		if !ok {
			return
		}
		req.Ticket = c.PostForm("ticket")
		req.Pesan = c.PostForm("pesan")
	} else if c.ShouldBindJSON(&req) != nil {
		response.BadRequest(c, "Data pesan tidak valid", nil)
		return
	}
	if req.Ticket == "" || strings.TrimSpace(req.Pesan) == "" {
		response.BadRequest(c, "Tiket dan pesan wajib diisi", nil)
		return
	}
	attachment := ""
	if file != nil {
		attachment = file.ID()
	}
	id, err := h.usecase.AddPublicMessage(req.Ticket, req.Pesan, attachment)
	if err != nil {
		response.BadRequest(c, "Pesan gagal disimpan", nil)
		return
	}
	if file != nil {
		if _, err = h.attachments.Save(file, model.AttachmentEntityComplaintMessage, id, nil); err != nil {
			response.InternalServerError(c, "Lampiran gagal disimpan")
			return
		}
	}
	response.Success(c, 200, "Pesan disimpan", nil)
}
func (h *ComplaintHandler) PublicAttachment(c *gin.Context) {
	var req struct {
		Ticket string `json:"ticket" binding:"required"`
		ID     string `json:"id" binding:"required,uuid"`
	}
	if c.ShouldBindJSON(&req) != nil || h.attachments == nil {
		response.BadRequest(c, "Tiket dan ID lampiran diperlukan", nil)
		return
	}
	row, err := h.usecase.GetPublicComplaint(req.Ticket)
	if err != nil {
		response.NotFound(c, "Lampiran tidak ditemukan")
		return
	}
	a, err := h.attachments.GetAttachmentByID(req.ID)
	if err != nil {
		response.NotFound(c, "Lampiran tidak ditemukan")
		return
	}
	allowed := row.LampiranURL == a.ID && a.EntityType == model.AttachmentEntityComplaint && a.EntityID == row.ID
	for _, m := range row.Messages {
		if !m.IsCatatanInternal && m.LampiranURL == a.ID && a.EntityType == model.AttachmentEntityComplaintMessage && a.EntityID == m.ID {
			allowed = true
			break
		}
	}
	if !allowed {
		response.NotFound(c, "Lampiran tidak ditemukan")
		return
	}
	signedAttachment(c, h.attachments, req.ID)
}
func (h *ComplaintHandler) SubmitPublicRating(c *gin.Context) {
	var req struct {
		Ticket   string `json:"ticket" binding:"required"`
		Rating   int    `json:"rating" binding:"min=1,max=5"`
		Komentar string `json:"komentar"`
	}
	if c.ShouldBindJSON(&req) != nil {
		response.BadRequest(c, "Tiket dan penilaian 1-5 diperlukan", nil)
		return
	}
	if err := h.usecase.SubmitPublicRating(req.Ticket, req.Rating, req.Komentar); err != nil {
		response.BadRequest(c, "Penilaian gagal disimpan", nil)
		return
	}
	response.Success(c, 200, "Penilaian disimpan", nil)
}
func (h *ComplaintHandler) permitted(c *gin.Context, assignee bool) bool {
	v, _ := c.Get("principal")
	actor, _ := v.(*model.User)
	if !h.usecase.CanHandle(c.Param("id"), actor, assignee) {
		response.Forbidden(c, "Bukan petugas yang menangani aduan")
		return false
	}
	return true
}
func (h *ComplaintHandler) UpdateStatus(c *gin.Context) {
	if !h.permitted(c, false) {
		return
	}
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)

	var req struct {
		Status model.ComplaintStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Status aduan tidak valid", err.Error())
		return
	}

	if err := h.usecase.UpdateComplaintStatus(id, req.Status, userID); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Status aduan berhasil diperbarui", nil)
}

// Verify handles POST /api/v1/aduan/:id/verify
func (h *ComplaintHandler) Verify(c *gin.Context) {
	if !h.permitted(c, false) {
		return
	}
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)

	if err := h.usecase.VerifyComplaint(id, userID); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Aduan berhasil diverifikasi", nil)
}

// Resolve handles POST /api/v1/aduan/:id/resolve
func (h *ComplaintHandler) Resolve(c *gin.Context) {
	if !h.permitted(c, true) {
		return
	}
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)

	var req struct {
		Solusi string `json:"solusi" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Uraian solusi penanganan aduan wajib disertakan", err.Error())
		return
	}

	if err := h.usecase.ResolveComplaint(id, userID, req.Solusi); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Aduan berhasil diselesaikan", nil)
}

// Close handles POST /api/v1/aduan/:id/close
func (h *ComplaintHandler) Close(c *gin.Context) {
	if !h.permitted(c, false) {
		return
	}
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)

	var req struct {
		Alasan string `json:"alasan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Alasan penutupan tiket aduan wajib disertakan", err.Error())
		return
	}

	if err := h.usecase.CloseComplaint(id, userID, req.Alasan); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Tiket aduan resmi ditutup", nil)
}

// GetEscalations handles GET /api/v1/aduan/escalations (v_complaint_metadata)
func (h *ComplaintHandler) GetEscalations(c *gin.Context) {
	escalations, err := h.usecase.GetEscalations()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil data eskalasi aduan: "+err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Data eskalasi aduan berhasil diambil", escalations)
}

// GetMyDispositions handles GET /api/v1/aduan/my-dispositions
func (h *ComplaintHandler) GetMyDispositions(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)
	dispositions, err := h.usecase.GetMyDispositions(userID)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil data disposisi aduan saya: "+err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Data disposisi aduan berhasil diambil", dispositions)
}

func (h *ComplaintHandler) AddInternalMessage(c *gin.Context) {
	if !h.permitted(c, true) {
		return
	}
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)
	activeRole := middleware.ActiveRole(c)

	var req struct {
		Internal *bool  `json:"is_catatan_internal"`
		Pesan    string `json:"pesan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Pesan tanggapan tidak boleh kosong", err.Error())
		return
	}

	if err := h.usecase.AddInternalMessage(id, userID, activeRole, req.Pesan, req.Internal == nil || *req.Internal); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Tanggapan berhasil dikirim", nil)
}

func (h *ComplaintHandler) AddDisposition(c *gin.Context) {
	if !h.permitted(c, false) {
		return
	}
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)

	var req struct {
		KepadaPetugasID string `json:"kepada_petugas_id" binding:"required"`
		Catatan         string `json:"catatan" binding:"required"`
		Deadline        string `json:"deadline"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data disposisi tidak valid", err.Error())
		return
	}

	var deadlineTime *time.Time
	if req.Deadline != "" {
		t, err := time.Parse("2006-01-02", req.Deadline)
		if err == nil {
			deadlineTime = &t
		}
	}

	if err := h.usecase.AddDisposition(id, userID, req.KepadaPetugasID, req.Catatan, deadlineTime); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Aduan berhasil didisposisikan", nil)
}

func (h *ComplaintHandler) ForwardToSatgas(c *gin.Context) {
	if !h.permitted(c, false) {
		return
	}
	id := c.Param("id")
	var req struct {
		Tanggal        string `json:"tanggal"`
		NomorReferensi string `json:"nomor_referensi" binding:"required"`
		PetugasSatgas  string `json:"petugas_satgas" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Nomor referensi dan petugas Satgas PPKPT wajib diisi", err.Error())
		return
	}
	if err := h.usecase.ForwardToSatgas(id, req.Tanggal, req.NomorReferensi, req.PetugasSatgas); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Aduan berhasil diteruskan ke Satgas PPKPT institusi", nil)
}

func (h *ComplaintHandler) GetRecap(c *gin.Context) {
	recap, err := h.usecase.GetRecap()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil rekap aduan: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi layanan aduan berhasil diambil", recap)
}
