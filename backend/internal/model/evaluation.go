package model

import "time"

type CpmkEvaluation struct {
	ID                    string  `json:"id"`
	EvaluationID          string  `json:"evaluation_id"`
	KodeCPMK              string  `json:"kode_cpmk"`
	Deskripsi             string  `json:"deskripsi"`
	TargetKetercapaian    float64 `json:"target_ketercapaian"`
	RealisasiKetercapaian float64 `json:"realisasi_ketercapaian"`
}

type CourseEvaluation struct {
	ID                 string            `json:"id"`
	CourseClassID      string            `json:"course_class_id"`
	IndeksKepuasanMhs  float64           `json:"indeks_kepuasan_mhs"`
	PersentaseKelulusan float64           `json:"persentase_kelulusan"`
	Kendala            string            `json:"kendala,omitempty"`
	Solusi             string            `json:"solusi,omitempty"`
	IsSubmitted        bool              `json:"is_submitted"`
	CPMKList           []*CpmkEvaluation `json:"cpmk_list,omitempty"`
	CreatedAt          time.Time         `json:"created_at"`
	UpdatedAt          time.Time         `json:"updated_at"`
}

type EvaluationRecap struct {
	TotalEvaluasi       int     `json:"total_evaluasi"`
	RataRataKepuasan    float64 `json:"rata_rata_kepuasan"`
	RataRataKelulusan   float64 `json:"rata_rata_kelulusan"`
	PersentaseSubmitted float64 `json:"persentase_submitted"`
}
