-- ============================================================
-- SIMPRO - Sistem Informasi Manajemen Program Studi
-- Skema Database PostgreSQL / Supabase Migration
-- Selaras Penuh dengan SKPL v2 & PRD SIMPRO Modul 7 - 13 (FR-26 s.d. FR-51 & NF-01 s.d. NF-13)
-- ============================================================

-- 1. Ekstensi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tipe Data Kustom (ENUMS)
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('MAHASISWA', 'DOSEN', 'TENDIK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE academic_status AS ENUM ('AKTIF', 'CUTI', 'LULUS', 'MENGUNDURKAN_DIRI', 'DIKELUARKAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app_role AS ENUM (
        'KAPRODI', 'GKM', 'ADMIN_PRODI', 'DOSEN',
        'KOORDINATOR_KP', 'KOORDINATOR_PSI', 'KOORDINATOR_PDLK',
        'PENGELOLA_ADUAN', 'PETUGAS_KEKERASAN', 'MAHASISWA',
        'DOSEN_VERIFIKATOR', 'DOSEN_WALI', 'DOSEN_PEMBINA',
        'KETUA_KELAS', 'PENGURUS_HIMPUNAN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE semester_type AS ENUM ('GANJIL', 'GENAP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE partner_program_type AS ENUM (
        'KP', 'PSI', 'PDLK',
        'KERJA_PRAKTIK', 'PROYEK_SISTEM_INFORMASI', 'PEMBELAJARAN_DILUAR_KAMPUS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE publication_type AS ENUM (
        'JURNAL', 'PROSIDING', 'BUKU', 'HKI',
        'JURNAL_INTERNASIONAL', 'JURNAL_NASIONAL_TERAKREDITASI',
        'PROSIDING_INTERNASIONAL', 'PROSIDING_NASIONAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE publication_status AS ENUM (
        'DRAFT', 'DRAF', 'REVIEW_INTERNAL', 'DIAJUKAN', 'DALAM_REVIEW',
        'REVISI', 'DITERIMA', 'TERBIT', 'DITOLAK',
        'MENUNGGU_VERIFIKASI', 'TERVERIFIKASI'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE travel_status AS ENUM (
        'DRAFT', 'DRAF', 'DIAJUKAN', 'DISETUJUI', 'DISETUJUI_KAPRODI',
        'DITOLAK', 'DILAPORKAN', 'SELESAI', 'LAPORAN_TERVERIFIKASI'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE budget_status AS ENUM ('DRAFT', 'DRAF', 'DIAJUKAN', 'DISETUJUI', 'AKTIF', 'REVISI', 'DITUTUP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rps_status AS ENUM (
        'DRAFT', 'DRAF', 'DIAJUKAN', 'DIREVIEW', 'SEDANG_DIREVIEW',
        'PERLU_REVISI', 'REVISI', 'DISETUJUI', 'DISETUJUI_GKM',
        'DISAHKAN', 'DISAHKAN_KAPRODI'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM (
        'DITERIMA', 'DIVERIFIKASI', 'DIDISPOSISIKAN', 'DITINDAKLANJUTI', 'SELESAI', 'DITUTUP', 'DITOLAK'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_category AS ENUM (
        'AKADEMIK', 'LAYANAN_ADMINISTRASI', 'KEUANGAN_ADMINISTRASI',
        'FASILITAS', 'DOSEN_TENDIK', 'PERUNDUNGAN_KEKERASAN', 'LAINNYA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Fungsi Helper Timestamp Otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- A. DATA INDUK (SHARED) & AUDIT TRAIL (NF-03)
-- ============================================================

-- 1. Pengguna (profiles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_induk TEXT UNIQUE NOT NULL,
    nama_lengkap TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipe_pengguna user_type NOT NULL DEFAULT 'DOSEN',
    angkatan SMALLINT,
    status_akademik academic_status DEFAULT 'AKTIF',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    siakad_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Peran Pengguna (user_roles)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    ditetapkan_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    berlaku_dari DATE NOT NULL DEFAULT CURRENT_DATE,
    berlaku_sampai DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- 3. Periode Akademik (academic_periods) - NF-12
CREATE TABLE IF NOT EXISTS academic_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_akademik TEXT NOT NULL,
    semester semester_type NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    tanggal_selesai_perkuliahan DATE,
    batas_pengisian_evaluasi DATE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_academic_period UNIQUE (tahun_akademik, semester)
);

-- 4. Mata Kuliah (courses)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_mk TEXT UNIQUE NOT NULL,
    nama_mk TEXT NOT NULL,
    sks SMALLINT NOT NULL DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Kelas Mata Kuliah (course_classes)
CREATE TABLE IF NOT EXISTS course_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
    kode_kelas TEXT NOT NULL,
    dosen_pengampu_id UUID NOT NULL REFERENCES profiles(id),
    jumlah_mahasiswa SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_course_class UNIQUE (course_id, academic_period_id, kode_kelas)
);

-- 6. Jejak Audit Lintas Modul (audit_logs) - NF-03 (Dikecualikan untuk Pelapor Anonim NF-04)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modul TEXT NOT NULL,
    entitas_id TEXT NOT NULL,
    aksi TEXT NOT NULL,
    status_lama TEXT,
    status_baru TEXT,
    aktor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- B. MODUL 7 — KEPUASAN MITRA KP, PSI, PDLK (FR-26 s.d. FR-28)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_instansi TEXT NOT NULL,
    bidang_industri TEXT,
    nama_kontak TEXT NOT NULL,
    email_kontak TEXT NOT NULL,
    no_telepon TEXT,
    alamat TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penempatan Mahasiswa di Mitra (FR-27)
CREATE TABLE IF NOT EXISTS student_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partner_institutions(id) ON DELETE CASCADE,
    academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
    program partner_program_type NOT NULL DEFAULT 'KP',
    tanggal_mulai DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_selesai DATE NOT NULL DEFAULT CURRENT_DATE,
    pembimbing_dosen_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Instrumen Survei Kepuasan Mitra per Jenis Program (FR-26)
CREATE TABLE IF NOT EXISTS partner_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    program partner_program_type NOT NULL,
    tahun_akademik TEXT NOT NULL,
    skala_maks SMALLINT NOT NULL DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'AKTIF',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    dibuat_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES partner_surveys(id) ON DELETE CASCADE,
    aspek TEXT NOT NULL,
    pertanyaan TEXT NOT NULL,
    bobot NUMERIC(5,2) NOT NULL DEFAULT 25.00,
    urutan SMALLINT NOT NULL DEFAULT 1,
    skala_min SMALLINT NOT NULL DEFAULT 1,
    skala_max SMALLINT NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tautan Pengisian Langsung ke Mitra & Relasi Penempatan (FR-27)
CREATE TABLE IF NOT EXISTS partner_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES partner_surveys(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partner_institutions(id) ON DELETE CASCADE,
    placement_id UUID REFERENCES student_placements(id) ON DELETE SET NULL,
    academic_period_id UUID REFERENCES academic_periods(id) ON DELETE SET NULL,
    token TEXT UNIQUE NOT NULL,
    nama_pembimbing_lapangan TEXT NOT NULL,
    email_tujuan TEXT NOT NULL,
    dikirim_via TEXT NOT NULL DEFAULT 'EMAIL',
    status TEXT NOT NULL DEFAULT 'TERKIRIM',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    expired_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Respons Survei (Tautan Mitra maupun Input Manual Koordinator - FR-27 & FR-28)
CREATE TABLE IF NOT EXISTS partner_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID UNIQUE REFERENCES partner_invitations(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES partner_surveys(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partner_institutions(id) ON DELETE SET NULL,
    placement_id UUID REFERENCES student_placements(id) ON DELETE SET NULL,
    academic_period_id UUID REFERENCES academic_periods(id) ON DELETE SET NULL,
    nama_pengisi TEXT NOT NULL DEFAULT 'Pembimbing Lapangan',
    jabatan_pengisi TEXT DEFAULT 'Pembimbing Lapangan',
    sumber TEXT NOT NULL DEFAULT 'TAUTAN_MITRA', -- TAUTAN_MITRA | INPUT_KOORDINATOR
    diinput_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    alasan_input_manual TEXT,
    bukti_dokumen_url TEXT,
    status TEXT NOT NULL DEFAULT 'VALID',
    skor_rata_rata NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    saran_masukan TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_response_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES partner_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    nilai SMALLINT NOT NULL CHECK (nilai >= 1 AND nilai <= 5),
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- C. MODUL 8 — PUBLIKASI DOSEN & MAHASISWA (FR-29 s.d. FR-32)
-- ============================================================

CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    tipe publication_type NOT NULL,
    status publication_status NOT NULL DEFAULT 'DRAFT',
    nama_jurnal_konferensi TEXT NOT NULL,
    peringkat TEXT NOT NULL DEFAULT 'NON_PERINGKAT', -- SINTA_1..6, SCOPUS_Q1..Q4, NON_PERINGKAT
    tahun_terbit SMALLINT NOT NULL,
    doi TEXT,
    url_publikasi TEXT,
    file_naskah_url TEXT,
    bukti_submit_url TEXT,
    loa_url TEXT,
    status_verifikasi TEXT NOT NULL DEFAULT 'TERVERIFIKASI', -- MENUNGGU | TERVERIFIKASI | DITOLAK
    verifikator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    catatan_verifikasi TEXT,
    diverifikasi_at TIMESTAMPTZ,
    is_forwarded_to_kinerja BOOLEAN NOT NULL DEFAULT FALSE, -- FR-32 Penerusan ke Kinerja Dosen (FR-06)
    forwarded_to_kinerja_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publication_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    nama_penulis TEXT NOT NULL,
    tipe_penulis TEXT NOT NULL DEFAULT 'DOSEN', -- DOSEN | MAHASISWA | EKSTERNAL
    peran TEXT NOT NULL DEFAULT 'PENULIS_UTAMA', -- PENULIS_UTAMA | PENULIS_PENDAMPING | KORESPONDENSI
    afiliasi TEXT NOT NULL DEFAULT 'Universitas',
    urutan SMALLINT NOT NULL DEFAULT 1,
    is_corresponding BOOLEAN NOT NULL DEFAULT FALSE
);

-- Riwayat Tanggal & Bukti Setiap Tahapan Publikasi (FR-29)
CREATE TABLE IF NOT EXISTS publication_stage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    tahap publication_status NOT NULL,
    tanggal_tahap DATE NOT NULL DEFAULT CURRENT_DATE,
    jenis_bukti TEXT, -- NASKAH_DRAF | BUKTI_SUBMIT | LOA | DOI_URL
    tautan_bukti TEXT,
    nama_berkas_bukti TEXT,
    catatan TEXT,
    dicatat_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status_verifikasi TEXT NOT NULL DEFAULT 'TERVERIFIKASI',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Review Internal Naskah Sebelum Submit ke Penerbit (FR-30)
CREATE TABLE IF NOT EXISTS publication_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id),
    ditetapkan_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'SELESAI_REVIEW', -- DITUGASKAN | SELESAI_REVIEW
    tenggat_review DATE,
    catatan TEXT NOT NULL,
    rekomendasi TEXT NOT NULL, -- LAYAK_AJUKAN | PERLU_PERBAIKAN
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- D. MODUL 9 — PERJALANAN DINAS / SPPD (FR-33 s.d. FR-35)
-- ============================================================

CREATE TABLE IF NOT EXISTS travel_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_surat_tugas TEXT, -- Dapat diisi saat pengajuan maupun persetujuan (FR-33)
    tujuan TEXT NOT NULL,
    keperluan TEXT NOT NULL,
    tanggal_berangkat DATE NOT NULL,
    tanggal_kembali DATE NOT NULL,
    batas_laporan DATE, -- Tenggat waktu pelaporan setelah tanggal kepulangan (FR-34)
    sumber_dana TEXT NOT NULL DEFAULT 'RKA_PRODI',
    rka_budget_item_id UUID, -- Terhubung ke Pos Anggaran RKA (FR-33 & FR-37)
    status travel_status NOT NULL DEFAULT 'DRAFT',
    total_estimasi_biaya NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total_estimasi_biaya >= 0),
    total_realisasi_biaya NUMERIC(15,2) DEFAULT 0.00 CHECK (total_realisasi_biaya >= 0),
    catatan_keputusan TEXT,
    catatan_kelengkapan TEXT,
    diajukan_oleh UUID NOT NULL REFERENCES profiles(id),
    disetujui_oleh UUID REFERENCES profiles(id),
    disetujui_at TIMESTAMPTZ,
    dikonfirmasi_oleh UUID REFERENCES profiles(id),
    dikonfirmasi_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_order_id UUID NOT NULL REFERENCES travel_orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    peran_tugas TEXT NOT NULL DEFAULT 'Pelaksana'
);

-- Estimasi & Realisasi Biaya Per Komponen Wajib >= 0 (FR-33 & FR-34)
CREATE TABLE IF NOT EXISTS travel_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_order_id UUID NOT NULL REFERENCES travel_orders(id) ON DELETE CASCADE,
    komponen TEXT NOT NULL, -- TRANSPORTASI | AKOMODASI | UANG_HARIAN | LAINNYA
    nominal_estimasi NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (nominal_estimasi >= 0),
    nominal_realisasi NUMERIC(15,2) DEFAULT 0.00 CHECK (nominal_realisasi >= 0),
    keterangan TEXT,
    bukti_url TEXT
);

-- Berkas Bukti Perjalanan per Kategori (FR-34)
CREATE TABLE IF NOT EXISTS travel_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_order_id UUID NOT NULL REFERENCES travel_orders(id) ON DELETE CASCADE,
    kategori TEXT NOT NULL, -- TIKET | BUKTI_PENGINAPAN | KUITANSI | FOTO_KEGIATAN | LAPORAN
    file_name TEXT NOT NULL,
    file_url TEXT,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_order_id UUID UNIQUE NOT NULL REFERENCES travel_orders(id) ON DELETE CASCADE,
    ringkasan_hasil TEXT NOT NULL,
    file_laporan_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ
);

-- ============================================================
-- E. MODUL 10 — RKA PRODI (FR-36 s.d. FR-38)
-- ============================================================

CREATE TABLE IF NOT EXISTS rka_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_anggaran SMALLINT NOT NULL UNIQUE,
    judul TEXT NOT NULL DEFAULT 'Rencana Kerja dan Anggaran (RKA) Prodi',
    status budget_status NOT NULL DEFAULT 'DRAFT',
    pagu_total NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (pagu_total >= 0),
    total_terpakai NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total_terpakai >= 0),
    dibuat_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Riwayat Versi Setiap Revisi RKA (FR-36)
CREATE TABLE IF NOT EXISTS rka_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rka_id UUID NOT NULL REFERENCES rka_documents(id) ON DELETE CASCADE,
    nomor_versi SMALLINT NOT NULL DEFAULT 1,
    catatan_perubahan TEXT,
    snapshot_json JSONB,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kegiatan RKA Beserta Indikator, Jadwal, dan Penanggung Jawab (FR-36 & FR-38)
CREATE TABLE IF NOT EXISTS rka_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rka_id UUID NOT NULL REFERENCES rka_documents(id) ON DELETE CASCADE,
    nama_kegiatan TEXT NOT NULL,
    indikator_kinerja TEXT NOT NULL,
    target_kinerja TEXT,
    jadwal_mulai DATE,
    jadwal_selesai DATE,
    triwulan SMALLINT NOT NULL DEFAULT 1 CHECK (triwulan >= 1 AND triwulan <= 4),
    penanggung_jawab_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status_pelaksanaan TEXT NOT NULL DEFAULT 'BELUM_TERLAKSANA', -- BELUM_TERLAKSANA | SEDANG_BERJALAN | TERLAKSANA
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pos Anggaran RKA dengan Nominal Rencana Wajib >= 0 & Sumber Dana (FR-36)
CREATE TABLE IF NOT EXISTS rka_budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rka_id UUID NOT NULL REFERENCES rka_documents(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES rka_activities(id) ON DELETE CASCADE,
    kode_mata_anggaran TEXT NOT NULL,
    nama_kegiatan TEXT NOT NULL,
    kategori TEXT NOT NULL,
    sumber_dana TEXT NOT NULL DEFAULT 'RKAT_UNIVERSITAS',
    triwulan SMALLINT NOT NULL DEFAULT 1 CHECK (triwulan >= 1 AND triwulan <= 4),
    anggaran_alokasi NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (anggaran_alokasi >= 0),
    anggaran_terpakai NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (anggaran_terpakai >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Realisasi Kegiatan & Biaya per Pos RKA Termasuk Perjalanan Dinas (FR-37)
CREATE TABLE IF NOT EXISTS rka_realizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_item_id UUID NOT NULL REFERENCES rka_budget_items(id) ON DELETE CASCADE,
    travel_order_id UUID REFERENCES travel_orders(id) ON DELETE SET NULL,
    sumber_pencatatan TEXT NOT NULL DEFAULT 'MANUAL', -- MANUAL | PERJALANAN_DINAS
    uraian TEXT NOT NULL,
    nominal NUMERIC(15,2) NOT NULL CHECK (nominal >= 0),
    tanggal_realisasi DATE NOT NULL DEFAULT CURRENT_DATE,
    bukti_transaksi_url TEXT,
    dicatat_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- F. MODUL 11 & 12 — MUTU PEMBELAJARAN (RPS & EVALUASI) (FR-39 s.d. FR-46)
-- ============================================================

CREATE TABLE IF NOT EXISTS rps_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
    tahun_akademik TEXT NOT NULL DEFAULT '2024/2025', -- FR-39 Pengajuan RPS per Mata Kuliah per Tahun Akademik
    status rps_status NOT NULL DEFAULT 'DRAFT',
    versi_terbaru SMALLINT NOT NULL DEFAULT 1,
    dosen_penyusun_id UUID NOT NULL REFERENCES profiles(id),
    gkm_reviewer_id UUID REFERENCES profiles(id),
    disahkan_oleh UUID REFERENCES profiles(id),
    disahkan_at TIMESTAMPTZ,
    catatan_pengesahan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_rps_course_period UNIQUE (course_id, academic_period_id)
);

CREATE TABLE IF NOT EXISTS rps_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rps_submission_id UUID NOT NULL REFERENCES rps_submissions(id) ON DELETE CASCADE,
    nomor_versi SMALLINT NOT NULL DEFAULT 1,
    dokumen_url TEXT NOT NULL,
    catatan_revisi TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rps_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rps_submission_id UUID NOT NULL REFERENCES rps_submissions(id) ON DELETE CASCADE,
    rps_version_id UUID REFERENCES rps_versions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id),
    komentar TEXT NOT NULL,
    rekomendasi TEXT NOT NULL, -- PERLU_REVISI | DISETUJUI
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daftar Periksa 5 Komponen Review RPS (FR-40)
CREATE TABLE IF NOT EXISTS rps_review_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rps_review_id UUID NOT NULL REFERENCES rps_reviews(id) ON DELETE CASCADE,
    komponen TEXT NOT NULL, -- KESELARASAN_CPL_CPMK | BAHAN_KAJIAN | METODE_PEMBELAJARAN | BENTUK_BOBOT_PENILAIAN | REFERENSI
    hasil TEXT NOT NULL DEFAULT 'SESUAI', -- SESUAI | PERLU_PERBAIKAN
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluasi Pasca-Perkuliahan per Kelas (FR-43)
CREATE TABLE IF NOT EXISTS course_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_class_id UUID UNIQUE NOT NULL REFERENCES course_classes(id) ON DELETE CASCADE,
    diisi_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'DRAF', -- DRAF | SUBMITTED | DITINJAU
    indeks_kepuasan_mhs NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    persentase_kelulusan NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    kesesuaian_rps TEXT NOT NULL DEFAULT 'SESUAI', -- SESUAI | SEBAGIAN_SESUAI | TIDAK_SESUAI
    penjelasan_kesesuaian TEXT,
    kendala_pembelajaran TEXT,
    solusi_rekomendasi TEXT,
    catatan_gkm TEXT,
    ditinjau_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ditinjau_at TIMESTAMPTZ,
    is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cpmk_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES course_evaluations(id) ON DELETE CASCADE,
    kode_cpmk TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    target_ketercapaian NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    realisasi_ketercapaian NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    persentase_lulus NUMERIC(5,2) NOT NULL DEFAULT 0.00
);

-- Distribusi Nilai Mahasiswa per Kelas (FR-43)
CREATE TABLE IF NOT EXISTS course_evaluation_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES course_evaluations(id) ON DELETE CASCADE,
    nilai_huruf TEXT NOT NULL, -- A, AB, B, BC, C, D, E
    jumlah_mahasiswa SMALLINT NOT NULL DEFAULT 0 CHECK (jumlah_mahasiswa >= 0)
);

