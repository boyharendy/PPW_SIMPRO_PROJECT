package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/internal/model"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/response"
)

type ComplaintHandler struct {
	usecase usecase.ComplaintUsecase
}

func NewComplaintHandler(uc usecase.ComplaintUsecase) *ComplaintHandler {
	return &ComplaintHandler{usecase: uc}
}

func (h *ComplaintHandler) GetComplaints(c *gin.Context) {
	kategori := c.Query("kategori")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	activeRole := model.Role(c.GetString(middleware.CtxActiveRole))
	complaints, total, err := h.usecase.GetComplaints(activeRole, kategori, status, page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar aduan: "+err.Error())
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

	response.SuccessWithMeta(c, http.StatusOK, "Daftar aduan berhasil diambil", complaints, meta)
}

func (h *ComplaintHandler) GetComplaintByID(c *gin.Context) {
	id := c.Param("id")
	activeRole := model.Role(c.GetString(middleware.CtxActiveRole))

	complaint, err := h.usecase.GetComplaintByID(id, activeRole)
	if err != nil {
		response.NotFound(c, "Aduan tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Detail aduan berhasil diambil", complaint)
}

func (h *ComplaintHandler) CreatePublicComplaint(c *gin.Context) {
	var req model.PublicComplaintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data aduan tidak lengkap atau tidak valid", err.Error())
		return
	}

	created, err := h.usecase.CreatePublicComplaint(&req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, "Aduan berhasil dikirim. Simpan kode tiket untuk melacak status aduan Anda.", created)
}

func (h *ComplaintHandler) GetPublicComplaint(c *gin.Context) {
	ticket := c.Param("ticket")
	complaint, err := h.usecase.GetPublicComplaint(ticket)
	if err != nil {
		response.NotFound(c, "Aduan dengan kode tiket tersebut tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Status tiket aduan", complaint)
}

func (h *ComplaintHandler) AddPublicMessage(c *gin.Context) {
	ticket := c.Param("ticket")
	var req struct {
		Pesan string `json:"pesan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Pesan tidak boleh kosong", err.Error())
		return
	}

	if err := h.usecase.AddPublicMessage(ticket, req.Pesan); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Pesan berhasil ditambahkan ke tiket aduan", nil)
}

func (h *ComplaintHandler) SubmitPublicRating(c *gin.Context) {
	ticket := c.Param("ticket")
	var req struct {
		Rating   int    `json:"rating" binding:"required"`
		Komentar string `json:"komentar"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Rating kepuasan wajib diisi (1-5)", err.Error())
		return
	}
	if err := h.usecase.SubmitPublicRating(ticket, req.Rating, req.Komentar); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Terima kasih atas penilaian kepuasan penanganan aduan Anda", nil)
}

func (h *ComplaintHandler) UpdateStatus(c *gin.Context) {
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

func (h *ComplaintHandler) AddInternalMessage(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(middleware.CtxUserID)
	activeRole := model.Role(c.GetString(middleware.CtxActiveRole))

	var req struct {
		Pesan string `json:"pesan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Pesan tanggapan tidak boleh kosong", err.Error())
		return
	}

	if err := h.usecase.AddInternalMessage(id, userID, activeRole, req.Pesan); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Tanggapan berhasil dikirim", nil)
}

func (h *ComplaintHandler) AddDisposition(c *gin.Context) {
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
