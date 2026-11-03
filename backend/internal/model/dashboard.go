package model

import "time"

type Notification struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Judul       string    `json:"judul"`
	Pesan       string    `json:"pesan"`
	Tipe        string    `json:"tipe"` // INFO, PERINGATAN, TINDAKAN, SUKSES
	LinkTerkait string    `json:"link_terkait,omitempty"`
	IsRead      bool      `json:"is_read"`
	CreatedAt   time.Time `json:"created_at"`
}

type DashboardStats struct {
	KepuasanMitraAvg            float64 `json:"kepuasan_mitra_avg"`
	TotalRespondenMitra         int     `json:"total_responden_mitra"`
	TotalPublikasiTahunIni      int     `json:"total_publikasi_tahun_ini"`
	PublikasiMenungguVerifikasi int     `json:"publikasi_menunggu_verifikasi"`
	PerjalananDinasAktif        int     `json:"perjalanan_dinas_aktif"`
	TotalAnggaranRka            float64 `json:"total_anggaran_rka"`
	PersentaseSerapanRka        float64 `json:"persentase_serapan_rka"`
	RpsDisahkanCount            int     `json:"rps_disahkan_count"`
	RpsMenungguReviewCount      int     `json:"rps_menunggu_review_count"`
	EvaluasiTerkumpulPersen     float64 `json:"evaluasi_terkumpul_persen"`
	AduanTerbukaCount           int     `json:"aduan_terbuka_count"`
}
