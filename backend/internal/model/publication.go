package model

import "time"

type PublicationType string

const (
	PubJurnal                       PublicationType = "JURNAL"
	PubProsiding                    PublicationType = "PROSIDING"
	PubJurnalInternasional          PublicationType = "JURNAL_INTERNASIONAL"
	PubJurnalNasionalTerakreditasi  PublicationType = "JURNAL_NASIONAL_TERAKREDITASI"
	PubProsidingInternasional       PublicationType = "PROSIDING_INTERNASIONAL"
	PubProsidingNasional            PublicationType = "PROSIDING_NASIONAL"
	PubBuku                         PublicationType = "BUKU"
	PubHKI                          PublicationType = "HKI"
)

type PublicationStatus string

const (
	PubStatusDraft              PublicationStatus = "DRAFT"
	PubStatusDraf               PublicationStatus = "DRAF"
	PubStatusReviewInternal     PublicationStatus = "REVIEW_INTERNAL"
	PubStatusDiajukan           PublicationStatus = "DIAJUKAN"
	PubStatusDalamReview        PublicationStatus = "DALAM_REVIEW"
	PubStatusRevisi             PublicationStatus = "REVISI"
	PubStatusDiterima           PublicationStatus = "DITERIMA"
	PubStatusTerbit             PublicationStatus = "TERBIT"
	PubStatusDitolak            PublicationStatus = "DITOLAK"
	PubStatusMenungguVerifikasi PublicationStatus = "MENUNGGU_VERIFIKASI"
	PubStatusTerverifikasi      PublicationStatus = "TERVERIFIKASI"
)

type PublicationAuthor struct {
	ID              string `json:"id"`
	PublicationID   string `json:"publication_id"`
	UserID          string `json:"user_id,omitempty"`
	NamaPenulis     string `json:"nama_penulis"`
	TipePenulis     string `json:"tipe_penulis,omitempty"` // DOSEN | MAHASISWA | EKSTERNAL
	Peran           string `json:"peran,omitempty"`        // PENULIS_UTAMA | PENULIS_PENDAMPING | KORESPONDENSI
	Afiliasi        string `json:"afiliasi,omitempty"`
	Urutan          int    `json:"urutan"`
	IsCorresponding      bool    `json:"is_corresponding"`
	PersentaseKontribusi float64 `json:"persentase_kontribusi"`
}

type PublicationStageLog struct {
	ID               string            `json:"id"`
	PublicationID    string            `json:"publication_id"`
	Tahap            PublicationStatus `json:"tahap"`
	TanggalTahap     string            `json:"tanggal_tahap"`
	JenisBukti       string            `json:"jenis_bukti,omitempty"` // NASKAH_DRAF | BUKTI_SUBMIT | LOA | DOI_URL
	TautanBukti      string            `json:"tautan_bukti,omitempty"`
	NamaBerkasBukti  string            `json:"nama_berkas_bukti,omitempty"`
	Catatan          string            `json:"catatan,omitempty"`
	DicatatOleh      string            `json:"dicatat_oleh,omitempty"`
	StatusVerifikasi string            `json:"status_verifikasi,omitempty"`
	CreatedAt        time.Time         `json:"created_at"`
}

type PublicationReview struct {
	ID             string    `json:"id"`
	PublicationID  string    `json:"publication_id"`
	ReviewerID     string    `json:"reviewer_id"`
	DitetapkanOleh string    `json:"ditetapkan_oleh,omitempty"`
	Status         string    `json:"status,omitempty"` // DITUGASKAN | SELESAI_REVIEW
	TenggatReview  string    `json:"tenggat_review,omitempty"`
	Catatan        string    `json:"catatan"`
	Rekomendasi    string    `json:"rekomendasi"`
	CreatedAt      time.Time `json:"created_at"`
}

type Publication struct {
	ID                   string                 `json:"id"`
	Judul                string                 `json:"judul"`
	Tipe                 PublicationType        `json:"tipe"`
	Jenis                string                 `json:"jenis,omitempty"`
	Status               PublicationStatus      `json:"status"`
	NamaJurnalKonferensi string                 `json:"nama_jurnal_konferensi,omitempty"`
	NamaTarget           string                 `json:"nama_target,omitempty"`
	Peringkat            string                 `json:"peringkat,omitempty"` // SINTA_1..6, SCOPUS_Q1..Q4, NON_PERINGKAT
	TahunTerbit          int                    `json:"tahun_terbit"`
	Tahun                int                    `json:"tahun,omitempty"`
	DOI                  string                 `json:"doi,omitempty"`
	URLPublikasi         string                 `json:"url_publikasi,omitempty"`
	FileNaskahURL        string                 `json:"file_naskah_url,omitempty"`
	BuktiSubmitURL       string                 `json:"bukti_submit_url,omitempty"`
	LoaURL               string                 `json:"loa_url,omitempty"`
	StatusVerifikasi     string                 `json:"status_verifikasi,omitempty"`
	VerifikatorID        string                 `json:"verifikator_id,omitempty"`
	CatatanVerifikasi    string                 `json:"catatan_verifikasi,omitempty"`
	DiverifikasiAt       *time.Time             `json:"diverifikasi_at,omitempty"`
	IsForwardedToKinerja bool                   `json:"is_forwarded_to_kinerja"`
	ForwardedToKinerjaAt *time.Time             `json:"forwarded_to_kinerja_at,omitempty"`
	CreatedBy            string                 `json:"created_by"`
	Authors              []*PublicationAuthor   `json:"authors,omitempty"`
	Reviews              []*PublicationReview   `json:"reviews,omitempty"`
	StageLogs            []*PublicationStageLog `json:"stage_logs,omitempty"`
	CreatedAt            time.Time              `json:"created_at"`
	UpdatedAt            time.Time              `json:"updated_at"`
}

type PublicationRecap struct {
	TotalPublikasi       int            `json:"total_publikasi"`
	Terverifikasi        int            `json:"terverifikasi"`
	JumlahLibatMahasiswa int            `json:"jumlah_libat_mahasiswa"`
	DiteruskanKeKinerja  int            `json:"diteruskan_ke_kinerja"`
	PerTipe              map[string]int `json:"per_tipe"`
	PerStatus            map[string]int `json:"per_status"`
	PerPeringkat         map[string]int `json:"per_peringkat"`
	PerTahun             map[int]int    `json:"per_tahun"`
}
