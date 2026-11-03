-- ============================================================
-- SIMPRO - Migration Modul 5: Program Kerja Himpunan
-- Tabel Proker, Proposal, LPJ, Pos Anggaran, dan Sumber Dana
-- ============================================================

-- 1. Tabel Program Kerja Himpunan (FR-17)
CREATE TABLE IF NOT EXISTS himpunan_prokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kegiatan TEXT NOT NULL,
    tujuan TEXT NOT NULL,
    indikator_keberhasilan TEXT NOT NULL,
    periode_kepengurusan VARCHAR(20) NOT NULL DEFAULT '2024/2025',
    tanggal_rencana_mulai DATE NOT NULL,
    tanggal_rencana_selesai DATE NOT NULL,
    total_anggaran_rencana NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_anggaran_rencana >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'TERDAFTAR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabel Proposal Kegiatan (FR-18)
CREATE TABLE IF NOT EXISTS himpunan_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proker_id UUID NOT NULL REFERENCES himpunan_prokers(id) ON DELETE CASCADE,
    nomor_surat VARCHAR(100) NOT NULL,
    tanggal_pengajuan DATE NOT NULL DEFAULT CURRENT_DATE,
    total_anggaran_proposal NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_anggaran_proposal >= 0),
    berkas_proposal_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DIAJUKAN',
    catatan_pembina TEXT,
    catatan_kaprodi TEXT,
    diverifikasi_pembina_at TIMESTAMPTZ,
    disetujui_kaprodi_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Laporan Pertanggungjawaban (LPJ) (FR-19)
CREATE TABLE IF NOT EXISTS himpunan_lpjs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proker_id UUID NOT NULL REFERENCES himpunan_prokers(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES himpunan_proposals(id) ON DELETE CASCADE,
    tanggal_pelaksanaan_mulai DATE NOT NULL,
    tanggal_pelaksanaan_selesai DATE NOT NULL,
    jumlah_peserta_realisasi INT NOT NULL DEFAULT 0 CHECK (jumlah_peserta_realisasi >= 0),
    capaian_indikator TEXT NOT NULL,
    total_biaya_realisasi NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_biaya_realisasi >= 0),
    total_dana_diterima NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_dana_diterima >= 0),
    berkas_lpj_url TEXT,
    bukti_kuitansi_count INT NOT NULL DEFAULT 0,
    tanggal_pengumpulan DATE NOT NULL DEFAULT CURRENT_DATE,
    tenggat_pengumpulan DATE NOT NULL,
    hari_keterlambatan INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DIAJUKAN',
    catatan_pembina TEXT,
    catatan_kaprodi TEXT,
    diverifikasi_pembina_at TIMESTAMPTZ,
    disetujui_kaprodi_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Rincian Pos Anggaran Terstruktur (FR-17, FR-18, FR-19, FR-21)
CREATE TABLE IF NOT EXISTS himpunan_budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proker_id UUID NOT NULL REFERENCES himpunan_prokers(id) ON DELETE CASCADE,
    pos_anggaran TEXT NOT NULL,
    kategori VARCHAR(50) NOT NULL DEFAULT 'OPERASIONAL',
    anggaran_rencana NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (anggaran_rencana >= 0),
    anggaran_proposal NUMERIC(15,2) DEFAULT 0,
    realisasi_lpj NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabel Rincian Sumber Dana Terstruktur (FR-17, FR-18, FR-19, FR-21)
CREATE TABLE IF NOT EXISTS himpunan_funding_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proker_id UUID NOT NULL REFERENCES himpunan_prokers(id) ON DELETE CASCADE,
    sumber VARCHAR(50) NOT NULL DEFAULT 'DANA_PRODI',
    rencana_nominal NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (rencana_nominal >= 0),
    realisasi_nominal NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Data Awal Modul 5 (SI-Fest 2024 & Workshop UI/UX)
INSERT INTO himpunan_prokers (id, nama_kegiatan, tujuan, indikator_keberhasilan, periode_kepengurusan, tanggal_rencana_mulai, tanggal_rencana_selesai, total_anggaran_rencana, status)
VALUES
('c0000000-0000-0000-0000-000000000001', 'SI-Fest 2024: National IT Competition & Expo', 'Meningkatkan iklim kompetitif teknologi informasi mahasiswa tingkat nasional dan memperluas jejaring industri.', 'Diikuti minimal 150 tim dari 15 perguruan tinggi, publikasi media nasional, dan kehadiran 300 pengunjung expo.', '2024/2025', '2024-10-10', '2024-10-12', 28500000, 'SELESAI'),
('c0000000-0000-0000-0000-000000000002', 'Workshop UI/UX Design & Modern Frontend Development', 'Pelatihan intensif perancangan desain pengalaman pengguna dan implementasi web interaktif mahasiswa SI.', 'Minimal 80 peserta aktif, tingkat kepuasan materi ≥ 85%, dan 15 portofolio Figma interaktif terverifikasi.', '2024/2025', '2024-11-20', '2024-11-21', 6200000, 'PROPOSAL_DIAJUKAN')
ON CONFLICT (id) DO NOTHING;
