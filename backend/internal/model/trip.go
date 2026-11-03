package model

import "time"

type TravelStatus string

const (
	TripStatusDraft               TravelStatus = "DRAFT"
	TripStatusDiajukan            TravelStatus = "DIAJUKAN"
	TripStatusDisetujuiKaprodi    TravelStatus = "DISETUJUI_KAPRODI"
	TripStatusDitolak             TravelStatus = "DITOLAK"
	TripStatusSelesai             TravelStatus = "SELESAI"
	TripStatusLaporanTerverifikasi TravelStatus = "LAPORAN_TERVERIFIKASI"
)

type TravelMember struct {
	ID            string `json:"id"`
	TravelOrderID string `json:"travel_order_id"`
	UserID        string `json:"user_id"`
	PeranTugas    string `json:"peran_tugas"`
}

type TravelCost struct {
	ID               string  `json:"id"`
	TravelOrderID    string  `json:"travel_order_id"`
	Komponen         string  `json:"komponen"`
	NominalEstimasi  float64 `json:"nominal_estimasi"`
	NominalRealisasi float64 `json:"nominal_realisasi"`
	BuktiURL         string  `json:"bukti_url,omitempty"`
}

type TravelReport struct {
	ID             string    `json:"id"`
	TravelOrderID  string    `json:"travel_order_id"`
	RingkasanHasil string    `json:"ringkasan_hasil"`
	FileLaporanURL string    `json:"file_laporan_url,omitempty"`
	VerifiedBy     string    `json:"verified_by,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type TravelOrder struct {
	ID                  string          `json:"id"`
	NomorSuratTugas     string          `json:"nomor_surat_tugas"`
	Tujuan              string          `json:"tujuan"`
	Keperluan           string          `json:"keperluan"`
	TanggalBerangkat    string          `json:"tanggal_berangkat"`
	TanggalKembali      string          `json:"tanggal_kembali"`
	Status              TravelStatus    `json:"status"`
	TotalEstimasiBiaya  float64         `json:"total_estimasi_biaya"`
	TotalRealisasiBiaya float64         `json:"total_realisasi_biaya"`
	DiajukanOleh        string          `json:"diajukan_oleh"`
	DisetujuiOleh       string          `json:"disetujui_oleh,omitempty"`
	Members             []*TravelMember `json:"members,omitempty"`
	Costs               []*TravelCost   `json:"costs,omitempty"`
	Report              *TravelReport   `json:"report,omitempty"`
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`
}

type TripRecap struct {
	TotalPerjalanan      int            `json:"total_perjalanan"`
	TotalEstimasiBiaya   float64        `json:"total_estimasi_biaya"`
	TotalRealisasiBiaya  float64        `json:"total_realisasi_biaya"`
	StatusDistribusi     map[string]int `json:"status_distribusi"`
}
