package repository

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"simpro-backend/internal/database"
	"simpro-backend/internal/model"
)

type ComplaintRepository interface {
	FindAll(kategori string, status string, isSensitif *bool, limit, offset int) ([]*model.Complaint, int, error)
	FindByID(id string) (*model.Complaint, error)
	FindByTicket(ticket string) (*model.Complaint, error)
	Create(complaint *model.Complaint) (*model.Complaint, error)
	UpdateStatus(id string, status model.ComplaintStatus, petugasID string) error
	AddMessage(msg *model.ComplaintMessage) error
	AddDisposition(disp *model.ComplaintDisposition) error
	ForwardToSatgas(id, tanggal, nomorReferensi, petugasSatgas string) error
	SubmitRating(ticket string, rating int, komentar string) error
	GetRecap() (*model.ComplaintRecap, error)
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabaseComplaintRepository struct {
	client *database.SupabaseClient
}

func NewSupabaseComplaintRepository(client *database.SupabaseClient) ComplaintRepository {
	return &supabaseComplaintRepository{client: client}
}

func (r *supabaseComplaintRepository) FindAll(kategori string, status string, isSensitif *bool, limit, offset int) ([]*model.Complaint, int, error) {
	if limit <= 0 {
		limit = 20
	}
	params := map[string]string{
		"order":  "created_at.desc",
		"limit":  fmt.Sprintf("%d", limit),
		"offset": fmt.Sprintf("%d", offset),
	}
	countParams := map[string]string{}

	if kategori != "" {
		params["kategori"] = fmt.Sprintf("eq.%s", kategori)
		countParams["kategori"] = params["kategori"]
	}
	if status != "" {
		params["status"] = fmt.Sprintf("eq.%s", status)
		countParams["status"] = params["status"]
	}
	if isSensitif != nil {
		params["is_sensitif"] = fmt.Sprintf("eq.%t", *isSensitif)
		countParams["is_sensitif"] = params["is_sensitif"]
	}

	var complaints []*model.Complaint
	err := r.client.Select("complaints", params, &complaints)
	if err != nil {
		return nil, 0, fmt.Errorf("gagal query complaints: %w", err)
	}

	total, _ := r.client.Count("complaints", countParams)
	if total == 0 {
		total = len(complaints)
	}

	return complaints, total, nil
}

func (r *supabaseComplaintRepository) FindByID(id string) (*model.Complaint, error) {
	var list []*model.Complaint
	err := r.client.Select("complaints", map[string]string{
		"id":    fmt.Sprintf("eq.%s", id),
		"limit": "1",
	}, &list)
	if err != nil || len(list) == 0 {
		return nil, errors.New("aduan tidak ditemukan")
	}

	c := list[0]
	var msgs []*model.ComplaintMessage
	_ = r.client.Select("complaint_messages", map[string]string{
		"complaint_id": fmt.Sprintf("eq.%s", id),
		"order":        "created_at.asc",
	}, &msgs)
	c.Messages = msgs

	var disps []*model.ComplaintDisposition
	_ = r.client.Select("complaint_dispositions", map[string]string{
		"complaint_id": fmt.Sprintf("eq.%s", id),
		"order":        "created_at.desc",
	}, &disps)
	// Check automatic escalation if disposition deadline is overdue (FR-49)
	now := time.Now()
	for _, d := range disps {
		if d.DeadlineTindakLanjut != nil && d.DeadlineTindakLanjut.Before(now) &&
			c.Status != model.ComplaintStatusSelesai && c.Status != model.ComplaintStatusDitutup {
			c.IsEscalatedKaprodi = true
		}
	}
	c.Dispositions = disps

	return c, nil
}

func (r *supabaseComplaintRepository) FindByTicket(ticket string) (*model.Complaint, error) {
	var list []*model.Complaint
	err := r.client.Select("complaints", map[string]string{
		"kode_tiket": fmt.Sprintf("eq.%s", ticket),
		"limit":      "1",
	}, &list)
	if err != nil || len(list) == 0 {
		return nil, errors.New("aduan dengan kode tiket tersebut tidak ditemukan")
	}
	return r.FindByID(list[0].ID)
}

func (r *supabaseComplaintRepository) Create(c *model.Complaint) (*model.Complaint, error) {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	if c.KodeTiket == "" {
		c.KodeTiket = fmt.Sprintf("ADU-%s", uuid.New().String()[:8])
	}
	if c.NomorAduan == "" {
		c.NomorAduan = c.KodeTiket
	}
	c.Status = model.ComplaintStatusDiterima
	c.TanggalPengaduan = time.Now().Format("2006-01-02")

	// NF-04: Do not store reporter user_id or IP address
	payload := map[string]interface{}{
		"id":                c.ID,
		"kode_tiket":        c.KodeTiket,
		"nomor_aduan":       c.NomorAduan,
		"kategori":          string(c.Kategori),
		"judul":             c.Judul,
		"isi_aduan":         c.IsiAduan,
		"lampiran_url":      c.LampiranURL,
		"kontak_sukarela":   c.KontakSukarela,
		"status":            string(c.Status),
		"is_sensitif":       c.IsSensitif,
		"tanggal_pengaduan": c.TanggalPengaduan,
	}

	var inserted []*model.Complaint
	if err := r.client.Insert("complaints", payload, &inserted); err != nil {
		return nil, fmt.Errorf("gagal membuat aduan: %w", err)
	}

	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()
	return c, nil
}

func (r *supabaseComplaintRepository) UpdateStatus(id string, status model.ComplaintStatus, petugasID string) error {
	payload := map[string]interface{}{
		"status": string(status),
	}
	if petugasID != "" {
		payload["petugas_id"] = petugasID
	}
	if status == model.ComplaintStatusSelesai || status == model.ComplaintStatusDitutup {
		payload["tanggal_penyelesaian"] = time.Now().Format("2006-01-02")
	}
	return r.client.Update("complaints", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabaseComplaintRepository) AddMessage(msg *model.ComplaintMessage) error {
	if msg.ID == "" {
		msg.ID = uuid.New().String()
	}
	payload := map[string]interface{}{
		"id":           msg.ID,
		"complaint_id": msg.ComplaintID,
		"sender_type":  msg.SenderType,
		"pesan":        msg.Pesan,
		"lampiran_url": msg.LampiranURL,
	}
	if msg.SenderID != "" {
		payload["sender_id"] = msg.SenderID
	}
	return r.client.Insert("complaint_messages", payload, nil)
}

func (r *supabaseComplaintRepository) AddDisposition(disp *model.ComplaintDisposition) error {
	if disp.ID == "" {
		disp.ID = uuid.New().String()
	}
	payload := map[string]interface{}{
		"id":                disp.ID,
		"complaint_id":      disp.ComplaintID,
		"dari_petugas_id":   disp.DariPetugasID,
		"kepada_petugas_id": disp.KepadaPetugasID,
		"unit_tujuan":       disp.UnitTujuan,
		"catatan_disposisi": disp.CatatanDisposisi,
	}
	if disp.DeadlineTindakLanjut != nil {
		payload["deadline_tindak_lanjut"] = disp.DeadlineTindakLanjut.Format("2006-01-02")
	}
	return r.client.Insert("complaint_dispositions", payload, nil)
}

func (r *supabaseComplaintRepository) ForwardToSatgas(id, tanggal, nomorReferensi, petugasSatgas string) error {
	payload := map[string]interface{}{
		"diteruskan_ke_satgas_tanggal": tanggal,
		"nomor_referensi_satgas":       nomorReferensi,
		"petugas_satgas":               petugasSatgas,
		"status":                       string(model.ComplaintStatusDitindaklanjuti),
	}
	return r.client.Update("complaints", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, payload, nil)
}

func (r *supabaseComplaintRepository) SubmitRating(ticket string, rating int, komentar string) error {
	payload := map[string]interface{}{
		"rating_kepuasan":   rating,
		"komentar_kepuasan": komentar,
	}
	return r.client.Update("complaints", map[string]string{
		"kode_tiket": fmt.Sprintf("eq.%s", ticket),
	}, payload, nil)
}

func (r *supabaseComplaintRepository) GetRecap() (*model.ComplaintRecap, error) {
	var list []*model.Complaint
	_ = r.client.Select("complaints", map[string]string{}, &list)

	recap := &model.ComplaintRecap{
		TotalAduan:       len(list),
		StatusDistribusi: make(map[string]int),
		KategoriDist:     make(map[string]int),
	}

	var totalHari float64
	var resolvedCount int
	var sumRating, ratingCount int

	for _, c := range list {
		if c.Status == model.ComplaintStatusSelesai || c.Status == model.ComplaintStatusDitutup {
			recap.TotalSelesai++
			if c.TanggalPengaduan != "" && c.TanggalPenyelesaian != nil && *c.TanggalPenyelesaian != "" {
				t1, err1 := time.Parse("2006-01-02", c.TanggalPengaduan)
				t2, err2 := time.Parse("2006-01-02", *c.TanggalPenyelesaian)
				if err1 == nil && err2 == nil && !t2.Before(t1) {
					totalHari += t2.Sub(t1).Hours() / 24.0
					resolvedCount++
				}
			}
		}
		if c.IsSensitif {
			recap.TotalSensitif++
		}
		if c.IsEscalatedKaprodi {
			recap.TotalTereskalasiKaprodi++
		}
		if c.NomorReferensiSatgas != "" {
			recap.TotalDiteruskanSatgas++
		}
		if c.RatingKepuasan != nil && *c.RatingKepuasan > 0 {
			sumRating += *c.RatingKepuasan
			ratingCount++
		}
		recap.StatusDistribusi[string(c.Status)]++
		recap.KategoriDist[string(c.Kategori)]++
	}

	if resolvedCount > 0 {
		recap.RataRataWaktuPenyelesaianHari = totalHari / float64(resolvedCount)
	}
	if ratingCount > 0 {
		recap.RataRataKepuasanPelapor = float64(sumRating) / float64(ratingCount)
	}

	return recap, nil
}

// ============================================================
// In-Memory Implementation
// ============================================================

type memoryComplaintRepository struct {
	mu           sync.RWMutex
	complaints   map[string]*model.Complaint
	messages     map[string][]*model.ComplaintMessage
	dispositions map[string][]*model.ComplaintDisposition
}

func NewMemoryComplaintRepository() ComplaintRepository {
	return &memoryComplaintRepository{
		complaints:   make(map[string]*model.Complaint),
		messages:     make(map[string][]*model.ComplaintMessage),
		dispositions: make(map[string][]*model.ComplaintDisposition),
	}
}

func (r *memoryComplaintRepository) checkEscalation(c *model.Complaint) {
	if c.Status == model.ComplaintStatusSelesai || c.Status == model.ComplaintStatusDitutup {
		return
	}
	now := time.Now()
	for _, d := range r.dispositions[c.ID] {
		if d.DeadlineTindakLanjut != nil && d.DeadlineTindakLanjut.Before(now) {
			c.IsEscalatedKaprodi = true
			c.EscalatedAt = &now
		}
	}
}

func (r *memoryComplaintRepository) FindAll(kategori string, status string, isSensitif *bool, limit, offset int) ([]*model.Complaint, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []*model.Complaint
	for _, c := range r.complaints {
		r.checkEscalation(c)
		if kategori != "" && string(c.Kategori) != kategori {
			continue
		}
		if status != "" && string(c.Status) != status {
			continue
		}
		if isSensitif != nil && c.IsSensitif != *isSensitif {
			continue
		}
		copyC := *c
		filtered = append(filtered, &copyC)
	}

	total := len(filtered)
	if offset >= total {
		return []*model.Complaint{}, total, nil
	}
	end := offset + limit
	if end > total || limit <= 0 {
		end = total
	}

	return filtered[offset:end], total, nil
}

func (r *memoryComplaintRepository) FindByID(id string) (*model.Complaint, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	c, ok := r.complaints[id]
	if !ok {
		return nil, errors.New("aduan tidak ditemukan")
	}
	r.checkEscalation(c)
	res := *c
	res.Messages = r.messages[id]
	res.Dispositions = r.dispositions[id]
	return &res, nil
}

func (r *memoryComplaintRepository) FindByTicket(ticket string) (*model.Complaint, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, c := range r.complaints {
		if c.KodeTiket == ticket || c.NomorAduan == ticket {
			r.checkEscalation(c)
			res := *c
			res.Messages = r.messages[c.ID]
			res.Dispositions = r.dispositions[c.ID]
			return &res, nil
		}
	}
	return nil, errors.New("aduan tidak ditemukan")
}

func (r *memoryComplaintRepository) Create(c *model.Complaint) (*model.Complaint, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	if c.KodeTiket == "" {
		c.KodeTiket = fmt.Sprintf("ADU-%s", uuid.New().String()[:8])
	}
	if c.NomorAduan == "" {
		c.NomorAduan = c.KodeTiket
	}
	c.Status = model.ComplaintStatusDiterima
	c.TanggalPengaduan = time.Now().Format("2006-01-02")
	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()
	r.complaints[c.ID] = c
	return c, nil
}

func (r *memoryComplaintRepository) UpdateStatus(id string, status model.ComplaintStatus, petugasID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	c, ok := r.complaints[id]
	if !ok {
		return errors.New("aduan tidak ditemukan")
	}
	c.Status = status
	if petugasID != "" {
		c.PetugasID = petugasID
	}
	if status == model.ComplaintStatusSelesai || status == model.ComplaintStatusDitutup {
		nowStr := time.Now().Format("2006-01-02")
		c.TanggalPenyelesaian = &nowStr
	}
	c.UpdatedAt = time.Now()
	return nil
}

func (r *memoryComplaintRepository) AddMessage(msg *model.ComplaintMessage) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if msg.ID == "" {
		msg.ID = uuid.New().String()
	}
	msg.CreatedAt = time.Now()
	r.messages[msg.ComplaintID] = append(r.messages[msg.ComplaintID], msg)
	return nil
}

func (r *memoryComplaintRepository) AddDisposition(disp *model.ComplaintDisposition) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if disp.ID == "" {
		disp.ID = uuid.New().String()
	}
	disp.CreatedAt = time.Now()
	r.dispositions[disp.ComplaintID] = append(r.dispositions[disp.ComplaintID], disp)
	if c, ok := r.complaints[disp.ComplaintID]; ok {
		r.checkEscalation(c)
	}
	return nil
}

