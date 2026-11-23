package usecase

import (
	"errors"

	"context"
	"crypto/rand"
	"encoding/hex"
	"github.com/google/uuid"
	"strings"
	"time"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/pkg/permit"
)

type ComplaintUsecase interface {
	CanHandle(id string, u *model.User, allowAssignee bool) bool
	GetComplaints(userRole model.Role, isViolenceHandler bool, kategori string, status string, page, limit int, sensitiveOnly ...bool) ([]*model.Complaint, int, error)
	GetComplaintByID(id string, userRole model.Role, isViolenceHandler bool) (*model.Complaint, error)
	GetPublicComplaint(ticket string) (*model.Complaint, error)
	CreatePublicComplaint(req *model.PublicComplaintRequest) (*model.Complaint, error)
	IssuePermit(ctx context.Context, userID string) (string, time.Time, error)
	AddPublicMessage(ticket, pesan, attachment string) (string, error)
	SubmitPublicRating(ticket string, rating int, komentar string) error
	UpdateComplaintStatus(id string, status model.ComplaintStatus, petugasID string) error
	VerifyComplaint(id string, petugasID string) error
	ResolveComplaint(id string, petugasID, solusi string) error
	CloseComplaint(id string, petugasID, alasan string) error
	GetEscalations() ([]*model.ComplaintMetadata, error)
	GetMyDispositions(userID string) ([]*model.Complaint, error)
	AddInternalMessage(id string, senderID string, senderRole model.Role, pesan string, internal bool) error
	AddDisposition(id string, dariPetugasID, kepadaPetugasID, catatan string, deadline *time.Time) error
	ForwardToSatgas(id, tanggal, nomorReferensi, petugasSatgas string) error
	GetRecap() (*model.ComplaintRecap, error)
}

type complaintUsecase struct {
	repo          repository.ComplaintRepository
	pepper        []byte
	permitManager *permit.PermitManager
}

func NewComplaintUsecase(repo repository.ComplaintRepository) ComplaintUsecase {
	var key [32]byte
	if _, err := rand.Read(key[:]); err != nil {
		panic(err)
	}
	return NewSecureComplaints(repo, permit.NewPermitManager(""), key[:])
}
func NewSecureComplaints(repo repository.ComplaintRepository, manager *permit.PermitManager, pepper []byte) ComplaintUsecase {
	return &complaintUsecase{repo: repo, permitManager: manager, pepper: pepper}
}

func (u *complaintUsecase) IssuePermit(ctx context.Context, userID string) (string, time.Time, error) {
	if userID == "" {
		return "", time.Time{}, errors.New("identitas mahasiswa wajib diverifikasi untuk penerbitan permit")
	}
	return u.permitManager.Issue(ctx, userID, 3)
}

