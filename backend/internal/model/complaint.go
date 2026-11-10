package model

import "time"

type ComplaintStatus string

const (
	ComplaintStatusDiterima        ComplaintStatus = "DITERIMA"
	ComplaintStatusDiverifikasi    ComplaintStatus = "DIVERIFIKASI"
	ComplaintStatusDidisposisikan  ComplaintStatus = "DIDISPOSISIKAN"
	ComplaintStatusDitindaklanjuti ComplaintStatus = "DITINDAKLANJUTI"
	ComplaintStatusSelesai         ComplaintStatus = "SELESAI"
	ComplaintStatusDitutup         ComplaintStatus = "DITUTUP"
	ComplaintStatusDitolak         ComplaintStatus = "DITOLAK"
)

type ComplaintCategory string

const (
	ComplaintCatAkademik             ComplaintCategory = "AKADEMIK"
	ComplaintCatLayananAdministrasi  ComplaintCategory = "LAYANAN_ADMINISTRASI"
	ComplaintCatKeuangan             ComplaintCategory = "KEUANGAN_ADMINISTRASI"
	ComplaintCatFasilitas            ComplaintCategory = "FASILITAS"
	ComplaintCatDosenTendik          ComplaintCategory = "DOSEN_TENDIK"
	ComplaintCatPerundunganKekerasan ComplaintCategory = "PERUNDUNGAN_KEKERASAN"
	ComplaintCatLainnya              ComplaintCategory = "LAINNYA"
)

type ComplaintMessage struct {
	ID                string    `json:"id"`
	ComplaintID       string    `json:"complaint_id"`
	SenderType        string    `json:"sender_type"` // PELAPOR, PETUGAS, SISTEM
	SenderID          string    `json:"sender_id,omitempty"`
	IsCatatanInternal bool      `json:"is_catatan_internal"`
	Pesan             string    `json:"pesan"`
	LampiranURL       string    `json:"lampiran_url,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}

type ComplaintDisposition struct {
	ID                   string     `json:"id"`
	ComplaintID          string     `json:"complaint_id"`
	DariPetugasID        string     `json:"dari_petugas_id"`
	KepadaPetugasID      string     `json:"kepada_petugas_id"`
	UnitTujuan           string     `json:"unit_tujuan,omitempty"`
	CatatanDisposisi     string     `json:"catatan_disposisi"`
	DeadlineTindakLanjut *time.Time `json:"deadline_tindak_lanjut,omitempty"`
	Status               string     `json:"status,omitempty"` // AKTIF | SELESAI | TERESKALASI
	CreatedAt            time.Time  `json:"created_at"`
}

type Complaint struct {
	ID                        string                  `json:"id"`
	NomorAduan                string                  `json:"nomor_aduan,omitempty"`
	KodeTiket                 string                  `json:"kode_tiket"`
	KodeTiketHash             string                  `json:"kode_tiket_hash,omitempty"`
	Kategori                  ComplaintCategory       `json:"kategori"`
	Judul                     string                  `json:"judul"`
	IsiAduan                  string                  `json:"isi_aduan"`
	LampiranURL               string                  `json:"lampiran_url,omitempty"`
	Status                    ComplaintStatus         `json:"status"`
	IsSensitif                bool                    `json:"is_sensitif"`
	KontakSukarela            string                  `json:"kontak_sukarela,omitempty"`
	DiteruskanKeSatgasTanggal string                  `json:"diteruskan_ke_satgas_tanggal,omitempty"`
	NomorReferensiSatgas      string                  `json:"nomor_referensi_satgas,omitempty"`
	PetugasSatgas             string                  `json:"petugas_satgas,omitempty"`
	IsEscalatedKaprodi        bool                    `json:"is_escalated_kaprodi"`
	EscalatedAt               *time.Time              `json:"escalated_at,omitempty"`
	PetugasID                 string                  `json:"petugas_id,omitempty"`
	TanggalPengaduan          string                  `json:"tanggal_pengaduan"`
	TanggalDiterima           string                  `json:"tanggal_diterima,omitempty"`
	TanggalSelesai            string                  `json:"tanggal_selesai,omitempty"`
	TanggalPenyelesaian       *string                 `json:"tanggal_penyelesaian,omitempty"`
	AlasanPenutupan           string                  `json:"alasan_penutupan,omitempty"`
	SolusiTindakLanjut        string                  `json:"solusi_tindak_lanjut,omitempty"`
	RatingKepuasan            *int                    `json:"rating_kepuasan,omitempty"`
	KomentarKepuasan          string                  `json:"komentar_kepuasan,omitempty"`
	Messages                  []*ComplaintMessage     `json:"messages,omitempty"`
	Dispositions              []*ComplaintDisposition `json:"dispositions,omitempty"`
	CreatedAt                 time.Time               `json:"created_at"`
	UpdatedAt                 time.Time               `json:"updated_at"`
}

// ComplaintMetadata digunakan untuk view v_complaint_metadata khusus Kaprodi
// Menyembunyikan judul, isi_aduan, dan pesan untuk kategori sensitif
type ComplaintMetadata struct {
	ID              string  `json:"id"`
	NomorAduan      string  `json:"nomor_aduan"`
	Kategori        string  `json:"kategori"`
	IsSensitif      bool    `json:"is_sensitif"`
	Status          string  `json:"status"`
	TanggalDiterima string  `json:"tanggal_diterima"`
	TanggalSelesai  *string `json:"tanggal_selesai,omitempty"`
	UmurHari        int     `json:"umur_hari"`
	TenggatTerakhir *string `json:"tenggat_terakhir,omitempty"`
	StatusDisposisi *string `json:"status_disposisi,omitempty"`
	PenanggungJawab *string `json:"penanggung_jawab,omitempty"`
}

type PublicComplaintRequest struct {
	PermitToken    string            `json:"permit_token,omitempty"`
	Kategori       ComplaintCategory `json:"kategori" binding:"required"`
	Judul          string            `json:"judul" binding:"required"`
	IsiAduan       string            `json:"isi_aduan" binding:"required"`
	LampiranURL    string            `json:"lampiran_url,omitempty"`
	KontakSukarela string            `json:"kontak_sukarela,omitempty"`
	IsSensitif     bool              `json:"is_sensitif"`
}

type ComplaintRecap struct {
	TotalAduan                    int            `json:"total_aduan"`
	TotalSelesai                  int            `json:"total_selesai"`
	TotalSensitif                 int            `json:"total_sensitif"`
	TotalTereskalasiKaprodi       int            `json:"total_tereskalasi_kaprodi"`
	TotalDiteruskanSatgas         int            `json:"total_diteruskan_satgas"`
	RataRataWaktuPenyelesaianHari float64        `json:"rata_rata_waktu_penyelesaian_hari"`
	RataRataKepuasanPelapor       float64        `json:"rata_rata_kepuasan_pelapor"`
	StatusDistribusi              map[string]int `json:"status_distribusi"`
	KategoriDist                  map[string]int `json:"kategori_distribusi"`
}
