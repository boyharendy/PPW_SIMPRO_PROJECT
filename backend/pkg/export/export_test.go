package export_test

import (
	"strings"
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/pkg/export"
)

func TestExportServices(t *testing.T) {
	// 1. Test Survey Recap CSV
	surveyRecap := &model.SurveyRecap{
		Judul:          "Survei Kepuasan Mitra 2024",
		TotalUndangan:  20,
		TotalResponden: 18,
		ResponseRate:   90.0,
		SkorRataRata:   4.75,
		SkorPerAspek: map[string]float64{
			"Kompetensi Teknis": 4.8,
			"Integritas & Etika": 4.7,
		},
		SkorPerProgram: map[string]float64{
			"KP": 4.75,
		},
	}
	surveyCSV := export.ExportSurveyRecapCSV(surveyRecap)
	if len(surveyCSV) == 0 || !strings.Contains(string(surveyCSV), "Survei Kepuasan Mitra 2024") {
		t.Fatalf("ExportSurveyRecapCSV failed or missing content")
	}

	// 2. Test Publication Recap CSV
	pubs := []*model.Publication{
		{
			Judul:            "Studi Analisis Sentimen Indonesia",
			Tipe:             model.PubJurnalInternasional,
			Status:           model.PubStatusTerbit,
			TahunTerbit:      2024,
			Peringkat:        "SCOPUS_Q2",
			StatusVerifikasi: "TERVERIFIKASI",
		},
	}
	pubCSV := export.ExportPublicationRecapCSV(pubs)
	if len(pubCSV) == 0 || !strings.Contains(string(pubCSV), "Studi Analisis Sentimen Indonesia") {
		t.Fatalf("ExportPublicationRecapCSV failed or missing content")
	}

	// 3. Test Trip Recap CSV
	tripRecap := &model.TripRecap{
		TotalPerjalanan:    5,
		TotalEstimasiBiaya: 25000000,
		TotalRealisasiBiaya: 23500000,
		StatusDistribusi: map[string]int{
			"SELESAI": 5,
		},
	}
	tripCSV := export.ExportTripRecapCSV(tripRecap)
	if len(tripCSV) == 0 || !strings.Contains(string(tripCSV), "LAPORAN REKAPITULASI PERJALANAN DINAS") {
		t.Fatalf("ExportTripRecapCSV failed or missing content")
	}

	// 4. Test RKA Serapan CSV
	rkaSerapan := &model.RkaSerapan{
		TahunAnggaran:   2025,
		TotalPagu:       250000000,
		TotalSerapan:    187500000,
		PersentaseTotal: 75.0,
		SerapanPerTriwulan: []*model.TriwulanSerapan{
			{Triwulan: "TW 1", TargetPagu: 60000000, Realisasi: 50000000, Persentase: 83.33},
		},
		SerapanPerPos: []*model.PosSerapan{
			{NamaPos: "Belanja ATK", Pagu: 10000000, Realisasi: 8000000, Sisa: 2000000, Persentase: 80.0},
		},
	}
	rkaCSV := export.ExportRkaSerapanCSV(rkaSerapan)
	if len(rkaCSV) == 0 || !strings.Contains(string(rkaCSV), "250000000") {
		t.Fatalf("ExportRkaSerapanCSV failed or missing content")
	}

	// 5. Test Evaluation Recap CSV
	evalRecap := &model.EvaluationRecap{
		TotalEvaluasi:           12,
		PersentaseSubmitted:     100.0,
		RataRataKepuasanMhs:     4.6,
		RataRataKelulusan:       92.5,
		PersentaseCpmkTercapai: 88.0,
	}
	evalCSV := export.ExportEvaluationRecapCSV(evalRecap)
	if len(evalCSV) == 0 || !strings.Contains(string(evalCSV), "LAPORAN REKAPITULASI POST-EVALUASI") {
		t.Fatalf("ExportEvaluationRecapCSV failed or missing content")
	}
}

