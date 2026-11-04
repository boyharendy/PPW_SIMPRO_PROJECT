package model

import "time"

type BudgetStatus string

const (
	BudgetStatusDraft     BudgetStatus = "DRAFT"
	BudgetStatusDiajukan  BudgetStatus = "DIAJUKAN"
	BudgetStatusDisetujui BudgetStatus = "DISETUJUI"
	BudgetStatusRevisi    BudgetStatus = "REVISI"
)

type RkaBudgetItem struct {
	ID               string  `json:"id"`
	RkaID            string  `json:"rka_id"`
	KodeMataAnggaran string  `json:"kode_mata_anggaran"`
	NamaKegiatan     string  `json:"nama_kegiatan"`
	Kategori         string  `json:"kategori"`
	AnggaranAlokasi  float64 `json:"anggaran_alokasi"`
	AnggaranTerpakai float64 `json:"anggaran_terpakai"`
	SisaAnggaran     float64 `json:"sisa_anggaran"`
}

type RkaRealization struct {
	ID               string    `json:"id"`
	BudgetItemId    string    `json:"budget_item_id"`
	TravelOrderID    string    `json:"travel_order_id,omitempty"`
	Uraian           string    `json:"uraian"`
	Nominal          float64   `json:"nominal"`
	TanggalRealisasi string    `json:"tanggal_realisasi"`
	CreatedAt        time.Time `json:"created_at"`
}

type RkaDocument struct {
	ID                string           `json:"id"`
	TahunAnggaran     string           `json:"tahun_anggaran"`
	Status            BudgetStatus     `json:"status"`
	PaguTotal         float64          `json:"pagu_total"`
	TotalTerpakai     float64          `json:"total_terpakai"`
	SisaAnggaran      float64          `json:"sisa_anggaran"`
	PersentaseSerapan float64          `json:"persentase_serapan"`
	BudgetItems       []*RkaBudgetItem `json:"budget_items,omitempty"`
	CreatedAt         time.Time        `json:"created_at"`
	UpdatedAt         time.Time        `json:"updated_at"`
}

type RkaSerapan struct {
	TahunAnggaran     string  `json:"tahun_anggaran"`
	PaguTotal         float64 `json:"pagu_total"`
	TotalTerpakai     float64 `json:"total_terpakai"`
	SisaAnggaran      float64 `json:"sisa_anggaran"`
	PersentaseSerapan float64 `json:"persentase_serapan"`
}
