package model

import "time"

type ComplaintStatus string

const (
	ComplaintStatusDiterima        ComplaintStatus = "DITERIMA"
	ComplaintStatusDiverifikasi    ComplaintStatus = "DIVERIFIKASI"
	ComplaintStatusDidisposisikan  ComplaintStatus = "DIDISPOSISIKAN"
	ComplaintStatusDitindaklanjuti ComplaintStatus = "DITINDAKLANJUTI"
	ComplaintStatusSelesai         ComplaintStatus = "SELESAI"
	ComplaintStatusDitolak         ComplaintStatus = "DITOLAK"
)

type ComplaintCategory string

const (
	ComplaintCatAkademik             ComplaintCategory = "AKADEMIK"
	ComplaintCatFasilitas            ComplaintCategory = "FASILITAS"
	ComplaintCatDosenTendik          ComplaintCategory = "DOSEN_TENDIK"
	ComplaintCatPerundunganKekerasan ComplaintCategory = "PERUNDUNGAN_KEKERASAN"
	ComplaintCatKeuangan             ComplaintCategory = "KEUANGAN_ADMINISTRASI"
	ComplaintCatLainnya              ComplaintCategory = "LAINNYA"
)

type ComplaintMessage struct {
	ID          string    `json:"id"`
	ComplaintID string    `json:"complaint_id"`
	SenderType  string    `json:"sender_type"` // PELAPOR, PETUGAS, SISTEM
	SenderID    string    `json:"sender_id,omitempty"`
	Pesan       string    `json:"pesan"`
	CreatedAt   time.Time `json:"created_at"`
}

type ComplaintDisposition struct {
	ID                   string     `json:"id"`
	ComplaintID          string     `json:"complaint_id"`
	DariPetugasID        string     `json:"dari_petugas_id"`
	KepadaPetugasID      string     `json:"kepada_petugas_id"`
	CatatanDisposisi     string     `json:"catatan_disposisi"`
	DeadlineTindakLanjut *time.Time `json:"deadline_tindak_lanjut,omitempty"`
	CreatedAt            time.Time  `json:"created_at"`
}

type Complaint struct {
	ID               string                  `json:"id"`
	KodeTiket        string                  `json:"kode_tiket"`
	Kategori         ComplaintCategory       `json:"kategori"`
	Judul            string                  `json:"judul"`
	IsiAduan         string                  `json:"isi_aduan"`
	Status           ComplaintStatus         `json:"status"`
	IsSensitif       bool                    `json:"is_sensitif"`
	PetugasID        string                  `json:"petugas_id,omitempty"`
	TanggalPengaduan string                  `json:"tanggal_pengaduan"`
	Messages         []*ComplaintMessage     `json:"messages,omitempty"`
	Dispositions     []*ComplaintDisposition `json:"dispositions,omitempty"`
	CreatedAt        time.Time               `json:"created_at"`
	UpdatedAt        time.Time               `json:"updated_at"`
}

type PublicComplaintRequest struct {
	Kategori   ComplaintCategory `json:"kategori" binding:"required"`
	Judul      string            `json:"judul" binding:"required"`
	IsiAduan   string            `json:"isi_aduan" binding:"required"`
	IsSensitif bool              `json:"is_sensitif"`
}

type ComplaintRecap struct {
	TotalAduan       int                    `json:"total_aduan"`
	TotalSelesai     int                    `json:"total_selesai"`
	TotalSensitif    int                    `json:"total_sensitif"`
	StatusDistribusi map[string]int         `json:"status_distribusi"`
	KategoriDist     map[string]int         `json:"kategori_distribusi"`
}
