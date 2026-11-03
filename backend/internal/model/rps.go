package model

import "time"

type RpsStatus string

const (
	RpsStatusDraft            RpsStatus = "DRAFT"
	RpsStatusDiajukan         RpsStatus = "DIAJUKAN"
	RpsStatusSedangDireview   RpsStatus = "SEDANG_DIREVIEW"
	RpsStatusRevisi           RpsStatus = "REVISI"
	RpsStatusDisetujuiGKM     RpsStatus = "DISETUJUI_GKM"
	RpsStatusDisahkanKaprodi  RpsStatus = "DISAHKAN_KAPRODI"
)

type RpsReview struct {
	ID              string    `json:"id"`
	RpsSubmissionID string    `json:"rps_submission_id"`
	ReviewerID      string    `json:"reviewer_id"`
	Komentar        string    `json:"komentar"`
	Rekomendasi     string    `json:"rekomendasi"` // REVISI, DISETUJUI_GKM
	CreatedAt       time.Time `json:"created_at"`
}

type RpsSubmission struct {
	ID               string       `json:"id"`
	CourseID         string       `json:"course_id"`
	AcademicPeriodID string       `json:"academic_period_id"`
	Status           RpsStatus    `json:"status"`
	DosenPenyusunID  string       `json:"dosen_penyusun_id"`
	GkmReviewerID    string       `json:"gkm_reviewer_id,omitempty"`
	DokumenURL       string       `json:"dokumen_url,omitempty"`
	NomorVersi       int          `json:"nomor_versi"`
	Reviews          []*RpsReview `json:"reviews,omitempty"`
	CreatedAt        time.Time    `json:"created_at"`
	UpdatedAt        time.Time    `json:"updated_at"`
}

type RpsRecap struct {
	TotalPengajuan      int            `json:"total_pengajuan"`
	TotalDisetujui      int            `json:"total_disetujui"`
	PersentaseKepatuhan float64        `json:"persentase_kepatuhan"`
	StatusDistribusi    map[string]int `json:"status_distribusi"`
}
