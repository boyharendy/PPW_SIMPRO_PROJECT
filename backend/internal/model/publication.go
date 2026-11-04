package model

import "time"

type PublicationType string

const (
	PubJurnalInternasional           PublicationType = "JURNAL_INTERNASIONAL"
	PubJurnalNasionalTerakreditasi  PublicationType = "JURNAL_NASIONAL_TERAKREDITASI"
	PubProsidingInternasional        PublicationType = "PROSIDING_INTERNASIONAL"
	PubProsidingNasional             PublicationType = "PROSIDING_NASIONAL"
	PubBuku                          PublicationType = "BUKU"
	PubHKI                           PublicationType = "HKI"
)

type PublicationStatus string

const (
	PubStatusDraft              PublicationStatus = "DRAFT"
	PubStatusDiajukan           PublicationStatus = "DIAJUKAN"
	PubStatusMenungguVerifikasi PublicationStatus = "MENUNGGU_VERIFIKASI"
	PubStatusTerverifikasi      PublicationStatus = "TERVERIFIKASI"
	PubStatusDitolak            PublicationStatus = "DITOLAK"
)

type PublicationAuthor struct {
	ID             string `json:"id"`
	PublicationID  string `json:"publication_id"`
	UserID         string `json:"user_id,omitempty"`
	NamaPenulis    string `json:"nama_penulis"`
	Afiliasi       string `json:"afiliasi,omitempty"`
	Urutan         int    `json:"urutan"`
	IsCorresponding bool  `json:"is_corresponding"`
}

type PublicationReview struct {
	ID            string    `json:"id"`
	PublicationID string    `json:"publication_id"`
	ReviewerID    string    `json:"reviewer_id"`
	Catatan       string    `json:"catatan"`
	Rekomendasi   string    `json:"rekomendasi"`
	CreatedAt     time.Time `json:"created_at"`
}

type Publication struct {
	ID                   string               `json:"id"`
	Judul                string               `json:"judul"`
	Tipe                 PublicationType      `json:"tipe"`
	Status               PublicationStatus    `json:"status"`
	NamaJurnalKonferensi string               `json:"nama_jurnal_konferensi,omitempty"`
	TahunTerbit          int                  `json:"tahun_terbit"`
	DOI                  string               `json:"doi,omitempty"`
	URLPublikasi         string               `json:"url_publikasi,omitempty"`
	FileNaskahURL        string               `json:"file_naskah_url,omitempty"`
	CreatedBy            string               `json:"created_by"`
	Authors              []*PublicationAuthor `json:"authors,omitempty"`
	Reviews              []*PublicationReview `json:"reviews,omitempty"`
	CreatedAt            time.Time            `json:"created_at"`
	UpdatedAt            time.Time            `json:"updated_at"`
}

type PublicationRecap struct {
	TotalPublikasi   int            `json:"total_publikasi"`
	Terverifikasi    int            `json:"terverifikasi"`
	PerTipe          map[string]int `json:"per_tipe"`
	PerStatus        map[string]int `json:"per_status"`
	PerTahun         map[int]int    `json:"per_tahun"`
}
