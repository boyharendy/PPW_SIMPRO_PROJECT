package repository

import (
	"fmt"
	"simpro-backend/internal/database"
	"simpro-backend/internal/model"
)

type ReferenceRepository interface {
	GetAcademicPeriods() ([]*model.AcademicPeriod, error)
	GetCourses() ([]*model.Course, error)
	GetCourseClasses() ([]*model.CourseClass, error)
	GetPartners() ([]*model.PartnerInstitution, error)
}

// ------------------------------------------------------------
// Supabase Implementation
// ------------------------------------------------------------

type supabaseReferenceRepository struct {
	client *database.SupabaseClient
}

func NewSupabaseReferenceRepository(client *database.SupabaseClient) ReferenceRepository {
	return &supabaseReferenceRepository{client: client}
}

func (r *supabaseReferenceRepository) GetAcademicPeriods() ([]*model.AcademicPeriod, error) {
	var periods []*model.AcademicPeriod
	err := r.client.Select("academic_periods", map[string]string{
		"order": "tahun_akademik.desc,semester.asc",
	}, &periods)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data periode akademik: %w", err)
	}
	return periods, nil
}

func (r *supabaseReferenceRepository) GetCourses() ([]*model.Course, error) {
	var courses []*model.Course
	err := r.client.Select("courses", map[string]string{
		"order": "kode_mk.asc",
	}, &courses)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data mata kuliah: %w", err)
	}
	return courses, nil
}

func (r *supabaseReferenceRepository) GetCourseClasses() ([]*model.CourseClass, error) {
	var classes []*model.CourseClass
	err := r.client.Select("course_classes", map[string]string{
		"order": "kode_kelas.asc",
	}, &classes)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data kelas kuliah: %w", err)
	}
	return classes, nil
}

func (r *supabaseReferenceRepository) GetPartners() ([]*model.PartnerInstitution, error) {
	var partners []*model.PartnerInstitution
	err := r.client.Select("partner_institutions", map[string]string{
		"order": "nama_instansi.asc",
	}, &partners)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data mitra institusi: %w", err)
	}
	return partners, nil
}

// ------------------------------------------------------------
// In-Memory Implementation (Fallback & Testing)
// ------------------------------------------------------------

type memoryReferenceRepository struct{}

func NewMemoryReferenceRepository() ReferenceRepository {
	return &memoryReferenceRepository{}
}

func (r *memoryReferenceRepository) GetAcademicPeriods() ([]*model.AcademicPeriod, error) {
	return []*model.AcademicPeriod{
		{
			ID:            "b0000000-0000-0000-0000-000000000001",
			TahunAkademik: "2024/2025",
			Semester:      "GANJIL",
			TanggalMulai:  "2024-09-01",
			TanggalSelesai: "2025-01-31",
			IsActive:      true,
		},
	}, nil
}

func (r *memoryReferenceRepository) GetCourses() ([]*model.Course, error) {
	return []*model.Course{
		{
			ID:       "c0000000-0000-0000-0000-000000000001",
			KodeMK:   "IF3110",
			NamaMK:   "Pengembangan Aplikasi Web",
			SKS:      3,
			IsActive: true,
		},
		{
			ID:       "c0000000-0000-0000-0000-000000000002",
			KodeMK:   "IF3120",
			NamaMK:   "Basis Data Lanjut",
			SKS:      3,
			IsActive: true,
		},
	}, nil
}

func (r *memoryReferenceRepository) GetCourseClasses() ([]*model.CourseClass, error) {
	return []*model.CourseClass{
		{
			ID:               "cc000000-0000-0000-0000-000000000001",
			CourseID:         "c0000000-0000-0000-0000-000000000001",
			AcademicPeriodID: "b0000000-0000-0000-0000-000000000001",
			KodeKelas:        "K1",
			DosenPengampuID:  "a0000000-0000-0000-0000-000000000004",
			JumlahMahasiswa:  35,
		},
	}, nil
}

func (r *memoryReferenceRepository) GetPartners() ([]*model.PartnerInstitution, error) {
	return []*model.PartnerInstitution{
		{
			ID:           "p0000000-0000-0000-0000-000000000001",
			NamaInstansi: "PT Telekomunikasi Indonesia",
			NamaKontak:   "Ir. Joko Susanto",
			EmailKontak:  "hrd@telkom.co.id",
			NoTelepon:    "021-5215123",
			Alamat:       "Jl. Japati No. 1 Bandung",
		},
	}, nil
}

