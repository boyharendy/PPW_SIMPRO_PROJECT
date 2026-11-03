package model

import "time"

type CpmkEvaluation struct {
	ID                    string  `json:"id"`
	EvaluationID          string  `json:"evaluation_id"`
	KodeCPMK              string  `json:"kode_cpmk"`
	Deskripsi             string  `json:"deskripsi"`
	TargetKetercapaian    float64 `json:"target_ketercapaian"`
	RealisasiKetercapaian float64 `json:"realisasi_ketercapaian"`
	PersentaseLulus       float64 `json:"persentase_lulus,omitempty"`
}

type CourseGradeDistribution struct {
	ID              string `json:"id"`
	EvaluationID    string `json:"evaluation_id"`
	NilaiHuruf      string `json:"nilai_huruf"` // A, AB, B, BC, C, D, E
	JumlahMahasiswa int    `json:"jumlah_mahasiswa"`
}

type CourseImprovementPlan struct {
	ID                string `json:"id"`
	EvaluationID      string `json:"evaluation_id"`
	CourseID          string `json:"course_id,omitempty"`
	Uraian            string `json:"uraian"`
	TargetKomponenRPS string `json:"target_komponen_rps,omitempty"`
	Status            string `json:"status"` // BELUM_DITERAPKAN | SEBAGIAN_DITERAPKAN | SUDAH_DITERAPKAN
	AppliedInRpsID    string `json:"applied_in_rps_id,omitempty"`
	CatatanPenerapan  string `json:"catatan_penerapan,omitempty"`
}

type CourseFeedbackSummary struct {
	CourseClassID     string             `json:"course_class_id"`
	JumlahResponden   int                `json:"jumlah_responden"`
	RataRataNilai     float64            `json:"rata_rata_nilai"`
	RingkasanKomentar string             `json:"ringkasan_komentar,omitempty"`
	SkorPerAspek      map[string]float64 `json:"skor_per_aspek,omitempty"`
}

type CourseEvaluation struct {
	ID                   string                     `json:"id"`
	CourseClassID        string                     `json:"course_class_id"`
	CourseID             string                     `json:"course_id,omitempty"`
	DiisiOleh            string                     `json:"diisi_oleh,omitempty"`
	Status               string                     `json:"status,omitempty"` // DRAF | SUBMITTED | DITINJAU
	IndeksKepuasanMhs    float64                    `json:"indeks_kepuasan_mhs"`
	PersentaseKelulusan  float64                    `json:"persentase_kelulusan"`
	KesesuaianRPS        string                     `json:"kesesuaian_rps,omitempty"` // SESUAI | SEBAGIAN_SESUAI | TIDAK_SESUAI
	PenjelasanKesesuaian string                     `json:"penjelasan_kesesuaian,omitempty"`
	Kendala              string                     `json:"kendala,omitempty"`
	Solusi               string                     `json:"solusi,omitempty"`
	CatatanGKM           string                     `json:"catatan_gkm,omitempty"`
	IsSubmitted          bool                       `json:"is_submitted"`
	CPMKList             []*CpmkEvaluation          `json:"cpmk_list,omitempty"`
	Grades               []*CourseGradeDistribution `json:"grades,omitempty"`
	ImprovementPlans     []*CourseImprovementPlan   `json:"improvement_plans,omitempty"`
	FeedbackSummary      *CourseFeedbackSummary     `json:"feedback_summary,omitempty"`
	CreatedAt            time.Time                  `json:"created_at"`
	UpdatedAt            time.Time                  `json:"updated_at"`
}

type EvaluationRecap struct {
	TotalKelas          int                `json:"total_kelas"`
	TotalEvaluasi       int                `json:"total_evaluasi"`
	SudahMengisi        int                `json:"sudah_mengisi"`
	BelumMengisi        int                `json:"belum_mengisi"`
	RataRataKepuasan    float64            `json:"rata_rata_kepuasan"`
	RataRataKelulusan   float64            `json:"rata_rata_kelulusan"`
	RataRataCPMK        float64            `json:"rata_rata_cpmk"`
	PersentaseSubmitted float64            `json:"persentase_submitted"`
	RingkasanPerMK      map[string]float64 `json:"ringkasan_per_mk,omitempty"`
}
