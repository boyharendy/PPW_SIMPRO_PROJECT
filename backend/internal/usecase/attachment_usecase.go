package usecase

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"github.com/google/uuid"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"net/http"
	"path/filepath"
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/storage"
	"strconv"
	"strings"
	"time"
)

type AttachmentUsecase interface {
	Limit() (int64, error)
	Prepare(io.Reader, string, int64) (*PreparedFile, error)
	Save(*PreparedFile, model.AttachmentEntityType, string, *string) (*model.Attachment, error)
	UploadFile(io.Reader, string, int64, string, model.AttachmentEntityType, string, *string) (*model.Attachment, error)
	GetAttachmentByID(string) (*model.Attachment, error)
	GetAttachmentURL(string) (string, error)
	GetAttachmentsByEntity(model.AttachmentEntityType, string) ([]*model.Attachment, error)
}
type PreparedFile struct {
	id, name, ext, mime string
	data                []byte
}

// Store writes validated bytes under a newly generated object key.
func (f *PreparedFile) Store(ctx context.Context, objects storage.Objects) (string, string, int64, error) {
	key := f.id + f.ext
	err := objects.Put(ctx, key, f.mime, f.data)
	return key, f.mime, int64(len(f.data)), err
}
func (f *PreparedFile) ID() string       { return f.id }
func (f *PreparedFile) MIMEType() string { return f.mime }

var ErrTooLarge = errors.New("ukuran berkas melebihi batas admin")
var ErrMedia = errors.New("isi atau tipe berkas tidak sesuai")

type attachmentUsecase struct {
	ctx      context.Context
	repo     repository.AttachmentRepository
	settings repository.AdminRepository
	objects  storage.Objects
	rollback func(func())
}

func NewAttachmentUsecase(r repository.AttachmentRepository) AttachmentUsecase {
	return NewPrivateAttachments(context.Background(), r, nil, storage.NewMemory("/api/v1"), nil)
}
func NewPrivateAttachments(ctx context.Context, r repository.AttachmentRepository, a repository.AdminRepository, o storage.Objects, rollback func(func())) AttachmentUsecase {
	return &attachmentUsecase{ctx, r, a, o, rollback}
}
func (u *attachmentUsecase) Limit() (int64, error) {
	if u.settings == nil {
		return 10 << 20, nil
	}
	s, err := u.settings.GetSettingByKey("max_upload_mb")
	if err != nil {
		return 0, err
	}
	mb, err := strconv.ParseInt(s.Value, 10, 32)
	if err != nil || mb < 1 || mb > 256 {
		return 0, errors.New("batas unggahan tidak valid")
	}
	return mb << 20, nil
}
func (u *attachmentUsecase) Prepare(reader io.Reader, name string, size int64) (*PreparedFile, error) {
	limit, err := u.Limit()
	if err != nil {
		return nil, err
	}
	if size > limit {
		return nil, ErrTooLarge
	}
	raw, err := io.ReadAll(io.LimitReader(reader, limit+1))
	if err != nil {
		return nil, err
	}
	if int64(len(raw)) > limit {
		return nil, ErrTooLarge
	}
	ext := strings.ToLower(filepath.Ext(name))
	mime := http.DetectContentType(raw)
	switch ext {
	case ".png", ".jpg", ".jpeg":
		cfg, kind, err := image.DecodeConfig(bytes.NewReader(raw))
		if err != nil || cfg.Width < 1 || cfg.Height < 1 || int64(cfg.Width)*int64(cfg.Height) > 20_000_000 {
			return nil, ErrMedia
		}
		if (ext == ".png" && kind != "png") || (ext != ".png" && kind != "jpeg") {
			return nil, ErrMedia
		}
		img, _, err := image.Decode(bytes.NewReader(raw))
		if err != nil {
			return nil, ErrMedia
		}
		var out bytes.Buffer
		if kind == "png" {
			err = png.Encode(&out, img)
		} else {
			err = jpeg.Encode(&out, img, &jpeg.Options{Quality: 85})
		}
		if err != nil {
			return nil, ErrMedia
		}
		raw = out.Bytes()
		mime = "image/" + kind
	case ".pdf":
		if mime != "application/pdf" {
			return nil, ErrMedia
		}
	case ".docx", ".xlsx":
		z, err := zip.NewReader(bytes.NewReader(raw), int64(len(raw)))
		if err != nil {
			return nil, ErrMedia
		}
		part := "word/document.xml"
		mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		if ext == ".xlsx" {
			part = "xl/workbook.xml"
			mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		}
		found, manifest := false, false
		for _, f := range z.File {
			if f.Name == part {
				found = true
			}
			if f.Name == "[Content_Types].xml" {
				manifest = true
			}
		}
		if !found || !manifest {
			return nil, ErrMedia
		}
	default:
		return nil, ErrMedia
	}
	if int64(len(raw)) > limit {
		return nil, ErrTooLarge
	}
	return &PreparedFile{id: uuid.NewString(), name: filepath.Base(name), ext: ext, mime: mime, data: raw}, nil
}
func (u *attachmentUsecase) Save(f *PreparedFile, kind model.AttachmentEntityType, id string, user *string) (*model.Attachment, error) {
	now := time.Now().UTC()
	name := f.name
	if kind == model.AttachmentEntityComplaint || kind == model.AttachmentEntityComplaintMessage {
		user = nil
		name = "lampiran" + f.ext
		now = now.Truncate(24 * time.Hour)
	}
	key, mime, size, err := f.Store(u.ctx, u.objects)
	if err != nil {
		return nil, err
	}
	cleanup := func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = u.objects.Remove(ctx, key)
	}
	if u.rollback != nil {
		u.rollback(cleanup)
	}
	att, err := u.repo.Save(&model.Attachment{ID: f.id, EntityType: kind, EntityID: id, FileName: name, ObjectKey: key, FileSize: size, MimeType: mime, UploadedBy: user, CreatedAt: now})
	if err != nil && u.rollback == nil {
		cleanup()
	}
	return att, err
}
func (u *attachmentUsecase) UploadFile(r io.Reader, name string, size int64, _ string, kind model.AttachmentEntityType, id string, user *string) (*model.Attachment, error) {
	f, err := u.Prepare(r, name, size)
	if err != nil {
		return nil, err
	}
	return u.Save(f, kind, id, user)
}
func (u *attachmentUsecase) GetAttachmentByID(id string) (*model.Attachment, error) {
	return u.repo.FindByID(id)
}
func (u *attachmentUsecase) GetAttachmentURL(id string) (string, error) {
	a, err := u.repo.FindByID(id)
	if err != nil || a.ObjectKey == "" {
		return "", errors.New("berkas belum tersedia")
	}
	return u.objects.Sign(u.ctx, a.ObjectKey)
}
func (u *attachmentUsecase) GetAttachmentsByEntity(k model.AttachmentEntityType, id string) ([]*model.Attachment, error) {
	return u.repo.FindByEntity(k, id)
}
