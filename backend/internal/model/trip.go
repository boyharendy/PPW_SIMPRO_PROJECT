package model

import "time"

type TravelStatus string

const (
	TripStatusDraft                TravelStatus = "DRAFT"
	TripStatusDraf                 TravelStatus = "DRAF"
	TripStatusDiajukan             TravelStatus = "DIAJUKAN"
	TripStatusDisetujui            TravelStatus = "DISETUJUI"
	TripStatusDisetujuiKaprodi     TravelStatus = "DISETUJUI_KAPRODI"
	TripStatusDitolak              TravelStatus = "DITOLAK"
	TripStatusDilaporkan           TravelStatus = "DILAPORKAN"
	TripStatusSelesai              TravelStatus = "SELESAI"
	TripStatusLaporanTerverifikasi TravelStatus = "LAPORAN_TERVERIFIKASI"
)

type TravelMember struct {
	ID            string `json:"id"`
	TravelOrderID string `json:"travel_order_id"`
	UserID        string `json:"user_id"`
	NamaPeserta   string `json:"nama_peserta,omitempty"`
	PeranTugas    string `json:"peran_tugas"`
}

type TravelCost struct {
	ID               string  `json:"id"`
	TravelOrderID    string  `json:"travel_order_id"`
	Komponen         string  `json:"komponen"` // TRANSPORTASI | AKOMODASI | UANG_HARIAN | LAINNYA
	NominalEstimasi  float64 `json:"nominal_estimasi"`
	EstimasiBiaya    float64 `json:"estimasi_biaya,omitempty"`
	NominalRealisasi float64 `json:"nominal_realisasi"`
	RealisasiBiaya   float64 `json:"realisasi_biaya,omitempty"`
	Keterangan       string  `json:"keterangan,omitempty"`
	BuktiURL         string  `json:"bukti_url,omitempty"`
}

type TravelProof struct {
	ID            string    `json:"id"`
	TravelOrderID string    `json:"travel_order_id"`
	Kategori      string    `json:"kategori"` // TIKET | BUKTI_PENGINAPAN | KUITANSI | FOTO_KEGIATAN | LAPORAN
	FileName      string    `json:"file_name"`
	FileURL       string    `json:"file_url,omitempty"`
	UploadedBy    string    `json:"uploaded_by,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
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
	MaksudKegiatan      string          `json:"maksud_kegiatan,omitempty"`
	TanggalBerangkat    string          `json:"tanggal_berangkat"`
	TanggalKembali      string          `json:"tanggal_kembali"`
	BatasLaporan        string          `json:"batas_laporan,omitempty"`
	SumberDana          string          `json:"sumber_dana,omitempty"`
	RkaBudgetItemID     string          `json:"rka_budget_item_id,omitempty"`
	Status              TravelStatus    `json:"status"`
	TotalEstimasiBiaya  float64         `json:"total_estimasi_biaya"`
	TotalRealisasiBiaya float64         `json:"total_realisasi_biaya"`
	CatatanKeputusan    string          `json:"catatan_keputusan,omitempty"`
	CatatanKelengkapan  string          `json:"catatan_kelengkapan,omitempty"`
	DiajukanOleh        string          `json:"diajukan_oleh"`
	DisetujuiOleh       string          `json:"disetujui_oleh,omitempty"`
	DisetujuiAt         *time.Time      `json:"disetujui_at,omitempty"`
	DikonfirmasiOleh    string          `json:"dikonfirmasi_oleh,omitempty"`
	DikonfirmasiAt      *time.Time      `json:"dikonfirmasi_at,omitempty"`
	Members             []*TravelMember `json:"members,omitempty"`
	Costs               []*TravelCost   `json:"costs,omitempty"`
	Proofs              []*TravelProof  `json:"proofs,omitempty"`
	Report              *TravelReport   `json:"report,omitempty"`
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`
}

type TripComponentSummary struct {
	Estimasi  float64 `json:"estimasi"`
	Realisasi float64 `json:"realisasi"`
	Selisih   float64 `json:"selisih"`
}

type TripRecap struct {
	TotalPerjalanan     int                             `json:"total_perjalanan"`
	TotalDisetujui      int                             `json:"total_disetujui"`
	TotalSelesai        int                             `json:"total_selesai"`
	TotalBiayaDinas     float64                         `json:"total_biaya_dinas"`
	TotalEstimasi       float64                         `json:"total_estimasi"`
	TotalRealisasi      float64                         `json:"total_realisasi"`
	TotalEstimasiBiaya  float64                         `json:"total_estimasi_biaya,omitempty"`
	TotalRealisasiBiaya float64                         `json:"total_realisasi_biaya,omitempty"`
	BelumLengkapLaporan int                             `json:"belum_lengkap_laporan,omitempty"`
	LewatTenggatLaporan int                             `json:"lewat_tenggat_laporan,omitempty"`
	StatusDistribusi    map[string]int                  `json:"status_distribusi,omitempty"`
	PerKomponen         map[string]*TripComponentSummary `json:"per_komponen,omitempty"`
	RingkasanKomponen   map[string]TripComponentSummary `json:"ringkasan_komponen,omitempty"`
	PerPeserta          map[string]int                  `json:"per_peserta,omitempty"`
}
