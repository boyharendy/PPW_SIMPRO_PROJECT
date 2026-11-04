package model

type AcademicPeriod struct {
	ID            string `json:"id"`
	TahunAkademik string `json:"tahun_akademik"`
	Semester      string `json:"semester"`
	TanggalMulai  string `json:"tanggal_mulai"`
	TanggalSelesai string `json:"tanggal_selesai"`
	IsActive      bool   `json:"is_active"`
}

type Course struct {
	ID       string `json:"id"`
	KodeMK   string `json:"kode_mk"`
	NamaMK   string `json:"nama_mk"`
	SKS      int    `json:"sks"`
	IsActive bool   `json:"is_active"`
}

type CourseClass struct {
	ID               string `json:"id"`
	CourseID         string `json:"course_id"`
	AcademicPeriodID string `json:"academic_period_id"`
	KodeKelas        string `json:"kode_kelas"`
	DosenPengampuID  string `json:"dosen_pengampu_id"`
	JumlahMahasiswa  int    `json:"jumlah_mahasiswa"`
}

type PartnerInstitution struct {
	ID           string `json:"id"`
	NamaInstansi string `json:"nama_instansi"`
	NamaKontak   string `json:"nama_kontak"`
	EmailKontak  string `json:"email_kontak"`
	NoTelepon    string `json:"no_telepon,omitempty"`
	Alamat       string `json:"alamat,omitempty"`
}

