package model

import "time"

type BudgetStatus string

const (
	BudgetStatusDraft     BudgetStatus = "DRAFT"
	BudgetStatusDraf      BudgetStatus = "DRAF"
	BudgetStatusDiajukan  BudgetStatus = "DIAJUKAN"
	BudgetStatusDisetujui BudgetStatus = "DISETUJUI"
	BudgetStatusAktif     BudgetStatus = "AKTIF"
	BudgetStatusRevisi    BudgetStatus = "REVISI"
	BudgetStatusDitutup   BudgetStatus = "DITUTUP"
)

type RkaActivity struct {
	ID                string           `json:"id"`
	RkaID             string           `json:"rka_id"`
	NamaKegiatan      string           `json:"nama_kegiatan"`
	IndikatorKinerja  string           `json:"indikator_kinerja"`
	TargetKinerja     string           `json:"target_kinerja,omitempty"`
	JadwalMulai       string           `json:"jadwal_mulai,omitempty"`
	JadwalSelesai     string           `json:"jadwal_selesai,omitempty"`
	Triwulan          int              `json:"triwulan"`
	PenanggungJawabID string           `json:"penanggung_jawab_id,omitempty"`
	StatusPelaksanaan string           `json:"status_pelaksanaan,omitempty"` // BELUM_TERLAKSANA | SEDANG_BERJALAN | TERLAKSANA
	IsOverdue         bool             `json:"is_overdue,omitempty"`
	IsActive          bool             `json:"is_active"`
	BudgetItems       []*RkaBudgetItem `json:"budget_items,omitempty"`
}

type RkaBudgetItem struct {
	ID               string  `json:"id"`
	RkaID            string  `json:"rka_id"`
	ActivityID       string  `json:"activity_id,omitempty"`
	KodeMataAnggaran string  `json:"kode_mata_anggaran"`
	NamaKegiatan     string  `json:"nama_kegiatan"`
	Kategori         string  `json:"kategori"`
	SumberDana       string  `json:"sumber_dana,omitempty"`
	Triwulan         int     `json:"triwulan,omitempty"`
	AnggaranAlokasi  float64 `json:"anggaran_alokasi"`
	AnggaranTerpakai float64 `json:"anggaran_terpakai"`
	SisaAnggaran     float64 `json:"sisa_anggaran"`
	IsActive         bool    `json:"is_active"`
}

type RkaVersion struct {
	ID               string                 `json:"id"`
	RkaID            string                 `json:"rka_id"`
	NomorVersi       int                    `json:"nomor_versi"`
	Status           string                 `json:"status,omitempty"` // DRAFT | DIAJUKAN | DISETUJUI | DIGANTIKAN | DITOLAK
	RowVersion       int                    `json:"row_version,omitempty"`
	CatatanPerubahan string                 `json:"catatan_perubahan,omitempty"`
	DraftPayload     map[string]interface{} `json:"draft_payload,omitempty"`
	CreatedBy        string                 `json:"created_by,omitempty"`
	CreatedAt        time.Time              `json:"created_at"`
}

type RkaRealization struct {
	ID                string    `json:"id"`
	BudgetItemId      string    `json:"budget_item_id"`
	TravelOrderID     string    `json:"travel_order_id,omitempty"`
	SumberPencatatan  string    `json:"sumber_pencatatan,omitempty"` // MANUAL | PERJALANAN_DINAS
	Uraian            string    `json:"uraian"`
	Nominal           float64   `json:"nominal"`
	TanggalRealisasi  string    `json:"tanggal_realisasi"`
	BuktiTransaksiURL string    `json:"bukti_transaksi_url,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}

type RkaDocument struct {
	ID                string           `json:"id"`
	TahunAnggaran     string           `json:"tahun_anggaran"`
	Judul             string           `json:"judul,omitempty"`
	Status            BudgetStatus     `json:"status"`
	PaguTotal         float64          `json:"pagu_total"`
	TotalTerpakai     float64          `json:"total_terpakai"`
	SisaAnggaran      float64          `json:"sisa_anggaran"`
	PersentaseSerapan float64          `json:"persentase_serapan"`
	VersiAktifID      string           `json:"versi_aktif_id,omitempty"`
	CatatanRevisi     string           `json:"catatan_revisi,omitempty"`
	Activities        []*RkaActivity   `json:"activities,omitempty"`
	BudgetItems       []*RkaBudgetItem `json:"budget_items,omitempty"`
	Versions          []*RkaVersion    `json:"versions,omitempty"`
	CreatedAt         time.Time        `json:"created_at"`
	UpdatedAt         time.Time        `json:"updated_at"`
}

type RkaSerapan struct {
	TahunAnggaran          string             `json:"tahun_anggaran"`
	PaguTotal              float64            `json:"pagu_total"`
	TotalTerpakai          float64            `json:"total_terpakai"`
	SisaAnggaran           float64            `json:"sisa_anggaran"`
	PersentaseSerapan      float64            `json:"persentase_serapan"`
	SerapanPerKegiatan     map[string]float64 `json:"serapan_per_kegiatan"`
	SerapanPerPos          map[string]float64 `json:"serapan_per_pos"`
	SerapanPerTriwulan     map[string]float64 `json:"serapan_per_triwulan"`
	KegiatanMelewatiJadwal int                `json:"kegiatan_melewati_jadwal"`
}