func (r *memoryComplaintRepository) ForwardToSatgas(id, tanggal, nomorReferensi, petugasSatgas string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	c, ok := r.complaints[id]
	if !ok {
		return errors.New("aduan tidak ditemukan")
	}
	c.DiteruskanKeSatgasTanggal = &tanggal
	c.NomorReferensiSatgas = nomorReferensi
	c.PetugasSatgas = petugasSatgas
	c.Status = model.ComplaintStatusDitindaklanjuti
	c.UpdatedAt = time.Now()
	return nil
}

func (r *memoryComplaintRepository) SubmitRating(ticket string, rating int, komentar string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, c := range r.complaints {
		if c.KodeTiket == ticket || c.NomorAduan == ticket {
			c.RatingKepuasan = &rating
			c.KomentarKepuasan = komentar
			c.UpdatedAt = time.Now()
			return nil
		}
	}
	return errors.New("aduan tidak ditemukan")
}

func (r *memoryComplaintRepository) GetRecap() (*model.ComplaintRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	recap := &model.ComplaintRecap{
		TotalAduan:       len(r.complaints),
		StatusDistribusi: make(map[string]int),
		KategoriDist:     make(map[string]int),
	}

	var totalHari float64
	var resolvedCount int
	var sumRating, ratingCount int

	for _, c := range r.complaints {
		r.checkEscalation(c)
		if c.Status == model.ComplaintStatusSelesai || c.Status == model.ComplaintStatusDitutup {
			recap.TotalSelesai++
			if c.TanggalPengaduan != "" && c.TanggalPenyelesaian != nil && *c.TanggalPenyelesaian != "" {
				t1, err1 := time.Parse("2006-01-02", c.TanggalPengaduan)
				t2, err2 := time.Parse("2006-01-02", *c.TanggalPenyelesaian)
				if err1 == nil && err2 == nil && !t2.Before(t1) {
					totalHari += t2.Sub(t1).Hours() / 24.0
					resolvedCount++
				}
			}
		}
		if c.IsSensitif {
			recap.TotalSensitif++
		}
		if c.IsEscalatedKaprodi {
			recap.TotalTereskalasiKaprodi++
		}
		if c.NomorReferensiSatgas != "" {
			recap.TotalDiteruskanSatgas++
		}
		if c.RatingKepuasan != nil && *c.RatingKepuasan > 0 {
			sumRating += *c.RatingKepuasan
			ratingCount++
		}
		recap.StatusDistribusi[string(c.Status)]++
		recap.KategoriDist[string(c.Kategori)]++
	}

	if resolvedCount > 0 {
		recap.RataRataWaktuPenyelesaianHari = totalHari / float64(resolvedCount)
	}
	if ratingCount > 0 {
		recap.RataRataKepuasanPelapor = float64(sumRating) / float64(ratingCount)
	}

	return recap, nil
}