-- Rencana Perbaikan Semester Berikutnya yang Diteruskan ke Review RPS (FR-43 & FR-45)
CREATE TABLE IF NOT EXISTS course_improvement_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES course_evaluations(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    uraian TEXT NOT NULL,
    target_komponen_rps TEXT,
    status TEXT NOT NULL DEFAULT 'BELUM_DITERAPKAN', -- BELUM_DITERAPKAN | SEBAGIAN_DITERAPKAN | SUDAH_DITERAPKAN
    applied_in_rps_id UUID REFERENCES rps_submissions(id) ON DELETE SET NULL,
    catatan_penerapan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ringkasan Survei Kepuasan Mahasiswa dari SIMPRO Manajemen Prodi (FR-44)
CREATE TABLE IF NOT EXISTS course_feedback_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_class_id UUID UNIQUE NOT NULL REFERENCES course_classes(id) ON DELETE CASCADE,
    jumlah_responden SMALLINT NOT NULL DEFAULT 0,
    rata_rata_nilai NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    ringkasan_komentar TEXT,
    aspek_json JSONB,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- G. MODUL 13 — LAYANAN ADUAN MAHASISWA (FR-47 s.d. FR-51 & NF-04)
-- Catatan NF-04: Tabel complaints & complaint_messages DILARANG menyimpan
-- kolom identitas pelapor, IP address, user-agent, atau metadata perangkat.
-- ============================================================

CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_aduan TEXT UNIQUE,
    kode_tiket TEXT UNIQUE NOT NULL,
    kategori complaint_category NOT NULL DEFAULT 'AKADEMIK',
    judul TEXT NOT NULL,
    isi_aduan TEXT NOT NULL,
    lampiran_url TEXT,
    status complaint_status NOT NULL DEFAULT 'DITERIMA',
    is_sensitif BOOLEAN NOT NULL DEFAULT FALSE,
    kontak_sukarela TEXT, -- FR-50 Kontak sukarela opsional untuk pendampingan
    diteruskan_ke_satgas_tanggal DATE, -- FR-50 Penerusan ke Satgas PPKPT Universitas
    nomor_referensi_satgas TEXT,
    petugas_satgas TEXT,
    is_escalated_kaprodi BOOLEAN NOT NULL DEFAULT FALSE, -- FR-49 Eskalasi otomatis ke Kaprodi jika lewat tenggat
    escalated_at TIMESTAMPTZ,
    petugas_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    tanggal_pengaduan DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_selesai DATE,
    rating_kepuasan SMALLINT CHECK (rating_kepuasan >= 1 AND rating_kepuasan <= 5), -- FR-51 Tingkat kepuasan pelapor
    komentar_kepuasan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('PELAPOR', 'PETUGAS', 'SISTEM')),
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Hanya diisi jika sender_type = 'PETUGAS'
    is_catatan_internal BOOLEAN NOT NULL DEFAULT FALSE,
    pesan TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_dispositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    dari_petugas_id UUID NOT NULL REFERENCES profiles(id),
    kepada_petugas_id UUID NOT NULL REFERENCES profiles(id),
    catatan_disposisi TEXT NOT NULL,
    deadline_tindak_lanjut DATE,
    status TEXT NOT NULL DEFAULT 'AKTIF', -- AKTIF | SELESAI | TERESKALASI
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- H. DATA AWAL (SEED DATA UNTUK PENGUJIAN)
-- ============================================================

