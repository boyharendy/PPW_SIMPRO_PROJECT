-- ============================================================
-- SIMPRO — Migrasi Modul 2: Beasiswa & Jam Karya Mahasiswa
-- Jalankan di: Supabase SQL Editor
-- (Jalankan SETELAH 20261104_modul1_laporan_perwalian.sql)
-- ============================================================

-- ============================================================
-- Tipe ENUM
-- ============================================================
DO $$ BEGIN
    CREATE TYPE scholarship_status AS ENUM ('AKTIF', 'SELESAI', 'DICABUT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE work_log_status AS ENUM ('MENUNGGU', 'TERVERIFIKASI', 'DITOLAK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE work_log_category AS ENUM (
        'ASISTENSI_LAB',
        'ADMINISTRASI_PRODI',
        'KEPANITIAAN_ACARA',
        'BANTUAN_RISET',
        'LAINNYA'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- Tabel 1: Data Penerima Beasiswa
-- ============================================================
CREATE TABLE IF NOT EXISTS beasiswa_penerima (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mahasiswa_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
    mahasiswa_nim           TEXT NOT NULL,
    mahasiswa_nama          TEXT NOT NULL,
    angkatan                SMALLINT NOT NULL,
    program_studi           TEXT NOT NULL DEFAULT 'Sistem Informasi',
    jenis_beasiswa          TEXT NOT NULL,
    pemberi_beasiswa        TEXT NOT NULL,
    periode                 TEXT NOT NULL,              -- e.g. "2024/2025 Ganjil"
    kewajiban_jam           SMALLINT NOT NULL DEFAULT 50,
    jam_terverifikasi       SMALLINT NOT NULL DEFAULT 0,
    jam_menunggu            SMALLINT NOT NULL DEFAULT 0,
    status                  scholarship_status NOT NULL DEFAULT 'AKTIF',
    dosen_verifikator_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dosen_verifikator_nama  TEXT NOT NULL,
    is_berisiko             BOOLEAN NOT NULL DEFAULT FALSE,
    catatan                 TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabel 2: Log Jam Karya Mahasiswa
-- ============================================================
CREATE TABLE IF NOT EXISTS jam_karya_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    penerima_id             UUID NOT NULL REFERENCES beasiswa_penerima(id) ON DELETE CASCADE,
    mahasiswa_nim           TEXT NOT NULL,
    mahasiswa_nama          TEXT NOT NULL,
    tanggal_kegiatan        DATE NOT NULL,
    kategori                work_log_category NOT NULL DEFAULT 'LAINNYA',
    deskripsi_kegiatan      TEXT NOT NULL,
    jumlah_jam              SMALLINT NOT NULL DEFAULT 1 CHECK (jumlah_jam > 0),
    bukti_nama_berkas       TEXT,
    status                  work_log_status NOT NULL DEFAULT 'MENUNGGU',
    dosen_verifikator_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dosen_verifikator_nama  TEXT,
    catatan_verifikator     TEXT,
    diverifikasi_at         TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Trigger auto-update updated_at
-- ============================================================
DROP TRIGGER IF EXISTS set_updated_at_beasiswa ON beasiswa_penerima;
CREATE TRIGGER set_updated_at_beasiswa
    BEFORE UPDATE ON beasiswa_penerima
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_jam_karya ON jam_karya_logs;
CREATE TRIGGER set_updated_at_jam_karya
    BEFORE UPDATE ON jam_karya_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Function + Trigger: sinkronisasi otomatis jam setelah log diubah
-- ============================================================
CREATE OR REPLACE FUNCTION sync_jam_beasiswa()
RETURNS TRIGGER AS $$
DECLARE
    target_id UUID;
BEGIN
    target_id := COALESCE(NEW.penerima_id, OLD.penerima_id);

    UPDATE beasiswa_penerima SET
        jam_terverifikasi = (
            SELECT COALESCE(SUM(jumlah_jam), 0)
            FROM jam_karya_logs
            WHERE penerima_id = target_id AND status = 'TERVERIFIKASI'
        ),
        jam_menunggu = (
            SELECT COALESCE(SUM(jumlah_jam), 0)
            FROM jam_karya_logs
            WHERE penerima_id = target_id AND status = 'MENUNGGU'
        ),
        is_berisiko = (
            SELECT COALESCE(SUM(CASE WHEN status = 'TERVERIFIKASI' THEN jumlah_jam ELSE 0 END), 0)
                   < (kewajiban_jam * 0.5)
            FROM jam_karya_logs
            WHERE penerima_id = target_id
        )
    WHERE id = target_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_jam ON jam_karya_logs;
CREATE TRIGGER trg_sync_jam
    AFTER INSERT OR UPDATE OR DELETE ON jam_karya_logs
    FOR EACH ROW EXECUTE FUNCTION sync_jam_beasiswa();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE beasiswa_penerima ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_karya_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_beasiswa"
    ON beasiswa_penerima FOR SELECT USING (true);
CREATE POLICY "allow_insert_beasiswa"
    ON beasiswa_penerima FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_beasiswa"
    ON beasiswa_penerima FOR UPDATE USING (true);

CREATE POLICY "allow_select_jam_karya"
    ON jam_karya_logs FOR SELECT USING (true);
CREATE POLICY "allow_insert_jam_karya"
    ON jam_karya_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_jam_karya"
    ON jam_karya_logs FOR UPDATE USING (true);

-- ============================================================
-- Index
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_beasiswa_mahasiswa_nim
    ON beasiswa_penerima (mahasiswa_nim);
CREATE INDEX IF NOT EXISTS idx_beasiswa_status
    ON beasiswa_penerima (status);
CREATE INDEX IF NOT EXISTS idx_beasiswa_periode
    ON beasiswa_penerima (periode);
CREATE INDEX IF NOT EXISTS idx_beasiswa_verifikator
    ON beasiswa_penerima (dosen_verifikator_id);
CREATE INDEX IF NOT EXISTS idx_jam_karya_penerima
    ON jam_karya_logs (penerima_id);
CREATE INDEX IF NOT EXISTS idx_jam_karya_status
    ON jam_karya_logs (status);
CREATE INDEX IF NOT EXISTS idx_jam_karya_tanggal
    ON jam_karya_logs (tanggal_kegiatan DESC);

-- ============================================================
-- Seed Data Awal
-- ============================================================
INSERT INTO beasiswa_penerima
    (mahasiswa_nim, mahasiswa_nama, angkatan, program_studi,
     jenis_beasiswa, pemberi_beasiswa, periode,
     kewajiban_jam, jam_terverifikasi, jam_menunggu,
     status, dosen_verifikator_nama, is_berisiko)
VALUES
    ('220101005', 'Andi Pratama Susilo',  2022, 'Sistem Informasi',
     'KIP Kuliah Merdeka',    'Puslapdik Kemendikbudristek', '2024/2025 Ganjil',
     50, 42,  5,  'AKTIF',   'Dr. Ahmad Fauzi, M.T.',          false),

    ('220101018', 'Citra Maharani',       2022, 'Sistem Informasi',
     'Beasiswa Bank Indonesia','Bank Indonesia',               '2024/2025 Ganjil',
     40, 15,  8,  'AKTIF',   'Siti Rahmawati, M.Kom.',          true),

    ('230201007', 'Farhan Ramadhan',      2023, 'Sistem Informasi',
     'KIP Kuliah Merdeka',    'Puslapdik Kemendikbudristek', '2024/2025 Ganjil',
     50, 50,  0,  'SELESAI', 'Dr. Ahmad Fauzi, M.T.',          false),

    ('230201021', 'Nadia Salsabila',      2023, 'Sistem Informasi',
     'Djarum Beasiswa Plus',  'Djarum Foundation',            '2024/2025 Ganjil',
     60, 28, 10,  'AKTIF',   'Dr. Eng. Hendra Wijaya, M.Sc.', false),

    ('220101033', 'Bagas Prianto',        2022, 'Sistem Informasi',
     'Beasiswa Industri',     'PT. Telkom Indonesia',         '2024/2025 Ganjil',
     30,  5,  0,  'AKTIF',   'Siti Rahmawati, M.Kom.',          true)
ON CONFLICT DO NOTHING;

-- Seed log jam karya (menggunakan sub-select agar tidak bergantung pada UUID statis)
DO $$
DECLARE
    p_andi   UUID;
    p_citra  UUID;
    p_nadia  UUID;
BEGIN
    SELECT id INTO p_andi  FROM beasiswa_penerima WHERE mahasiswa_nim = '220101005' LIMIT 1;
    SELECT id INTO p_citra FROM beasiswa_penerima WHERE mahasiswa_nim = '220101018' LIMIT 1;
    SELECT id INTO p_nadia FROM beasiswa_penerima WHERE mahasiswa_nim = '230201021' LIMIT 1;

    -- Log Andi
    IF p_andi IS NOT NULL THEN
        INSERT INTO jam_karya_logs
            (penerima_id, mahasiswa_nim, mahasiswa_nama, tanggal_kegiatan,
             kategori, deskripsi_kegiatan, jumlah_jam, status,
             dosen_verifikator_nama, diverifikasi_at)
        VALUES
            (p_andi, '220101005', 'Andi Pratama Susilo', '2024-10-01',
             'ASISTENSI_LAB', 'Asistensi Praktikum Basis Data — Lab Komputer A', 8,
             'TERVERIFIKASI', 'Dr. Ahmad Fauzi, M.T.', NOW() - INTERVAL '7 days'),
            (p_andi, '220101005', 'Andi Pratama Susilo', '2024-10-10',
             'KEPANITIAAN_ACARA', 'Kepanitiaan Workshop Cybersecurity Prodi', 6,
             'TERVERIFIKASI', 'Dr. Ahmad Fauzi, M.T.', NOW() - INTERVAL '3 days'),
            (p_andi, '220101005', 'Andi Pratama Susilo', '2024-10-28',
             'ADMINISTRASI_PRODI', 'Input data mahasiswa baru ke sistem SIMPRO', 4,
             'MENUNGGU', NULL, NULL)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Log Citra
    IF p_citra IS NOT NULL THEN
        INSERT INTO jam_karya_logs
            (penerima_id, mahasiswa_nim, mahasiswa_nama, tanggal_kegiatan,
             kategori, deskripsi_kegiatan, jumlah_jam, status,
             dosen_verifikator_nama, catatan_verifikator, diverifikasi_at)
        VALUES
            (p_citra, '220101018', 'Citra Maharani', '2024-10-05',
             'BANTUAN_RISET', 'Pengolahan data survei untuk penelitian dosen', 5,
             'TERVERIFIKASI', 'Siti Rahmawati, M.Kom.', 'Pekerjaan sangat baik dan teliti.', NOW() - INTERVAL '5 days'),
            (p_citra, '220101018', 'Citra Maharani', '2024-10-20',
             'ASISTENSI_LAB', 'Asistensi Pemrograman Web Dasar', 8,
             'MENUNGGU', NULL, NULL, NULL),
            (p_citra, '220101018', 'Citra Maharani', '2024-10-25',
             'KEPANITIAAN_ACARA', 'Seminar Nasional Informatika 2024', 4,
             'MENUNGGU', NULL, NULL, NULL)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Log Nadia
    IF p_nadia IS NOT NULL THEN
        INSERT INTO jam_karya_logs
            (penerima_id, mahasiswa_nim, mahasiswa_nama, tanggal_kegiatan,
             kategori, deskripsi_kegiatan, jumlah_jam, status,
             dosen_verifikator_nama, diverifikasi_at)
        VALUES
            (p_nadia, '230201021', 'Nadia Salsabila', '2024-09-15',
             'ADMINISTRASI_PRODI', 'Pendataan alumni untuk website prodi', 6,
             'TERVERIFIKASI', 'Dr. Eng. Hendra Wijaya, M.Sc.', NOW() - INTERVAL '10 days'),
            (p_nadia, '230201021', 'Nadia Salsabila', '2024-10-03',
             'BANTUAN_RISET', 'Transkripsi wawancara untuk penelitian skripsi dosen', 8,
             'MENUNGGU', NULL, NULL)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
