package model

import "time"

type RpsStatus string

const (
	RpsStatusDraft           RpsStatus = "DRAFT"
	RpsStatusDraf            RpsStatus = "DRAF"
	RpsStatusDiajukan        RpsStatus = "DIAJUKAN"
	RpsStatusDireview        RpsStatus = "DIREVIEW"
	RpsStatusSedangDireview  RpsStatus = "SEDANG_DIREVIEW"
	RpsStatusPerluRevisi     RpsStatus = "PERLU_REVISI"
	RpsStatusRevisi          RpsStatus = "REVISI"
	RpsStatusDisetujui       RpsStatus = "DISETUJUI"
	RpsStatusDisetujuiGKM    RpsStatus = "DISETUJUI_GKM"
	RpsStatusDisahkan        RpsStatus = "DISAHKAN"
	RpsStatusDisahkanKaprodi RpsStatus = "DISAHKAN_KAPRODI"
)

// 5 Komponen SPMI Review RPS (FR-41 & Bab 10.4)
const (
	RpsKomponenCplCpmk    = "KESELARASAN_CPL_CPMK"
	RpsKomponenBahanKajian = "BAHAN_KAJIAN"
	RpsKomponenMetode      = "METODE_PEMBELAJARAN"
	RpsKomponenPenilaian   = "BENTUK_BOBOT_PENILAIAN"
	RpsKomponenReferensi   = "REFERENSI"
)

type RpsReviewItem struct {
	ID          string `json:"id"`
	RpsReviewID string `json:"rps_review_id"`
	ReviewID    string `json:"review_id,omitempty"`
	Komponen    string `json:"komponen"` // KESELARASAN_CPL_CPMK | BAHAN_KAJIAN | METODE_PEMBELAJARAN | BENTUK_BOBOT_PENILAIAN | REFERENSI
	Hasil       string `json:"hasil"`    // SESUAI | PERLU_PERBAIKAN
	Catatan     string `json:"catatan,omitempty"`
}

type RpsReview struct {
	ID              string           `json:"id"`
	RpsSubmissionID string           `json:"rps_submission_id"`
	ReviewerID      string           `json:"reviewer_id"`
	ReviewerName    string           `json:"reviewer_name,omitempty"`
	Status          string           `json:"status,omitempty"` // DITUGASKAN | SELESAI_REVIEW
	Komentar        string           `json:"komentar"`
	Rekomendasi     string           `json:"rekomendasi"` // PERLU_REVISI | DISETUJUI | DISETUJUI_GKM
	Items           []*RpsReviewItem `json:"items,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
}

type RpsVersion struct {
	ID              string    `json:"id"`
	RpsSubmissionID string    `json:"rps_submission_id"`
	NomorVersi      int       `json:"nomor_versi"`
	DokumenURL      string    `json:"dokumen_url"`
	CatatanRevisi   string    `json:"catatan_revisi,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

type RpsSubmission struct {
	ID                string                   `json:"id"`
	CourseID          string                   `json:"course_id"`
	CourseName        string                   `json:"course_name,omitempty"`
	AcademicPeriodID  string                   `json:"academic_period_id"`
	TahunAkademik     string                   `json:"tahun_akademik,omitempty"`
	Status            RpsStatus                `json:"status"`
	DosenPenyusunID   string                   `json:"dosen_penyusun_id"`
	DosenPengampuNama string                   `json:"dosen_pengampu_nama,omitempty"`
	GkmReviewerID     string                   `json:"gkm_reviewer_id,omitempty"`
	ReviewerIDs       []string                 `json:"reviewer_ids,omitempty"`
	DisahkanOleh      string                   `json:"disahkan_oleh,omitempty"`
	DisahkanAt        *time.Time               `json:"disahkan_at,omitempty"`
	CatatanPengesahan string                   `json:"catatan_pengesahan,omitempty"`
	DokumenURL        string                   `json:"dokumen_url,omitempty"`
	NomorVersi        int                      `json:"nomor_versi"`
	Versions          []*RpsVersion            `json:"versions,omitempty"`
	Reviews           []*RpsReview             `json:"reviews,omitempty"`
	ImprovementPlans  []*CourseImprovementPlan `json:"improvement_plans,omitempty"`
	CreatedAt         time.Time                `json:"created_at"`
	UpdatedAt         time.Time                `json:"updated_at"`
}

type RpsRecap struct {
	TotalMataKuliah     int            `json:"total_mata_kuliah"`
	TotalPengajuan      int            `json:"total_pengajuan"`
	TotalDisetujui      int            `json:"total_disetujui"`
	BelumMengumpulkan   int            `json:"belum_mengumpulkan"`
	BelumSelesaiRevisi  int            `json:"belum_selesai_revisi"`
	PersentaseKepatuhan float64        `json:"persentase_kepatuhan"`
	StatusDistribusi    map[string]int `json:"status_distribusi"`
}
