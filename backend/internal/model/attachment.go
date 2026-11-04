package model

import "time"

type AttachmentEntityType string

const (
	AttachmentEntityComplaint        AttachmentEntityType = "COMPLAINT"
	AttachmentEntityComplaintMessage AttachmentEntityType = "COMPLAINT_MESSAGE"
	AttachmentEntityBusinessTrip     AttachmentEntityType = "BUSINESS_TRIP"
	AttachmentEntityPublication      AttachmentEntityType = "PUBLICATION"
	AttachmentEntityRps              AttachmentEntityType = "RPS"
	AttachmentEntityCourseEval       AttachmentEntityType = "COURSE_EVALUATION"
)

type Attachment struct {
	ID         string               `json:"id"`
	EntityType AttachmentEntityType `json:"entity_type"`
	EntityID   string               `json:"entity_id,omitempty"`
	FileName   string               `json:"file_name"`
	FileURL    string               `json:"file_url"`
	FileSize   int64                `json:"file_size"`
	MimeType   string               `json:"mime_type"`
	UploadedBy *string              `json:"uploaded_by,omitempty"`
	CreatedAt  time.Time            `json:"created_at"`
}

type AttachmentUploadResponse struct {
	ID        string    `json:"id"`
	FileName  string    `json:"file_name"`
	FileURL   string    `json:"file_url"`
	FileSize  int64     `json:"file_size"`
	MimeType  string    `json:"mime_type"`
	CreatedAt time.Time `json:"created_at"`
}

