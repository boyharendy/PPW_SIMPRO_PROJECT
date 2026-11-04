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
	c.Status = model.ComplaintStatusDiterima
	c.TanggalPengaduan = time.Now().Format("2006-01-02")

	payload := map[string]interface{}{
		"id":                c.ID,
		"kode_tiket":        c.KodeTiket,
		"kategori":          string(c.Kategori),
		"judul":             c.Judul,
		"isi_aduan":         c.IsiAduan,
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
		"catatan_disposisi": disp.CatatanDisposisi,
	}
	if disp.DeadlineTindakLanjut != nil {
		payload["deadline_tindak_lanjut"] = disp.DeadlineTindakLanjut.Format("2006-01-02")
	}
	return r.client.Insert("complaint_dispositions", payload, nil)
}

func (r *supabaseComplaintRepository) GetRecap() (*model.ComplaintRecap, error) {
	var list []*model.Complaint
	_ = r.client.Select("complaints", map[string]string{"select": "id,status,kategori,is_sensitif"}, &list)

	recap := &model.ComplaintRecap{
		TotalAduan:       len(list),
		StatusDistribusi: make(map[string]int),
		KategoriDist:     make(map[string]int),
	}

	for _, c := range list {
		if c.Status == model.ComplaintStatusSelesai {
			recap.TotalSelesai++
		}
		if c.IsSensitif {
			recap.TotalSensitif++
		}
		recap.StatusDistribusi[string(c.Status)]++
		recap.KategoriDist[string(c.Kategori)]++
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

func (r *memoryComplaintRepository) FindAll(kategori string, status string, isSensitif *bool, limit, offset int) ([]*model.Complaint, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []*model.Complaint
	for _, c := range r.complaints {
		if kategori != "" && string(c.Kategori) != kategori {
			continue
		}
		if status != "" && string(c.Status) != status {
			continue
		}
		if isSensitif != nil && c.IsSensitif != *isSensitif {
			continue
		}
		filtered = append(filtered, c)
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
	res := *c
	res.Messages = r.messages[id]
	res.Dispositions = r.dispositions[id]
	return &res, nil
}

func (r *memoryComplaintRepository) FindByTicket(ticket string) (*model.Complaint, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, c := range r.complaints {
		if c.KodeTiket == ticket {
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
	return nil
}

func (r *memoryComplaintRepository) GetRecap() (*model.ComplaintRecap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	recap := &model.ComplaintRecap{
		TotalAduan:       len(r.complaints),
		StatusDistribusi: make(map[string]int),
		KategoriDist:     make(map[string]int),
	}

	for _, c := range r.complaints {
		if c.Status == model.ComplaintStatusSelesai {
			recap.TotalSelesai++
		}
		if c.IsSensitif {
			recap.TotalSensitif++
		}
		recap.StatusDistribusi[string(c.Status)]++
		recap.KategoriDist[string(c.Kategori)]++
	}

	return recap, nil
}