func (u *complaintUsecase) GetComplaints(userRole model.Role, isViolenceHandler bool, kategori string, status string, page, limit int, sensitiveOnly ...bool) ([]*model.Complaint, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	var isSensitifFilter *bool
	if len(sensitiveOnly) > 0 && sensitiveOnly[0] {
		if userRole != model.RolePetugasKekerasan && userRole != model.RoleKaprodi && !isViolenceHandler {
			return []*model.Complaint{}, 0, nil
		}
		isSensitifFilter = &sensitiveOnly[0]
	}
	// Mahasiswa / Dosen / Staff without special complaint role should not see sensitive complaints
	if userRole != model.RolePetugasKekerasan && userRole != model.RoleKaprodi && !isViolenceHandler {
		f := false
		isSensitifFilter = &f
	}

	complaints, total, err := u.repo.FindAll(kategori, status, isSensitifFilter, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	// Mask sensitive details for roles that are not Petugas Kekerasan / PGL-K
	for i, c := range complaints {
		if c.IsSensitif && !isViolenceHandler && userRole != model.RolePetugasKekerasan {
			complaints[i] = metadataOnly(c)
		}
	}

	return complaints, total, nil
}

func (u *complaintUsecase) GetComplaintByID(id string, userRole model.Role, isViolenceHandler bool) (*model.Complaint, error) {
	c, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if c.IsSensitif && !isViolenceHandler && userRole != model.RolePetugasKekerasan {
		if userRole != model.RoleKaprodi {
			return nil, errors.New("aduan tidak ditemukan")
		}
		return metadataOnly(c), nil
	}

	return c, nil
}

func (u *complaintUsecase) GetPublicComplaint(ticket string) (*model.Complaint, error) {
	return u.repo.FindByTicket(permit.TicketHash(u.pepper, ticket))
}

func (u *complaintUsecase) CreatePublicComplaint(req *model.PublicComplaintRequest) (*model.Complaint, error) {
	if strings.TrimSpace(req.Judul) == "" || strings.TrimSpace(req.IsiAduan) == "" {
		return nil, errors.New("judul dan isi aduan wajib diisi")
	}

	key, exp, err := u.permitManager.Verify(req.PermitToken)
	if err != nil {
		return nil, err
	}
	var nonce [16]byte
	if _, err = rand.Read(nonce[:]); err != nil {
		return nil, err
	}
	ticket := "ADU-" + strings.ToUpper(hex.EncodeToString(nonce[:]))
	c := &model.Complaint{KodeTiketHash: permit.TicketHash(u.pepper, ticket), NomorAduan: "LAP-" + uuid.NewString(),
		Kategori:         req.Kategori,
		Judul:            req.Judul,
		IsiAduan:         req.IsiAduan,
		LampiranURL:      req.LampiranURL,
		KontakSukarela:   req.KontakSukarela,
		IsSensitif:       req.IsSensitif || req.Kategori == model.ComplaintCatPerundunganKekerasan,
		Status:           model.ComplaintStatusDiterima,
		TanggalPengaduan: time.Now().Format("2006-01-02"),
		TanggalDiterima:  time.Now().Format("2006-01-02"),
	}

	created, err := u.repo.CreatePermitted(c, key, exp)
	if err != nil {
		return nil, err
	}
	receipt := *created
	receipt.KodeTiket = ticket
	receipt.KodeTiketHash = ""
	return &receipt, nil
}

func (u *complaintUsecase) AddPublicMessage(ticket, pesan, attachment string) (string, error) {
	c, err := u.repo.FindByTicket(permit.TicketHash(u.pepper, ticket))
	if err != nil {
		return "", err
	}

	if c.Status == model.ComplaintStatusDitutup {
		return "", errors.New("aduan sudah ditutup")
	}
	msg := &model.ComplaintMessage{
		ID: uuid.NewString(), ComplaintID: c.ID, LampiranURL: attachment,
		SenderType: "PELAPOR",
		Pesan:      pesan,
	}
	if err := u.repo.AddMessage(msg); err != nil {
		return "", err
	}

	// Balasan pelapor setelah SELESAI membuka kembali aduan (FR-48)
	if c.Status == model.ComplaintStatusSelesai {
		return msg.ID, u.repo.UpdateStatus(c.ID, model.ComplaintStatusDitindaklanjuti, "")
	}

	return msg.ID, nil
}

func (u *complaintUsecase) SubmitPublicRating(ticket string, rating int, komentar string) error {
	if rating < 1 || rating > 5 {
		return errors.New("rating kepuasan harus bernilai antara 1 hingga 5")
	}
	c, err := u.GetPublicComplaint(ticket)
	if err != nil {
		return err
	}
	if c.Status != model.ComplaintStatusSelesai && c.Status != model.ComplaintStatusDitutup {
		return errors.New("aduan belum selesai")
	}
	return u.repo.SubmitRating(permit.TicketHash(u.pepper, ticket), rating, komentar)
}

func (u *complaintUsecase) UpdateComplaintStatus(id string, status model.ComplaintStatus, petugasID string) error {
	return u.repo.UpdateStatus(id, status, petugasID)
}

func (u *complaintUsecase) VerifyComplaint(id string, petugasID string) error {
	return u.repo.Verify(id, petugasID)
}

func (u *complaintUsecase) ResolveComplaint(id string, petugasID, solusi string) error {
	if strings.TrimSpace(solusi) == "" {
		return errors.New("uraian solusi atau tindak lanjut penyelesaian aduan wajib diisi")
	}
	return u.repo.Resolve(id, petugasID, solusi)
}

func (u *complaintUsecase) CloseComplaint(id string, petugasID, alasan string) error {
	if strings.TrimSpace(alasan) == "" {
		return errors.New("alasan penutupan tiket aduan wajib diisi")
	}
	return u.repo.Close(id, petugasID, alasan)
}

func (u *complaintUsecase) GetEscalations() ([]*model.ComplaintMetadata, error) {
	return u.repo.GetEscalations()
}

func (u *complaintUsecase) GetMyDispositions(userID string) ([]*model.Complaint, error) {
	return u.repo.FindMyDispositions(userID)
}

func (u *complaintUsecase) AddInternalMessage(id string, senderID string, senderRole model.Role, pesan string, internal bool) error {
	msg := &model.ComplaintMessage{
		ComplaintID: id,
		SenderType:  "PETUGAS",
		SenderID:    senderID, IsCatatanInternal: internal,
		Pesan: pesan,
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

func (u *complaintUsecase) ForwardToSatgas(id, tanggal, nomorReferensi, petugasSatgas string) error {
	if tanggal == "" {
		tanggal = time.Now().Format("2006-01-02")
	}
	return u.repo.ForwardToSatgas(id, tanggal, nomorReferensi, petugasSatgas)
}

func (u *complaintUsecase) GetRecap() (*model.ComplaintRecap, error) {
	return u.repo.GetRecap()
}

func metadataOnly(c *model.Complaint) *model.Complaint {
	return &model.Complaint{ID: c.ID, NomorAduan: c.NomorAduan, Kategori: c.Kategori, IsSensitif: true, Status: c.Status, TanggalDiterima: c.TanggalDiterima, IsEscalatedKaprodi: c.IsEscalatedKaprodi}
}

func (u *complaintUsecase) CanHandle(id string, actor *model.User, allowAssignee bool) bool {
	c, err := u.repo.FindByID(id)
	if err != nil || actor == nil {
		return false
	}
	if allowAssignee && !c.IsSensitif && c.Assigned(actor.ID) {
		return true
	}
	switch actor.ActiveRole {
	case model.RolePetugasKekerasan:
		return true
	case model.RolePengelolaAduan:
		return !c.IsSensitif || actor.PenangananKekerasan
	case model.RoleKaprodi:
		return !c.IsSensitif
	}
	return false
}
