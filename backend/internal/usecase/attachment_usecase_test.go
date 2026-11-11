package usecase_test

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestAttachmentUsecase(t *testing.T) {
	repo := repository.NewMemoryAttachmentRepository()
	uc := usecase.NewAttachmentUsecase(repo)

	// Create dummy test image (10x10 red pixel)
	img := image.NewRGBA(image.Rect(0, 0, 10, 10))
	for x := 0; x < 10; x++ {
		for y := 0; y < 10; y++ {
			img.Set(x, y, color.RGBA{R: 255, G: 0, B: 0, A: 255})
		}
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, nil); err != nil {
		t.Fatalf("failed to encode dummy jpeg: %v", err)
	}

	// 1. Upload for Complaint (Anonymous)
	userID := "user-original"
	att, err := uc.UploadFile(
		bytes.NewReader(buf.Bytes()),
		"evidence_photo.jpg",
		int64(buf.Len()),
		"image/jpeg",
		model.AttachmentEntityComplaint,
		"complaint-123",
		&userID,
	)
	if err != nil {
		t.Fatalf("UploadFile failed: %v", err)
	}

	// Verify that uploaded_by is stripped (nil) for anonymous complaint
	if att.UploadedBy != nil {
		t.Errorf("expected uploaded_by to be stripped (nil) for complaint, got %v", *att.UploadedBy)
	}

	// 2. Query URL
	url, err := uc.GetAttachmentURL(att.ID)
	if err != nil || url == "" {
		t.Fatalf("GetAttachmentURL failed: %v", err)
	}

	// 3. Reject unsupported extension
	_, err = uc.UploadFile(
		bytes.NewReader([]byte("malicious script")),
		"exploit.exe",
		16,
		"application/x-msdownload",
		model.AttachmentEntityComplaint,
		"complaint-123",
		nil,
	)
	if err == nil {
		t.Errorf("expected error for unsupported .exe extension")
	}
}