-- Akun Default: Kaprodi, GKM, Admin Prodi, Dosen, Mahasiswa
INSERT INTO profiles (id, nomor_induk, nama_lengkap, email, tipe_pengguna, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', '198501152010121001', 'Dr. Ahmad Fauzi, M.T.', 'kaprodi@univ.ac.id', 'DOSEN', TRUE),
('a0000000-0000-0000-0000-000000000002', '198703202014042002', 'Dr. Siti Nurhaliza, M.Kom.', 'gkm@univ.ac.id', 'DOSEN', TRUE),
('a0000000-0000-0000-0000-000000000003', '199208102019031003', 'Budi Santoso, S.Kom.', 'admin@univ.ac.id', 'TENDIK', TRUE),
('a0000000-0000-0000-0000-000000000004', '198911052018021004', 'Ir. Hendra Wijaya, M.Sc.', 'dosen@univ.ac.id', 'DOSEN', TRUE),
('a0000000-0000-0000-0000-000000000005', '2211521001', 'Rian Pratama', 'mahasiswa@univ.ac.id', 'MAHASISWA', TRUE)
ON CONFLICT (nomor_induk) DO NOTHING;

-- Hak Akses Default
INSERT INTO user_roles (user_id, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'KAPRODI'),
('a0000000-0000-0000-0000-000000000001', 'DOSEN'),
('a0000000-0000-0000-0000-000000000002', 'GKM'),
('a0000000-0000-0000-0000-000000000002', 'DOSEN'),
('a0000000-0000-0000-0000-000000000003', 'ADMIN_PRODI'),
('a0000000-0000-0000-0000-000000000003', 'PENGELOLA_ADUAN'),
('a0000000-0000-0000-0000-000000000002', 'PETUGAS_KEKERASAN'),
('a0000000-0000-0000-0000-000000000004', 'DOSEN'),
('a0000000-0000-0000-0000-000000000004', 'KOORDINATOR_KP'),
('a0000000-0000-0000-0000-000000000004', 'DOSEN_VERIFIKATOR'),
('a0000000-0000-0000-0000-000000000005', 'MAHASISWA')
ON CONFLICT (user_id, role) DO NOTHING;

-- Periode Akademik Berjalan
INSERT INTO academic_periods (id, tahun_akademik, semester, tanggal_mulai, tanggal_selesai, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', '2024/2025', 'GANJIL', '2024-09-01', '2025-01-31', TRUE)
ON CONFLICT (tahun_akademik, semester) DO NOTHING;
