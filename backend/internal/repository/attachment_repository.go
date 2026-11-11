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

type AttachmentRepository interface {
	Save(att *model.Attachment) (*model.Attachment, error)
	FindByID(id string) (*model.Attachment, error)
	FindByEntity(entityType model.AttachmentEntityType, entityID string) ([]*model.Attachment, error)
}

// ============================================================
// Supabase Implementation
// ============================================================

type supabaseAttachmentRepository struct {
	client *database.SupabaseClient
}

func NewSupabaseAttachmentRepository(client *database.SupabaseClient) AttachmentRepository {
	return &supabaseAttachmentRepository{client: client}
}

func (r *supabaseAttachmentRepository) Save(att *model.Attachment) (*model.Attachment, error) {
	if att.ID == "" {
		att.ID = uuid.New().String()
	}
	if att.CreatedAt.IsZero() {
		att.CreatedAt = time.Now()
	}
	var created []*model.Attachment
	err := r.client.Insert("attachments", att, &created)
	if err != nil {
		return nil, fmt.Errorf("gagal insert attachment: %w", err)
	}
	if len(created) > 0 {
		return created[0], nil
	}
	return att, nil
}

func (r *supabaseAttachmentRepository) FindByID(id string) (*model.Attachment, error) {
	var list []*model.Attachment
	err := r.client.Select("attachments", map[string]string{
		"id":    fmt.Sprintf("eq.%s", id),
		"limit": "1",
	}, &list)
	if err != nil || len(list) == 0 {
		return nil, errors.New("lampiran berkas tidak ditemukan")
	}
	return list[0], nil
}

func (r *supabaseAttachmentRepository) FindByEntity(entityType model.AttachmentEntityType, entityID string) ([]*model.Attachment, error) {
	var list []*model.Attachment
	err := r.client.Select("attachments", map[string]string{
		"entity_type": fmt.Sprintf("eq.%s", entityType),
		"entity_id":   fmt.Sprintf("eq.%s", entityID),
		"order":       "created_at.asc",
	}, &list)
	if err != nil {
		return nil, fmt.Errorf("gagal query attachments: %w", err)
	}
	return list, nil
}

// ============================================================
// In-Memory Mock Implementation
// ============================================================

type memoryAttachmentRepository struct {
	mu          sync.RWMutex
	attachments map[string]*model.Attachment
}

func NewMemoryAttachmentRepository() AttachmentRepository {
	return &memoryAttachmentRepository{
		attachments: make(map[string]*model.Attachment),
	}
}

func (r *memoryAttachmentRepository) Save(att *model.Attachment) (*model.Attachment, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if att.ID == "" {
		att.ID = uuid.New().String()
	}
	if att.CreatedAt.IsZero() {
		att.CreatedAt = time.Now()
	}
	r.attachments[att.ID] = att
	return att, nil
}

func (r *memoryAttachmentRepository) FindByID(id string) (*model.Attachment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	att, ok := r.attachments[id]
	if !ok {
		return nil, errors.New("lampiran berkas tidak ditemukan")
	}
	return att, nil
}

func (r *memoryAttachmentRepository) FindByEntity(entityType model.AttachmentEntityType, entityID string) ([]*model.Attachment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*model.Attachment
	for _, a := range r.attachments {
		if a.EntityType == entityType && a.EntityID == entityID {
			result = append(result, a)
		}
	}
	return result, nil
}

