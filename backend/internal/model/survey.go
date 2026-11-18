package model

import "time"

type PartnerProgramType string

const (
	ProgramKP                     PartnerProgramType = "KP"
	ProgramPSI                    PartnerProgramType = "PSI"
	ProgramPDLK                   PartnerProgramType = "PDLK"
	ProgramKerjaPraktik           PartnerProgramType = "KERJA_PRAKTIK"
	ProgramProyekSistemInformasi  PartnerProgramType = "PROYEK_SISTEM_INFORMASI"
	ProgramPembelajaranLuarKampus PartnerProgramType = "PEMBELAJARAN_DILUAR_KAMPUS"
)

type SurveyQuestion struct {
	ID         string  `json:"id"`
	SurveyID   string  `json:"survey_id"`
	Aspek      string  `json:"aspek"`
	Pertanyaan string  `json:"pertanyaan"`
	Bobot      float64 `json:"bobot,omitempty"`
	Urutan     int     `json:"urutan"`
	SkalaMin   int     `json:"skala_min"`
	SkalaMax   int     `json:"skala_max"`
	IsActive   bool    `json:"is_active,omitempty"`
}

type PartnerSurvey struct {
	ID            string             `json:"id"`
	Judul         string             `json:"judul"`
	Nama          string             `json:"nama,omitempty"`
	Program       PartnerProgramType `json:"program"`
	TahunAkademik string             `json:"tahun_akademik"`
	SkalaMaks     int                `json:"skala_maks,omitempty"`
	Status        string             `json:"status,omitempty"`
	IsActive      bool               `json:"is_active"`
	Questions     []*SurveyQuestion  `json:"questions,omitempty"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
}

type StudentPlacement struct {
	ID               string             `json:"id"`
	StudentID        string             `json:"student_id"`
	NamaMahasiswa    string             `json:"nama_mahasiswa,omitempty"`
	NIM              string             `json:"nim,omitempty"`
	PartnerID        string             `json:"partner_id"`
	NamaMitra        string             `json:"nama_mitra,omitempty"`
	AcademicPeriodID string             `json:"academic_period_id"`
	PeriodeLabel     string             `json:"periode_label,omitempty"`
	Program          PartnerProgramType `json:"program"`
	TanggalMulai     string             `json:"tanggal_mulai,omitempty"`
	TanggalSelesai   string             `json:"tanggal_selesai,omitempty"`
}

type PartnerInvitation struct {
	ID               string     `json:"id"`
	SurveyID         string     `json:"survey_id"`
	PartnerID        string     `json:"partner_id"`
	NamaMitra        string     `json:"nama_mitra,omitempty"`
	PlacementID      string     `json:"placement_id,omitempty"`
	NamaMahasiswa    string     `json:"nama_mahasiswa,omitempty"`
	Program          string     `json:"program,omitempty"`
	AcademicPeriodID string     `json:"academic_period_id,omitempty"`
	Periode          string     `json:"periode,omitempty"`
	Token            string     `json:"token"`
	NamaPembimbing   string     `json:"nama_pembimbing"`
	EmailTujuan      string     `json:"email_tujuan"`
	DikirimVia       string     `json:"dikirim_via,omitempty"`
	Status           string     `json:"status,omitempty"`
	IsCompleted      bool       `json:"is_completed"`
	ExpiredAt        *time.Time `json:"expired_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

type PartnerResponseAnswer struct {
	QuestionID string `json:"question_id"`
	Aspek      string `json:"aspek,omitempty"`
	Nilai      int    `json:"nilai"`
	Catatan    string `json:"catatan,omitempty"`
}

type PartnerResponseSubmission struct {
	ID                string                   `json:"id,omitempty"`
	InvitationToken   string                   `json:"invitation_token,omitempty"`
	SurveyID          string                   `json:"survey_id,omitempty"`
	PartnerID         string                   `json:"partner_id,omitempty"`
	NamaMitra         string                   `json:"nama_mitra,omitempty"`
	PlacementID       string                   `json:"placement_id,omitempty"`
	NamaMahasiswa     string                   `json:"nama_mahasiswa,omitempty"`
	Program           string                   `json:"program,omitempty"`
	Periode           string                   `json:"periode,omitempty"`
	NamaPengisi       string                   `json:"nama_pengisi"`
	Jabatan           string                   `json:"jabatan,omitempty"`
	Sumber            string                   `json:"sumber,omitempty"` // TAUTAN_MITRA | INPUT_KOORDINATOR
	DiinputOleh       string                   `json:"diinput_oleh,omitempty"`
	AlasanInputManual string                   `json:"alasan_input_manual,omitempty"`
	BuktiDokumenURL   string                   `json:"bukti_dokumen_url,omitempty"`
	SaranMasukan      string                   `json:"saran_masukan,omitempty"`
	SkorRataRata      float64                  `json:"skor_rata_rata,omitempty"`
	Answers           []*PartnerResponseAnswer `json:"answers"`
	SubmittedAt       time.Time                `json:"submitted_at,omitempty"`
	IsVoid            bool                     `json:"is_void,omitempty"`
	AlasanVoid        string                   `json:"alasan_void,omitempty"`
	DivoidOleh        string                   `json:"divoid_oleh,omitempty"`
	DivoidAt          *time.Time               `json:"divoid_at,omitempty"`
}

type SurveyTrendPoint struct {
	Periode      string  `json:"periode"`
	SkorRataRata float64 `json:"skor_rata_rata"`
	Responden    int     `json:"responden"`
}

type SurveyRecap struct {
	SurveyID       string              `json:"survey_id"`
	Judul          string              `json:"judul"`
	TotalUndangan  int                 `json:"total_undangan"`
	TotalResponden int                 `json:"total_responden"`
	ResponseRate   float64             `json:"response_rate"`
	SkorRataRata   float64             `json:"skor_rata_rata"`
	SkorPerAspek   map[string]float64  `json:"skor_per_aspek"`
	SkorPerProgram map[string]float64  `json:"skor_per_program"`
	SkorPerMitra   map[string]float64  `json:"skor_per_mitra"`
	TrenPeriode    []*SurveyTrendPoint `json:"tren_periode"`
}
