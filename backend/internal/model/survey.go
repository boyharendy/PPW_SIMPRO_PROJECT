package model

import "time"

type PartnerProgramType string

const (
	ProgramKerjaPraktik           PartnerProgramType = "KERJA_PRAKTIK"
	ProgramProyekSistemInformasi  PartnerProgramType = "PROYEK_SISTEM_INFORMASI"
	ProgramPembelajaranLuarKampus PartnerProgramType = "PEMBELAJARAN_DILUAR_KAMPUS"
)

type SurveyQuestion struct {
	ID         string `json:"id"`
	SurveyID   string `json:"survey_id"`
	Aspek      string `json:"aspek"`
	Pertanyaan string `json:"pertanyaan"`
	Urutan     int    `json:"urutan"`
	SkalaMin   int    `json:"skala_min"`
	SkalaMax   int    `json:"skala_max"`
}

type PartnerSurvey struct {
	ID            string            `json:"id"`
	Judul         string            `json:"judul"`
	Program       PartnerProgramType `json:"program"`
	TahunAkademik string            `json:"tahun_akademik"`
	IsActive      bool              `json:"is_active"`
	Questions     []*SurveyQuestion `json:"questions,omitempty"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

type PartnerInvitation struct {
	ID             string     `json:"id"`
	SurveyID       string     `json:"survey_id"`
	PartnerID      string     `json:"partner_id"`
	Token          string     `json:"token"`
	NamaPembimbing string     `json:"nama_pembimbing"`
	EmailTujuan    string     `json:"email_tujuan"`
	IsCompleted    bool       `json:"is_completed"`
	ExpiredAt      *time.Time `json:"expired_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

type PartnerResponseAnswer struct {
	QuestionID string `json:"question_id"`
	Nilai      int    `json:"nilai"`
	Catatan    string `json:"catatan,omitempty"`
}

type PartnerResponseSubmission struct {
	InvitationToken string                   `json:"invitation_token"`
	NamaPengisi     string                   `json:"nama_pengisi"`
	Jabatan         string                   `json:"jabatan,omitempty"`
	SaranMasukan    string                   `json:"saran_masukan,omitempty"`
	Answers         []*PartnerResponseAnswer `json:"answers"`
}

type SurveyRecap struct {
	SurveyID       string             `json:"survey_id"`
	Judul          string             `json:"judul"`
	TotalResponden int                `json:"total_responden"`
	SkorRataRata   float64            `json:"skor_rata_rata"`
	SkorPerAspek   map[string]float64 `json:"skor_per_aspek"`
}
