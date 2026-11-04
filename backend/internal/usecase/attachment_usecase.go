package usecase

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type AttachmentUsecase interface {
	UploadFile(reader io.Reader, fileName string, fileSize int64, mimeType string, entityType model.AttachmentEntityType, entityID string, uploadedBy *string) (*model.Attachment, error)
	GetAttachmentByID(id string) (*model.Attachment, error)
	GetAttachmentURL(id string) (string, error)
	GetAttachmentsByEntity(entityType model.AttachmentEntityType, entityID string) ([]*model.Attachment, error)
}

type attachmentUsecase struct {
	repo repository.AttachmentRepository
}

func NewAttachmentUsecase(repo repository.AttachmentRepository) AttachmentUsecase {
	return &attachmentUsecase{repo: repo}
}

func (u *attachmentUsecase) UploadFile(reader io.Reader, fileName string, fileSize int64, mimeType string, entityType model.AttachmentEntityType, entityID string, uploadedBy *string) (*model.Attachment, error) {
	ext := strings.ToLower(filepath.Ext(fileName))
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".pdf":  true,
		".docx": true,
		".xlsx": true,
	}

	if !allowedExts[ext] {
		return nil, fmt.Errorf("ekstensi berkas '%s' tidak diizinkan. Hanya PDF, JPG, PNG, DOCX, XLSX", ext)
	}

	if fileSize > 10*1024*1024 {
		return nil, errors.New("ukuran berkas melebihi batas maksimal 10MB")
	}

	rawBytes, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("gagal membaca berkas: %w", err)
	}

	// Sanitasi EXIF metadata untuk gambar JPEG dan PNG
	sanitizedBytes := rawBytes
	if ext == ".jpg" || ext == ".jpeg" {
		img, err := jpeg.Decode(bytes.NewReader(rawBytes))
		if err == nil {
			var buf bytes.Buffer
			// Re-encode JPEG scrubs all EXIF/GPS/Device metadata
			if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85}); err == nil {
				sanitizedBytes = buf.Bytes()
			}
		}
	} else if ext == ".png" {
		img, err := png.Decode(bytes.NewReader(rawBytes))
		if err == nil {
			var buf bytes.Buffer
			// Re-encode PNG scrubs metadata chunks
			if err := png.Encode(&buf, img); err == nil {
				sanitizedBytes = buf.Bytes()
			}
		}
	}

	attID := uuid.New().String()
	sanitizedFileName := fmt.Sprintf("doc_%s%s", attID[:8], ext)
	fileURL := fmt.Sprintf("/storage/attachments/%s/%s", attID, sanitizedFileName)

	createdAt := time.Now()
	// Anonymous protection: jika entitas aduan, buang pengunggah dan bulatkan tanggal (Bab 10.4)
	if entityType == model.AttachmentEntityComplaint || entityType == model.AttachmentEntityComplaintMessage {
		uploadedBy = nil
		now := time.Now()
		createdAt = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	}

	att := &model.Attachment{
		ID:         attID,
		EntityType: entityType,
		EntityID:   entityID,
		FileName:   fileName,
		FileURL:    fileURL,
		FileSize:   int64(len(sanitizedBytes)),
		MimeType:   mimeType,
		UploadedBy: uploadedBy,
		CreatedAt:  createdAt,
	}

	return u.repo.Save(att)
}

func (u *attachmentUsecase) GetAttachmentByID(id string) (*model.Attachment, error) {
	return u.repo.FindByID(id)
}

func (u *attachmentUsecase) GetAttachmentURL(id string) (string, error) {
	att, err := u.repo.FindByID(id)
	if err != nil {
		return "", err
	}
	return att.FileURL, nil
}

func (u *attachmentUsecase) GetAttachmentsByEntity(entityType model.AttachmentEntityType, entityID string) ([]*model.Attachment, error) {
	return u.repo.FindByEntity(entityType, entityID)
}

