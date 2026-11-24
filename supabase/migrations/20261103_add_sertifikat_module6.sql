-- ============================================================
-- SIMPRO - Migration Modul 6: Sertifikat Bahasa dan Sertifikat Profesi
-- Spesifikasi Kebutuhan: FR-23 s/d FR-25, NF-01, NF-06, NF-08, NF-09
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABEL SERTIFIKAT MAHASISWA (FR-23, FR-24, FR-25)
-- Menyimpan pengunggahan sertifikat bahasa asing (TOEFL, IELTS,
-- TOEIC, JLPT) dan sertifikasi profesi/kompetensi industri.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mahasiswa_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mahasiswa_nim VARCHAR(30) NOT NULL,
    mahasiswa_nama VARCHAR(255) NOT NULL,
    angkatan INT NOT NULL,
    kategori VARCHAR(50) NOT NULL 
        CHECK (kategori IN ('BAHASA', 'PROFESI_KOMPETENSI')),
    jenis_sertifikasi VARCHAR(255) NOT NULL,
    lembaga_penerbit VARCHAR(255) NOT NULL,
    nomor_sertifikat VARCHAR(100) NOT NULL,
    skor_level VARCHAR(100) NOT NULL,
    nilai_numerik NUMERIC(8,2),
    tanggal_terbit DATE NOT NULL,
    tanggal_kedaluwarsa DATE,
    is_seumur_hidup BOOLEAN NOT NULL DEFAULT FALSE,
    berkas_url TEXT,
    berkas_nama VARCHAR(255),
    berkas_ukuran INT, -- dalam bytes
    status VARCHAR(30) NOT NULL DEFAULT 'DRAF' 
        CHECK (status IN ('DRAF', 'MENUNGGU', 'TERVERIFIKASI', 'DITOLAK')),
    alasan_penolakan TEXT,
    catatan_perbaikan TEXT,
    diverifikasi_oleh_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    diverifikasi_oleh VARCHAR(255),
    diverifikasi_at TIMESTAMPTZ,
    notifikasi_kedaluwarsa_terkirim BOOLEAN NOT NULL DEFAULT FALSE,
    tanggal_notifikasi_kedaluwarsa TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks performa pencarian dan filter
CREATE INDEX IF NOT EXISTS idx_cert_mahasiswa_nim ON student_certificates(mahasiswa_nim);
CREATE INDEX IF NOT EXISTS idx_cert_kategori ON student_certificates(kategori);
CREATE INDEX IF NOT EXISTS idx_cert_status ON student_certificates(status);
CREATE INDEX IF NOT EXISTS idx_cert_angkatan ON student_certificates(angkatan);
CREATE INDEX IF NOT EXISTS idx_cert_tanggal_kedaluwarsa ON student_certificates(tanggal_kedaluwarsa);
CREATE INDEX IF NOT EXISTS idx_cert_nomor ON student_certificates(nomor_sertifikat);

