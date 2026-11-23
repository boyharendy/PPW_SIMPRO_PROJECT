package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/export"
	"simpro-backend/pkg/response"
)

type TripHandler struct {
	usecase usecase.TripUsecase
	files   usecase.AttachmentUsecase
}

func NewTripHandler(uc usecase.TripUsecase, files ...usecase.AttachmentUsecase) *TripHandler {
	h := &TripHandler{usecase: uc}
	if len(files) > 0 {
		h.files = files[0]
	}
	return h
}

func (h *TripHandler) GetTrips(c *gin.Context) {
	status := c.Query("status")
	userID := c.Query("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// NF-02: Dosen hanya dapat melihat perjalanannya sendiri; Kaprodi dan Admin Prodi dapat melihat seluruhnya.
	if r := middleware.NormalizeRole(middleware.ActiveRole(c)); r != model.RoleKaprodi && r != model.RoleAdminProdi {
		userID = c.GetString(middleware.CtxUserID)
	}

	trips, total, err := h.usecase.GetTrips(status, userID, page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar perjalanan dinas: "+err.Error())
		return
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

	response.SuccessWithMeta(c, http.StatusOK, "Daftar perjalanan dinas berhasil diambil", trips, meta)
}

func (h *TripHandler) GetTripByID(c *gin.Context) {
	if !h.permit(c, "view") {
		return
	}
	id := c.Param("id")
	trip, err := h.usecase.GetTripByID(id)
	if err != nil {
		response.NotFound(c, "Perjalanan dinas tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Detail perjalanan dinas berhasil diambil", trip)
}

func (h *TripHandler) CreateTrip(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)
	var req model.TravelOrder
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data perjalanan dinas tidak valid", err.Error())
		return
	}

	created, err := h.usecase.CreateTrip(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Pengajuan perjalanan dinas berhasil dibuat", created)
}

func (h *TripHandler) UpdateTrip(c *gin.Context) {
	if !h.permit(c, "edit") {
		return
	}
	id := c.Param("id")
	var req model.TravelOrder
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format data update perjalanan dinas tidak valid", err.Error())
		return
	}

	updated, err := h.usecase.UpdateTrip(id, &req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Pengajuan perjalanan dinas berhasil diperbarui", updated)
}

func (h *TripHandler) DeleteTrip(c *gin.Context) {
	if !h.permit(c, "edit") {
		return
	}
	id := c.Param("id")
	if err := h.usecase.DeleteTrip(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Pengajuan perjalanan dinas berhasil dihapus", nil)
}

func (h *TripHandler) SubmitTrip(c *gin.Context) {
	if !h.permit(c, "edit") {
		return
	}
	id := c.Param("id")
	if err := h.usecase.SubmitTrip(id); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Pengajuan perjalanan dinas berhasil diajukan ke Kaprodi", nil)
}

func (h *TripHandler) ApproveTrip(c *gin.Context) {
	if !h.permit(c, "approve") {
		return
	}
	id := c.Param("id")
	approverID := c.GetString(middleware.CtxUserID)

	var req struct {
		Approved   *bool              `json:"approved"`
		Status     model.TravelStatus `json:"status"`
		Catatan    string             `json:"catatan"`
		NomorSurat string             `json:"nomor_surat_tugas"`
	}
	if c.ShouldBindJSON(&req) != nil || req.Status == "" && req.Approved == nil {
		response.BadRequest(c, "Keputusan persetujuan diperlukan", nil)
		return
	}
	status := req.Status
	if status == model.TripStatusDisetujui {
		status = model.TripStatusDisetujuiKaprodi
	}
	if status == "" {
		status = model.TripStatusDitolak
		if *req.Approved {
			status = model.TripStatusDisetujuiKaprodi
		}
	} else if req.Approved != nil && *req.Approved != (status == model.TripStatusDisetujuiKaprodi) {
		response.BadRequest(c, "Keputusan persetujuan bertentangan", nil)
		return
	}
	decision := model.TripDecision{Status: status, Catatan: strings.TrimSpace(req.Catatan), SuratTugas: strings.TrimSpace(req.NomorSurat)}
	if err := h.usecase.DecideTrip(id, approverID, decision); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Keputusan perjalanan tersimpan", nil)
}

func (h *TripHandler) SubmitReport(c *gin.Context) {
	if !h.permit(c, "report") {
		return
	}
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)

	var req struct {
		RingkasanHasil string              `json:"ringkasan_hasil" binding:"required"`
		FileLaporanURL string              `json:"file_laporan_url"`
		TotalRealisasi float64             `json:"total_realisasi"`
		Costs          []*model.TravelCost `json:"costs"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format laporan tidak valid", err.Error())
		return
	}

	if req.Costs != nil {
		if err := h.usecase.UpdateRealizationCosts(id, req.Costs); err != nil {
			response.BadRequest(c, err.Error(), nil)
			return
		}
	}
	if err := h.usecase.SubmitReport(id, userID, req.RingkasanHasil, req.FileLaporanURL, req.TotalRealisasi); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Laporan perjalanan dinas berhasil dikirim", nil)
}

func (h *TripHandler) AddProof(c *gin.Context) {
	if !h.permit(c, "report") {
		return
	}
	id := c.Param("id")
	if h.files == nil {
		response.InternalServerError(c, "Penyimpanan bukti tidak tersedia")
		return
	}
	actor := c.GetString(middleware.CtxUserID)
	var req model.TravelProof
	if c.ContentType() == "multipart/form-data" {
		file, ok := prepareMultipart(c, h.files, false)
		if !ok {
			return
		}
		req.Kategori = c.PostForm("kategori")
		if !validProofCategory(req.Kategori) || req.Kategori == "FOTO_KEGIATAN" && !strings.HasPrefix(file.MIMEType(), "image/") {
			response.BadRequest(c, "Kategori bukti tidak valid", nil)
			return
		}
		att, err := h.files.Save(file, model.AttachmentEntityBusinessTrip, id, &actor)
		if err != nil {
			response.InternalServerError(c, "Bukti gagal disimpan")
			return
		}
		req.FileName, req.FileURL = att.FileName, att.ID
	} else {
		var ref struct {
			AttachmentID string `json:"attachment_id"`
			Kategori     string `json:"kategori"`
		}
		if c.ShouldBindJSON(&ref) != nil || !validProofCategory(ref.Kategori) {
			response.BadRequest(c, "Lampiran dan kategori diperlukan", nil)
			return
		}
		att, err := h.files.GetAttachmentByID(ref.AttachmentID)
		if err != nil || att.EntityType != model.AttachmentEntityBusinessTrip || att.EntityID != id || att.ObjectKey == "" {
			response.NotFound(c, "Lampiran tidak ditemukan")
			return
		}
		if ref.Kategori == "FOTO_KEGIATAN" && !strings.HasPrefix(att.MimeType, "image/") {
			response.BadRequest(c, "Foto kegiatan harus berupa gambar", nil)
			return
		}
		req.FileName, req.FileURL, req.Kategori = att.FileName, att.ID, ref.Kategori
	}
	req.UploadedBy = actor
	if err := h.usecase.AddProof(id, &req); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Bukti perjalanan dinas berhasil diunggah", nil)
}

func (h *TripHandler) GetRecap(c *gin.Context) {
	recap, err := h.usecase.GetRecap()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil rekapitulasi: "+err.Error())
		return
	}
	format := c.Query("format")
	if format == "xlsx" || format == "csv" || format == "pdf" {
		c.Header("Content-Disposition", "attachment; filename=rekap-perjalanan-dinas.csv")
		c.Data(http.StatusOK, "text/csv; charset=utf-8", export.ExportTripRecapCSV(recap))
		return
	}
	response.Success(c, http.StatusOK, "Rekapitulasi perjalanan dinas", recap)
}

// PRD Milestone 2 Endpoints:

// PUT /trips/:id/costs
func (h *TripHandler) UpdateCosts(c *gin.Context) {
	if !h.permit(c, "edit") {
		return
	}
	id := c.Param("id")
	var req struct {
		Costs []*model.TravelCost `json:"costs" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format rincian biaya tidak valid", err.Error())
		return
	}
	if err := h.usecase.UpdateCosts(id, req.Costs); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Rincian estimasi biaya perjalanan berhasil diperbarui", nil)
}

// PUT /trips/:id/costs/realization
func (h *TripHandler) UpdateRealizationCosts(c *gin.Context) {
	if !h.permit(c, "report") {
		return
	}
	id := c.Param("id")
	var req struct {
		Costs []*model.TravelCost `json:"costs" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format realisasi biaya tidak valid", err.Error())
		return
	}
	if err := h.usecase.UpdateRealizationCosts(id, req.Costs); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Rincian realisasi biaya perjalanan berhasil dicatatkan", nil)
}

// POST /trips/:id/confirm (Separation of duties: Admin Prodi confirmation & auto-realization to RKA)
func (h *TripHandler) ConfirmTrip(c *gin.Context) {
	if !h.permit(c, "confirm") {
		return
	}
	id := c.Param("id")
	actorID := c.GetString(middleware.CtxUserID)

	var req struct {
		Lengkap *bool  `json:"lengkap"`
		Catatan string `json:"catatan"`
	}
	if c.Request.ContentLength != 0 && c.ShouldBindJSON(&req) != nil {
		response.BadRequest(c, "Data konfirmasi tidak valid", nil)
		return
	}
	if req.Lengkap != nil && !*req.Lengkap {
		if err := h.usecase.MarkIncomplete(id, req.Catatan); err != nil {
			response.BadRequest(c, "Catatan kelengkapan wajib diisi", nil)
			return
		}
		response.Success(c, 200, "Catatan kelengkapan tersimpan", nil)
		return
	}
	trip, err := h.usecase.ConfirmTrip(id, actorID)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Perjalanan dinas berhasil dikonfirmasi selesai dan realisasi anggaran RKA telah tercatat", trip)
}

// GET /trips/:id/completeness
func (h *TripHandler) GetCompleteness(c *gin.Context) {
	if !h.permit(c, "view") {
		return
	}
	id := c.Param("id")
	check, err := h.usecase.GetCompleteness(id)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Checklist kelengkapan berkas perjalanan dinas", check)
}

// GET /trips/flags
func (h *TripHandler) GetFlags(c *gin.Context) {
	flags, err := h.usecase.GetFlags()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar flag SPPD: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Daftar penanda / anomali perjalanan dinas", flags)
}

func (h *TripHandler) permit(c *gin.Context, action string) bool {
	t, err := h.usecase.GetTripByID(c.Param("id"))
	if err != nil {
		response.NotFound(c, "Perjalanan tidak ditemukan")
		return false
	}
	id := c.GetString(middleware.CtxUserID)
	role := middleware.ActiveRole(c)
	ok := false
	switch action {
	case "view":
		ok = t.Participant(id) || role == model.RoleAdminProdi || role == model.RoleKaprodi
	case "edit":
		ok = t.DiajukanOleh == id && t.Draft()
	case "report":
		ok = t.Participant(id) && t.Approved()
	case "approve":
		ok = role == model.RoleKaprodi && t.Status == model.TripStatusDiajukan && !t.Participant(id)
	case "confirm":
		ok = (role == model.RoleKaprodi || role == model.RoleAdminProdi) && !t.Participant(id) && t.Status == model.TripStatusDilaporkan
	}
	if !ok {
		response.Forbidden(c, "Tidak berwenang untuk tindakan perjalanan ini")
	}
	return ok
}

func validProofCategory(category string) bool {
	switch category {
	case "FOTO_KEGIATAN", "TIKET", "BUKTI_PENGINAPAN", "KUITANSI", "LAPORAN", "SURAT_TUGAS":
		return true
	}
	return false
}

func (h *TripHandler) BudgetOptions(c *gin.Context) {
	rows, err := h.usecase.BudgetOptions()
	if err != nil {
		response.InternalServerError(c, "Pos anggaran tidak tersedia")
		return
	}
	response.Success(c, 200, "Pos RKA aktif", rows)
}
