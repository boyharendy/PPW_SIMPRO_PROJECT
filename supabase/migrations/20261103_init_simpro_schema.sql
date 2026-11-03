-- ============================================================
-- SIMPRO - Sistem Informasi Manajemen Program Studi
-- Skema Database PostgreSQL / Supabase Migration
-- Sesuai Bab 6 & Bab 10 PRD SIMPRO Modul 7 - 13
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
    CREATE TYPE partner_program_type AS ENUM ('KERJA_PRAKTIK', 'PROYEK_SISTEM_INFORMASI', 'PEMBELAJARAN_DILUAR_KAMPUS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE publication_type AS ENUM (
        'JURNAL_INTERNASIONAL', 'JURNAL_NASIONAL_TERAKREDITASI',
        'PROSIDING_INTERNASIONAL', 'PROSIDING_NASIONAL', 'BUKU', 'HKI'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE publication_status AS ENUM ('DRAFT', 'DIAJUKAN', 'MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DITOLAK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE travel_status AS ENUM (
        'DRAFT', 'DIAJUKAN', 'DISETUJUI_KAPRODI', 'DITOLAK', 'SELESAI', 'LAPORAN_TERVERIFIKASI'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE budget_status AS ENUM ('DRAFT', 'DIAJUKAN', 'DISETUJUI', 'REVISI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rps_status AS ENUM (
        'DRAFT', 'DIAJUKAN', 'SEDANG_DIREVIEW', 'REVISI', 'DISETUJUI_GKM', 'DISAHKAN_KAPRODI'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM (
        'DITERIMA', 'DIVERIFIKASI', 'DIDISPOSISIKAN', 'DITINDAKLANJUTI', 'SELESAI', 'DITOLAK'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_category AS ENUM (
        'AKADEMIK', 'FASILITAS', 'DOSEN_TENDIK', 'PERUNDUNGAN_KEKERASAN', 'KEUANGAN_ADMINISTRASI', 'LAINNYA'
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
-- A. DATA INDUK (SHARED)
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

-- 3. Periode Akademik (academic_periods)
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

-- ============================================================
-- B. MODUL 7 — KEPUASAN MITRA
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_instansi TEXT NOT NULL,
    nama_kontak TEXT NOT NULL,
    email_kontak TEXT NOT NULL,
    no_telepon TEXT,
    alamat TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    program partner_program_type NOT NULL,
    tahun_akademik TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES partner_surveys(id) ON DELETE CASCADE,
    aspek TEXT NOT NULL,
    pertanyaan TEXT NOT NULL,
    urutan SMALLINT NOT NULL DEFAULT 1,
    skala_min SMALLINT NOT NULL DEFAULT 1,
    skala_max SMALLINT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES partner_surveys(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partner_institutions(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    nama_pembimbing_lapangan TEXT NOT NULL,
    email_tujuan TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    expired_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID UNIQUE NOT NULL REFERENCES partner_invitations(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES partner_surveys(id) ON DELETE CASCADE,
    skor_rata_rata NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    saran_masukan TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_response_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES partner_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    nilai SMALLINT NOT NULL CHECK (nilai >= 1 AND nilai <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- C. MODUL 8 — PUBLIKASI ILMIAH
-- ============================================================

CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    tipe publication_type NOT NULL,
    status publication_status NOT NULL DEFAULT 'DRAFT',
    nama_jurnal_konferensi TEXT NOT NULL,
    tahun_terbit SMALLINT NOT NULL,
    doi TEXT,
    url_publikasi TEXT,
    file_naskah_url TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publication_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    nama_penulis TEXT NOT NULL,
    afiliasi TEXT NOT NULL DEFAULT 'Universitas',
    urutan SMALLINT NOT NULL DEFAULT 1,
    is_corresponding BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS publication_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id),
    catatan TEXT NOT NULL,
    rekomendasi TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- D. MODUL 9 — PERJALANAN DINAS
-- ============================================================

CREATE TABLE IF NOT EXISTS travel_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_surat_tugas TEXT,
    tujuan TEXT NOT NULL,
    keperluan TEXT NOT NULL,
    tanggal_berangkat DATE NOT NULL,
    tanggal_kembali DATE NOT NULL,
    status travel_status NOT NULL DEFAULT 'DRAFT',
    total_estimasi_biaya NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_realisasi_biaya NUMERIC(15,2) DEFAULT 0.00,
    diajukan_oleh UUID NOT NULL REFERENCES profiles(id),
    disetujui_oleh UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_order_id UUID NOT NULL REFERENCES travel_orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    peran_tugas TEXT NOT NULL DEFAULT 'Pelaksana'
);

CREATE TABLE IF NOT EXISTS travel_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_order_id UUID NOT NULL REFERENCES travel_orders(id) ON DELETE CASCADE,
    komponen TEXT NOT NULL,
    nominal_estimasi NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    nominal_realisasi NUMERIC(15,2) DEFAULT 0.00,
    bukti_url TEXT
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
-- E. MODUL 10 — RKA PRODI
-- ============================================================

CREATE TABLE IF NOT EXISTS rka_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_anggaran SMALLINT NOT NULL UNIQUE,
    status budget_status NOT NULL DEFAULT 'DRAFT',
    pagu_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_terpakai NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rka_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rka_id UUID NOT NULL REFERENCES rka_documents(id) ON DELETE CASCADE,
    nomor_versi SMALLINT NOT NULL DEFAULT 1,
    catatan_perubahan TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rka_budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rka_id UUID NOT NULL REFERENCES rka_documents(id) ON DELETE CASCADE,
    kode_mata_anggaran TEXT NOT NULL,
    nama_kegiatan TEXT NOT NULL,
    kategori TEXT NOT NULL,
    anggaran_alokasi NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    anggaran_terpakai NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rka_realizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_item_id UUID NOT NULL REFERENCES rka_budget_items(id) ON DELETE CASCADE,
    travel_order_id UUID REFERENCES travel_orders(id) ON DELETE SET NULL,
    uraian TEXT NOT NULL,
    nominal NUMERIC(15,2) NOT NULL,
    tanggal_realisasi DATE NOT NULL DEFAULT CURRENT_DATE,
    bukti_transaksi_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- F. MODUL 11 & 12 — MUTU PEMBELAJARAN (RPS & EVALUASI)
-- ============================================================

CREATE TABLE IF NOT EXISTS rps_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
    status rps_status NOT NULL DEFAULT 'DRAFT',
    dosen_penyusun_id UUID NOT NULL REFERENCES profiles(id),
    gkm_reviewer_id UUID REFERENCES profiles(id),
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
    reviewer_id UUID NOT NULL REFERENCES profiles(id),
    komentar TEXT NOT NULL,
    rekomendasi TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_class_id UUID UNIQUE NOT NULL REFERENCES course_classes(id) ON DELETE CASCADE,
    indeks_kepuasan_mhs NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    persentase_kelulusan NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    kendala_pembelajaran TEXT,
    solusi_rekomendasi TEXT,
    is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cpmk_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES course_evaluations(id) ON DELETE CASCADE,
    kode_cpmk TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    target_ketercapaian NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    realisasi_ketercapaian NUMERIC(5,2) NOT NULL DEFAULT 0.00
);

-- ============================================================
-- G. MODUL 13 — LAYANAN ADUAN MAHASISWA
-- ============================================================

CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_tiket TEXT UNIQUE NOT NULL,
    kategori complaint_category NOT NULL DEFAULT 'AKADEMIK',
    judul TEXT NOT NULL,
    isi_aduan TEXT NOT NULL,
    status complaint_status NOT NULL DEFAULT 'DITERIMA',
    is_sensitif BOOLEAN NOT NULL DEFAULT FALSE,
    petugas_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    tanggal_pengaduan DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('PELAPOR', 'PETUGAS', 'SISTEM')),
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
('a0000000-0000-0000-0000-000000000004', 'DOSEN'),
('a0000000-0000-0000-0000-000000000004', 'KOORDINATOR_KP'),
('a0000000-0000-0000-0000-000000000005', 'MAHASISWA')
ON CONFLICT (user_id, role) DO NOTHING;

-- Periode Akademik Berjalan
INSERT INTO academic_periods (id, tahun_akademik, semester, tanggal_mulai, tanggal_selesai, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', '2024/2025', 'GANJIL', '2024-09-01', '2025-01-31', TRUE)
ON CONFLICT (tahun_akademik, semester) DO NOTHING;