-- ------------------------------------------------------------
-- 2. TABEL STATISTIK & REKAPITULASI SERTIFIKAT PER ANGKATAN (FR-25)
-- Agregasi jumlah & persentase mahasiswa tersertifikasi
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_batch_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    angkatan INT NOT NULL UNIQUE,
    total_mahasiswa INT NOT NULL DEFAULT 0 CHECK (total_mahasiswa >= 0),
    mahasiswa_memiliki_sertifikat INT NOT NULL DEFAULT 0 CHECK (mahasiswa_memiliki_sertifikat >= 0),
    total_sertifikat_terverifikasi INT NOT NULL DEFAULT 0 CHECK (total_sertifikat_terverifikasi >= 0),
    sertifikat_bahasa INT NOT NULL DEFAULT 0 CHECK (sertifikat_bahasa >= 0),
    sertifikat_profesi INT NOT NULL DEFAULT 0 CHECK (sertifikat_profesi >= 0),
    persentase_kepemilikan NUMERIC(5,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. TABEL LOG AUDIT VERIFIKASI & PERUBAHAN STATUS (NF-09)
-- Mencatat seluruh riwayat aksi (draf, ajukan, verifikasi, tolak)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES student_certificates(id) ON DELETE CASCADE,
    aksi VARCHAR(50) NOT NULL,
    aktor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    aktor_nama VARCHAR(255) NOT NULL,
    aktor_role VARCHAR(50) NOT NULL,
    status_lama VARCHAR(30),
    status_baru VARCHAR(30),
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_audit_cert_id ON certificate_audit_logs(certificate_id);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Mahasiswa hanya melihat datanya sendiri (NF-02),
-- Dosen Verifikator & Kaprodi dapat meninjau seluruh sertifikat.
-- ------------------------------------------------------------
ALTER TABLE student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_batch_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_audit_logs ENABLE ROW LEVEL SECURITY;

-- Mahasiswa melihat dan mengelola sertifikat miliknya sendiri
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mahasiswa view own certificates') THEN
        CREATE POLICY "Mahasiswa view own certificates"
            ON student_certificates FOR SELECT
            TO authenticated
            USING (auth.uid() = mahasiswa_id OR auth.jwt() ->> 'role' IN ('DOSEN', 'DOSEN_VERIFIKATOR', 'KAPRODI', 'ADMIN'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mahasiswa insert own certificates') THEN
        CREATE POLICY "Mahasiswa insert own certificates"
            ON student_certificates FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = mahasiswa_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mahasiswa update own unverified certificates') THEN
        CREATE POLICY "Mahasiswa update own unverified certificates"
            ON student_certificates FOR UPDATE
            TO authenticated
            USING (auth.uid() = mahasiswa_id AND status IN ('DRAF', 'DITOLAK'))
            WITH CHECK (auth.uid() = mahasiswa_id AND status IN ('DRAF', 'MENUNGGU'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Dosen Verifikator & Kaprodi manage certificates') THEN
        CREATE POLICY "Dosen Verifikator & Kaprodi manage certificates"
            ON student_certificates FOR ALL
            TO authenticated
            USING (auth.jwt() ->> 'role' IN ('DOSEN', 'DOSEN_VERIFIKATOR', 'KAPRODI', 'ADMIN'))
            WITH CHECK (auth.jwt() ->> 'role' IN ('DOSEN', 'DOSEN_VERIFIKATOR', 'KAPRODI', 'ADMIN'));
    END IF;

    -- Batch stats readable by authenticated users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated view batch stats') THEN
        CREATE POLICY "Authenticated view batch stats"
            ON certificate_batch_stats FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    -- Audit logs readable by staff
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff view certificate audit logs') THEN
        CREATE POLICY "Staff view certificate audit logs"
            ON certificate_audit_logs FOR SELECT
            TO authenticated
            USING (auth.jwt() ->> 'role' IN ('DOSEN', 'DOSEN_VERIFIKATOR', 'KAPRODI', 'ADMIN'));
    END IF;
END $$;

-- ------------------------------------------------------------
-- 5. INITIAL SEED DATA
-- Contoh data awal sertifikat mahasiswa bahasa dan profesi
-- ------------------------------------------------------------
INSERT INTO student_certificates (
    id, mahasiswa_nim, mahasiswa_nama, angkatan, kategori,
    jenis_sertifikasi, lembaga_penerbit, nomor_sertifikat, skor_level, nilai_numerik,
    tanggal_terbit, tanggal_kedaluwarsa, is_seumur_hidup, berkas_url, berkas_nama,
    status, diverifikasi_oleh, diverifikasi_at, created_at
) VALUES
(
    'c6000000-0000-0000-0000-000000000001',
    '220101001',
    'Muhammad Farel',
    2022,
    'BAHASA',
    'TOEFL ITP (Institutional Testing Program)',
    'ETS - Indonesian International Education Foundation (IIEF)',
    'ETS-ITP-2024-88912',
    '587',
    587.00,
    '2024-02-15',
    '2026-02-15',
    FALSE,
    '/docs/sertifikat-toefl-farel.pdf',
    'sertifikat-toefl-farel.pdf',
    'TERVERIFIKASI',
    'Dr. Ahmad Fauzi, M.T. (Dosen Verifikator)',
    '2024-02-20T10:00:00Z',
    '2024-02-18T09:00:00Z'
),
(
    'c6000000-0000-0000-0000-000000000002',
    '220101020',
    'Dewi Lestari',
    2022,
    'PROFESI_KOMPETENSI',
    'AWS Certified Cloud Practitioner (CLF-C02)',
    'Amazon Web Services Training & Certification',
    'AWS-CCP-992138',
    'Pass (Score: 840/1000)',
    840.00,
    '2023-11-10',
    '2026-11-10',
    FALSE,
    '/docs/sertifikat-aws-dewi.pdf',
    'sertifikat-aws-dewi.pdf',
    'TERVERIFIKASI',
    'Dr. Ahmad Fauzi, M.T. (Dosen Verifikator)',
    '2023-11-15T14:00:00Z',
    '2023-11-12T11:00:00Z'
),
(
    'c6000000-0000-0000-0000-000000000003',
    '230201018',
    'Fajar Nugraha',
    2023,
    'BAHASA',
    'IELTS Academic',
    'British Council Indonesia Foundation',
    'IELTS-JKT-2024-44120',
    'Band 7.5',
    7.50,
    '2024-01-20',
    '2026-01-20',
    FALSE,
    '/docs/sertifikat-ielts-fajar.pdf',
    'sertifikat-ielts-fajar.pdf',
    'TERVERIFIKASI',
    'Dr. Ahmad Fauzi, M.T. (Dosen Verifikator)',
    '2024-01-25T11:30:00Z',
    '2024-01-22T08:30:00Z'
),
(
    'c6000000-0000-0000-0000-000000000004',
    '230201045',
    'Rina Anggraini',
    2023,
    'PROFESI_KOMPETENSI',
    'Sertifikasi Kompetensi BNSP - Junior Web Developer',
    'Badan Nasional Sertifikasi Profesi (BNSP)',
    'BNSP-TI-JWD-2024-00129',
    'Kompeten',
    NULL,
    '2024-06-12',
    '2027-06-12',
    FALSE,
    '/docs/sertifikat-bnsp-rina.pdf',
    'sertifikat-bnsp-rina.pdf',
    'MENUNGGU',
    NULL,
    NULL,
    '2024-06-15T10:00:00Z'
),
(
    'c6000000-0000-0000-0000-000000000005',
    '210101033',
    'Budi Santoso',
    2021,
    'BAHASA',
    'TOEIC Listening and Reading',
    'International Test Center (ITC) Indonesia',
    'TOEIC-ID-2023-77192',
    '785',
    785.00,
    '2023-03-10',
    '2025-03-10',
    FALSE,
    '/docs/sertifikat-toeic-budi.pdf',
    'sertifikat-toeic-budi.pdf',
    'TERVERIFIKASI',
    'Dr. Ahmad Fauzi, M.T. (Dosen Verifikator)',
    '2023-03-15T09:00:00Z',
    '2023-03-12T14:20:00Z'
),
(
    'c6000000-0000-0000-0000-000000000006',
    '240101012',
    'Anisa Rahmawati',
    2024,
    'BAHASA',
    'JLPT N3 (Japanese-Language Proficiency Test)',
    'The Japan Foundation & JEES',
    'JLPT-2024-N3-90812',
    'Passed (124/180)',
    124.00,
    '2024-08-05',
    NULL,
    TRUE,
    '/docs/sertifikat-jlpt-anisa.pdf',
    'sertifikat-jlpt-anisa.pdf',
    'MENUNGGU',
    NULL,
    NULL,
    '2024-08-10T16:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Data Rekapitulasi Partisipasi Angkatan
INSERT INTO certificate_batch_stats (
    angkatan, total_mahasiswa, mahasiswa_memiliki_sertifikat,
    total_sertifikat_terverifikasi, sertifikat_bahasa, sertifikat_profesi,
    persentase_kepemilikan, updated_at
) VALUES
(2021, 85, 72, 89, 58, 31, 84.71, NOW()),
(2022, 92, 75, 94, 62, 32, 81.52, NOW()),
(2023, 96, 64, 71, 48, 23, 66.67, NOW()),
(2024, 75, 28, 30, 22, 8, 37.33, NOW())
ON CONFLICT (angkatan) DO UPDATE
SET total_mahasiswa = EXCLUDED.total_mahasiswa,
    mahasiswa_memiliki_sertifikat = EXCLUDED.mahasiswa_memiliki_sertifikat,
    total_sertifikat_terverifikasi = EXCLUDED.total_sertifikat_terverifikasi,
    sertifikat_bahasa = EXCLUDED.sertifikat_bahasa,
    sertifikat_profesi = EXCLUDED.sertifikat_profesi,
    persentase_kepemilikan = EXCLUDED.persentase_kepemilikan,
    updated_at = NOW();
