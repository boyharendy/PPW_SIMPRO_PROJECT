-- ============================================================
-- SIMPRO — Migrasi Modul 1: Laporan Perwalian
-- (Ketua Kelas & Sesi Bimbingan Dosen Wali)
-- Jalankan di: Supabase SQL Editor
-- ============================================================

-- Tipe ENUM
DO $$ BEGIN
    CREATE TYPE perwalian_status AS ENUM ('BELUM', 'DRAF', 'TERKIRIM', 'TERVERIFIKASI');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE perwalian_session_type AS ENUM ('AWAL_SEMESTER', 'TENGAH_SEMESTER', 'AKHIR_SEMESTER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- Tabel 1: Laporan Perwalian Kelas (diisi Ketua Kelas)
-- ============================================================
CREATE TABLE IF NOT EXISTS laporan_perwalian_kelas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kelas                   TEXT NOT NULL,              -- e.g. "SI-2022-A"
    angkatan                SMALLINT NOT NULL,
    semester                semester_type NOT NULL DEFAULT 'GANJIL',
    tahun_akademik          TEXT NOT NULL,              -- e.g. "2024/2025"
    ketua_kelas_nim         TEXT NOT NULL,
    ketua_kelas_nama        TEXT NOT NULL,
    dosen_wali_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dosen_wali_nama         TEXT NOT NULL,
    kondisi_umum            TEXT NOT NULL DEFAULT '',
    kendala_akademik        TEXT NOT NULL DEFAULT '',
    kendala_non_akademik    TEXT NOT NULL DEFAULT '',
    aspirasi_mahasiswa      TEXT NOT NULL DEFAULT '',
    mahasiswa_perhatian     JSONB NOT NULL DEFAULT '[]', -- AttentionStudent[]
    status                  perwalian_status NOT NULL DEFAULT 'BELUM',
    catatan_verifikasi_dosen TEXT,
    diverifikasi_at         TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabel 2: Notulen Sesi Bimbingan Perwalian (diisi Dosen Wali)
-- ============================================================
CREATE TABLE IF NOT EXISTS sesi_bimbingan_perwalian (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dosen_wali_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dosen_wali_nama         TEXT NOT NULL,
    kelas                   TEXT NOT NULL,
    angkatan                SMALLINT NOT NULL,
    semester                semester_type NOT NULL DEFAULT 'GANJIL',
    tahun_akademik          TEXT NOT NULL,
    sesi                    perwalian_session_type NOT NULL DEFAULT 'AWAL_SEMESTER',
    tanggal_sesi            DATE NOT NULL,
    total_mahasiswa         SMALLINT NOT NULL DEFAULT 0,
    hadir_mahasiswa         SMALLINT NOT NULL DEFAULT 0,
    topik_bahasan           TEXT NOT NULL DEFAULT '',
    catatan_per_mahasiswa   JSONB NOT NULL DEFAULT '[]', -- DosenWaliStudentNote[]
    rekomendasi             TEXT NOT NULL DEFAULT '',
    rencana_tindak_lanjut   TEXT NOT NULL DEFAULT '',
    status                  TEXT NOT NULL DEFAULT 'DRAF' CHECK (status IN ('DRAF', 'SELESAI')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Trigger auto-update updated_at
-- ============================================================
DROP TRIGGER IF EXISTS set_updated_at_laporan_perwalian ON laporan_perwalian_kelas;
CREATE TRIGGER set_updated_at_laporan_perwalian
    BEFORE UPDATE ON laporan_perwalian_kelas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_sesi_bimbingan ON sesi_bimbingan_perwalian;
CREATE TRIGGER set_updated_at_sesi_bimbingan
    BEFORE UPDATE ON sesi_bimbingan_perwalian
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE laporan_perwalian_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesi_bimbingan_perwalian ENABLE ROW LEVEL SECURITY;

-- Policy: anon key bisa baca & tulis (autentikasi diatur di level aplikasi)
CREATE POLICY "allow_select_laporan_perwalian"
    ON laporan_perwalian_kelas FOR SELECT USING (true);
CREATE POLICY "allow_insert_laporan_perwalian"
    ON laporan_perwalian_kelas FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_laporan_perwalian"
    ON laporan_perwalian_kelas FOR UPDATE USING (true);

CREATE POLICY "allow_select_sesi_bimbingan"
    ON sesi_bimbingan_perwalian FOR SELECT USING (true);
CREATE POLICY "allow_insert_sesi_bimbingan"
    ON sesi_bimbingan_perwalian FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_sesi_bimbingan"
    ON sesi_bimbingan_perwalian FOR UPDATE USING (true);

-- ============================================================
-- Index
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_laporan_perwalian_kelas
    ON laporan_perwalian_kelas (kelas);
CREATE INDEX IF NOT EXISTS idx_laporan_perwalian_status
    ON laporan_perwalian_kelas (status);
CREATE INDEX IF NOT EXISTS idx_laporan_perwalian_tahun
    ON laporan_perwalian_kelas (tahun_akademik, semester);
CREATE INDEX IF NOT EXISTS idx_sesi_bimbingan_kelas
    ON sesi_bimbingan_perwalian (kelas);
CREATE INDEX IF NOT EXISTS idx_sesi_bimbingan_dosen
    ON sesi_bimbingan_perwalian (dosen_wali_id);
CREATE INDEX IF NOT EXISTS idx_sesi_bimbingan_tahun
    ON sesi_bimbingan_perwalian (tahun_akademik, semester);

-- ============================================================
-- Seed Data Awal
-- ============================================================
INSERT INTO laporan_perwalian_kelas
    (kelas, angkatan, semester, tahun_akademik,
     ketua_kelas_nim, ketua_kelas_nama, dosen_wali_nama,
     kondisi_umum, kendala_akademik, kendala_non_akademik, aspirasi_mahasiswa,
     mahasiswa_perhatian, status)
VALUES
    (
        'IF-2022-A', 2022, 'GANJIL', '2024/2025',
        '220101001', 'Muhammad Farel', 'Dr. Ahmad Fauzi, M.T.',
        'Perkuliahan berjalan lancar. Mayoritas mahasiswa aktif dan antusias.',
        'Beberapa mahasiswa kesulitan memahami materi Basis Data Lanjut dan Kriptografi.',
        'Proyektor ruang B-204 sering mati mendadak sehingga mengganggu presentasi.',
        'Mohon materi perkuliahan diunggah ke portal tepat waktu H-1 sebelum kuliah.',
        '[{"nim":"220101015","nama":"Rizky Amelia","isu":"Kehadiran hanya 55%","persentase_kehadiran":55,"catatan":"Perlu teguran dari dosen wali"},{"nim":"220101028","nama":"Deni Kurniawan","isu":"IPK di bawah 2.5","persentase_kehadiran":80,"catatan":"Perlu bimbingan akademik intensif"}]',
        'TERVERIFIKASI'
    ),
    (
        'SI-2023-B', 2023, 'GANJIL', '2024/2025',
        '230201012', 'Anisa Putri Maharani', 'Siti Rahmawati, M.Kom.',
        'Kondisi kelas baik, namun terdapat beberapa mahasiswa yang kurang aktif diskusi.',
        'Materi Pemrograman Web dirasa terlalu cepat disampaikan.',
        'Tidak ada kendala sarana yang signifikan.',
        'Harap ada sesi review sebelum UTS.',
        '[{"nim":"230201019","nama":"Bagas Prasetyo","isu":"Jarang hadir kuliah online","persentase_kehadiran":60,"catatan":"Sudah dikonfirmasi via WA"}]',
        'TERKIRIM'
    ),
    (
        'SI-2024-A', 2024, 'GANJIL', '2024/2025',
        '240201003', 'Sinta Dewi Rahayu', 'Dr. Eng. Hendra Wijaya, M.Sc.',
        'Mahasiswa angkatan baru masih dalam masa adaptasi. Semangat belajar tinggi.',
        'Belum ada kendala akademik mayor.',
        'Fasilitas laboratorium komputer sudah cukup baik.',
        'Perlu orientasi lebih lanjut tentang sistem perkuliahan.',
        '[]',
        'DRAF'
    )
ON CONFLICT DO NOTHING;

INSERT INTO sesi_bimbingan_perwalian
    (dosen_wali_nama, kelas, angkatan, semester, tahun_akademik, sesi,
     tanggal_sesi, total_mahasiswa, hadir_mahasiswa, topik_bahasan,
     catatan_per_mahasiswa, rekomendasi, rencana_tindak_lanjut, status)
VALUES
    (
        'Dr. Ahmad Fauzi, M.T.', 'IF-2022-A', 2022, 'GANJIL', '2024/2025', 'TENGAH_SEMESTER',
        '2024-10-15', 35, 33,
        'Evaluasi Kemajuan Akademik dan Bimbingan Rencana Studi Semester',
        '[{"nim":"220101001","nama":"Muhammad Farel","catatan":"Perkembangan studi sangat baik, IPK memuaskan.","status_akademik":"Lancar","hadir":true},{"nim":"220101015","nama":"Rizky Amelia","catatan":"Kehadiran rendah, perlu perhatian khusus.","status_akademik":"Perlu Monitoring","hadir":false}]',
        'Tingkatkan keterlibatan mahasiswa dalam kegiatan akademik dan pengayaan.',
        'Konsultasi lanjutan terjadwal pada pekan ke-12 perkuliahan.',
        'SELESAI'
    ),
    (
        'Siti Rahmawati, M.Kom.', 'SI-2023-B', 2023, 'GANJIL', '2024/2025', 'AWAL_SEMESTER',
        '2024-09-05', 32, 30,
        'Orientasi Semester Ganjil dan Pembahasan Target Akademik',
        '[{"nim":"230201012","nama":"Anisa Putri Maharani","catatan":"Aktif dan berprestasi, potensi ketua kelas sangat baik.","status_akademik":"Lancar","hadir":true}]',
        'Mahasiswa diminta membuat rencana studi pribadi dan berkonsultasi rutin.',
        'Jadwal konsultasi individu dibuka setiap Jumat pukul 13.00–15.00.',
        'SELESAI'
    )
ON CONFLICT DO NOTHING;
