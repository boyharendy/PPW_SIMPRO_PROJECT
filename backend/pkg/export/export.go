package export

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strconv"
	"time"

	"simpro-backend/internal/model"
)

// Add UTF-8 BOM so Excel opens CSV with proper encoding automatically
var utf8BOM = []byte{0xEF, 0xBB, 0xBF}

func ExportSurveyRecapCSV(recap *model.SurveyRecap) []byte {
	var buf bytes.Buffer
	buf.Write(utf8BOM)
	w := csv.NewWriter(&buf)

	_ = w.Write([]string{"LAPORAN REKAPITULASI KEPUASAN MITRA (KP, PSI, PDLK)"})
	_ = w.Write([]string{"Judul Survei", recap.Judul})
	_ = w.Write([]string{"Tanggal Cetak", time.Now().Format("2006-01-02 15:04:05")})
	_ = w.Write([]string{"Total Undangan Terkirim", strconv.Itoa(recap.TotalUndangan)})
	_ = w.Write([]string{"Total Responden", strconv.Itoa(recap.TotalResponden)})
	_ = w.Write([]string{"Response Rate (%)", fmt.Sprintf("%.2f%%", recap.ResponseRate)})
	_ = w.Write([]string{"Skor Rata-Rata Keseluruhan", fmt.Sprintf("%.2f / 5.0", recap.SkorRataRata)})
	_ = w.Write([]string{""})

	// Skor Per Aspek
	_ = w.Write([]string{"ASPEK PENILAIAN", "SKOR RATA-RATA"})
	for aspek, skor := range recap.SkorPerAspek {
		_ = w.Write([]string{aspek, fmt.Sprintf("%.2f", skor)})
	}
	_ = w.Write([]string{""})

	// Skor Per Program
	_ = w.Write([]string{"PROGRAM", "SKOR RATA-RATA"})
	for prog, skor := range recap.SkorPerProgram {
		_ = w.Write([]string{prog, fmt.Sprintf("%.2f", skor)})
	}

	w.Flush()
	return buf.Bytes()
}

func ExportPublicationRecapCSV(pubs []*model.Publication) []byte {
	var buf bytes.Buffer
	buf.Write(utf8BOM)
	w := csv.NewWriter(&buf)

	_ = w.Write([]string{"LAPORAN REKAPITULASI PUBLIKASI ILMIAH DOSEN & MAHASISWA"})
	_ = w.Write([]string{"Tanggal Cetak", time.Now().Format("2006-01-02 15:04:05")})
	_ = w.Write([]string{"Total Naskah", strconv.Itoa(len(pubs))})
	_ = w.Write([]string{""})

	_ = w.Write([]string{"NO", "JUDUL PUBLIKASI", "TIPE", "STATUS", "TAHUN", "PERINGKAT", "JUMLAH PENULIS", "VERIFIKASI"})
	for i, p := range pubs {
		_ = w.Write([]string{
			strconv.Itoa(i + 1),
			p.Judul,
			string(p.Tipe),
			string(p.Status),
			strconv.Itoa(p.TahunTerbit),
			p.Peringkat,
			strconv.Itoa(len(p.Authors)),
			p.StatusVerifikasi,
		})
	}

	w.Flush()
	return buf.Bytes()
}

func ExportTripRecapCSV(recap *model.TripRecap) []byte {
	var buf bytes.Buffer
	buf.Write(utf8BOM)
	w := csv.NewWriter(&buf)

	_ = w.Write([]string{"LAPORAN REKAPITULASI PERJALANAN DINAS & SPPD PRODI"})
	_ = w.Write([]string{"Tanggal Cetak", time.Now().Format("2006-01-02 15:04:05")})
	_ = w.Write([]string{"Total Perjalanan", strconv.Itoa(recap.TotalPerjalanan)})
	_ = w.Write([]string{"Total Estimasi Biaya (Rp)", fmt.Sprintf("%.2f", recap.TotalEstimasiBiaya)})
	_ = w.Write([]string{"Total Realisasi Biaya (Rp)", fmt.Sprintf("%.2f", recap.TotalRealisasiBiaya)})
	_ = w.Write([]string{"Efisiensi / Deviasi (Rp)", fmt.Sprintf("%.2f", recap.TotalEstimasiBiaya-recap.TotalRealisasiBiaya)})
	_ = w.Write([]string{""})

	_ = w.Write([]string{"STATUS PERJALANAN", "JUMLAH"})
	for status, count := range recap.StatusDistribusi {
		_ = w.Write([]string{status, strconv.Itoa(count)})
	}

	w.Flush()
	return buf.Bytes()
}

