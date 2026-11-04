package usecase

import (
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type ComplaintUsecase interface {
	GetComplaints(userRole model.Role, kategori string, status string, page, limit int) ([]*model.Complaint, int, error)
	GetComplaintByID(id string, userRole model.Role) (*model.Complaint, error)
	GetPublicComplaint(ticket string) (*model.Complaint, error)
	CreatePublicComplaint(req *model.PublicComplaintRequest) (*model.Complaint, error)
	AddPublicMessage(ticket string, pesan string) error
	UpdateComplaintStatus(id string, status model.ComplaintStatus, petugasID string) error
	AddInternalMessage(id string, senderID string, senderRole model.Role, pesan string) error
	AddDisposition(id string, dariPetugasID, kepadaPetugasID, catatan string, deadline *time.Time) error
	GetRecap() (*model.ComplaintRecap, error)
}

type complaintUsecase struct {
	repo repository.ComplaintRepository
}

func NewComplaintUsecase(repo repository.ComplaintRepository) ComplaintUsecase {
	return &complaintUsecase{repo: repo}
}

func (u *complaintUsecase) GetComplaints(userRole model.Role, kategori string, status string, page, limit int) ([]*model.Complaint, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	var isSensitifFilter *bool
	// Mahasiswa / Dosen / Staff without special complaint role should not see sensitive complaints
	if userRole != model.RolePetugasKekerasan && userRole != model.RolePengelolaAduan && userRole != model.RoleKaprodi {
		f := false
		isSensitifFilter = &f
	}

	complaints, total, err := u.repo.FindAll(kategori, status, isSensitifFilter, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	// Mask sensitive details for roles that are not Petugas Kekerasan / Pengelola Aduan
	for _, c := range complaints {
		if c.IsSensitif && userRole != model.RolePetugasKekerasan && userRole != model.RolePengelolaAduan {
			c.IsiAduan = "[KONTEN DIRAHASIAKAN / KHUSUS SATGAS & PETUGAS KEKERASAN]"
		}
	}

	return complaints, total, nil
}

func (u *complaintUsecase) GetComplaintByID(id string, userRole model.Role) (*model.Complaint, error) {
	c, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if c.IsSensitif && userRole != model.RolePetugasKekerasan && userRole != model.RolePengelolaAduan {
		c.IsiAduan = "[KONTEN DIRAHASIAKAN / KHUSUS SATGAS & PETUGAS KEKERASAN]"
		c.Messages = []*model.ComplaintMessage{}
	}

	return c, nil
}

func (u *complaintUsecase) GetPublicComplaint(ticket string) (*model.Complaint, error) {
	return u.repo.FindByTicket(ticket)
}

func (u *complaintUsecase) CreatePublicComplaint(req *model.PublicComplaintRequest) (*model.Complaint, error) {
	if strings.TrimSpace(req.Judul) == "" || strings.TrimSpace(req.IsiAduan) == "" {
		return nil, errors.New("judul dan isi aduan wajib diisi")
	}

	year := time.Now().Year()
	randNum := rand.Intn(9000) + 1000
	kodeTiket := fmt.Sprintf("ADU-%d-%04d", year, randNum)

	c := &model.Complaint{
		KodeTiket:  kodeTiket,
		Kategori:   req.Kategori,
		Judul:      req.Judul,
		IsiAduan:   req.IsiAduan,
		IsSensitif: req.IsSensitif || req.Kategori == model.ComplaintCatPerundunganKekerasan,
	}

	return u.repo.Create(c)
}

func (u *complaintUsecase) AddPublicMessage(ticket string, pesan string) error {
	c, err := u.repo.FindByTicket(ticket)
	if err != nil {
		return err
	}

	msg := &model.ComplaintMessage{
		ComplaintID: c.ID,
		SenderType:  "PELAPOR",
		Pesan:       pesan,
	}
	return u.repo.AddMessage(msg)
}

func (u *complaintUsecase) UpdateComplaintStatus(id string, status model.ComplaintStatus, petugasID string) error {
	return u.repo.UpdateStatus(id, status, petugasID)
}

func (u *complaintUsecase) AddInternalMessage(id string, senderID string, senderRole model.Role, pesan string) error {
	msg := &model.ComplaintMessage{
		ComplaintID: id,
		SenderType:  "PETUGAS",
		SenderID:    senderID,
		Pesan:       pesan,
	}
	return u.repo.AddMessage(msg)
}

func (u *complaintUsecase) AddDisposition(id string, dariPetugasID, kepadaPetugasID, catatan string, deadline *time.Time) error {
	disp := &model.ComplaintDisposition{
		ComplaintID:          id,
		DariPetugasID:        dariPetugasID,
		KepadaPetugasID:      kepadaPetugasID,
		CatatanDisposisi:     catatan,
		DeadlineTindakLanjut: deadline,
	}
	if err := u.repo.AddDisposition(disp); err != nil {
		return err
	}
	return u.repo.UpdateStatus(id, model.ComplaintStatusDidisposisikan, "")
}

func (u *complaintUsecase) GetRecap() (*model.ComplaintRecap, error) {
	return u.repo.GetRecap()
}