func ExportRkaSerapanCSV(serapan *model.RkaSerapan) []byte {
	var buf bytes.Buffer
	buf.Write(utf8BOM)
	w := csv.NewWriter(&buf)

	_ = w.Write([]string{"LAPORAN MONITORING SERAPAN ANGGARAN RKA PRODI"})
	_ = w.Write([]string{"Tahun Anggaran", strconv.Itoa(serapan.TahunAnggaran)})
	_ = w.Write([]string{"Tanggal Cetak", time.Now().Format("2006-01-02 15:04:05")})
	_ = w.Write([]string{"Total Pagu Anggaran (Rp)", fmt.Sprintf("%.2f", serapan.TotalPagu)})
	_ = w.Write([]string{"Total Serapan Riil (Rp)", fmt.Sprintf("%.2f", serapan.TotalSerapan)})
	_ = w.Write([]string{"Persentase Serapan", fmt.Sprintf("%.2f%%", serapan.PersentaseTotal)})
	_ = w.Write([]string{""})

	_ = w.Write([]string{"TRIWULAN", "PAGU (RP)", "REALISASI (RP)", "SERAPAN (%)"})
	for _, tw := range serapan.SerapanPerTriwulan {
		_ = w.Write([]string{
			tw.Triwulan,
			fmt.Sprintf("%.2f", tw.TargetPagu),
			fmt.Sprintf("%.2f", tw.Realisasi),
			fmt.Sprintf("%.2f%%", tw.Persentase),
		})
	}
	_ = w.Write([]string{""})

	_ = w.Write([]string{"POS ANGGARAN", "PAGU (RP)", "REALISASI (RP)", "SISA (RP)", "SERAPAN (%)", "STATUS"})
	for _, pos := range serapan.SerapanPerPos {
		status := "NORMAL"
		if pos.IsOverBudget {
			status = "OVER-BUDGET"
		}
		_ = w.Write([]string{
			pos.NamaPos,
			fmt.Sprintf("%.2f", pos.Pagu),
			fmt.Sprintf("%.2f", pos.Realisasi),
			fmt.Sprintf("%.2f", pos.Sisa),
			fmt.Sprintf("%.2f%%", pos.Persentase),
			status,
		})
	}

	w.Flush()
	return buf.Bytes()
}

func ExportEvaluationRecapCSV(recap *model.EvaluationRecap) []byte {
	var buf bytes.Buffer
	buf.Write(utf8BOM)
	w := csv.NewWriter(&buf)

	_ = w.Write([]string{"LAPORAN REKAPITULASI POST-EVALUASI PERKULIAHAN & CPMK"})
	_ = w.Write([]string{"Tanggal Cetak", time.Now().Format("2006-01-02 15:04:05")})
	_ = w.Write([]string{"Total Evaluasi Kelas", strconv.Itoa(recap.TotalEvaluasi)})
	_ = w.Write([]string{"Persentase Submit Evaluasi", fmt.Sprintf("%.2f%%", recap.PersentaseSubmitted)})
	_ = w.Write([]string{"Rata-Rata Indeks Kepuasan Mahasiswa", fmt.Sprintf("%.2f / 5.0", recap.RataRataKepuasanMhs)})
	_ = w.Write([]string{"Rata-Rata Persentase Kelulusan", fmt.Sprintf("%.2f%%", recap.RataRataKelulusan)})
	_ = w.Write([]string{"Persentase CPMK Tercapai", fmt.Sprintf("%.2f%%", recap.PersentaseCpmkTercapai)})

	w.Flush()
	return buf.Bytes()
}

