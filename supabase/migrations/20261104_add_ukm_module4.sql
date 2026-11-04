-- ============================================================
-- SIMPRO - Migration Modul 4: Unit Kegiatan Mahasiswa (UKM)
-- Sesuai Spesifikasi Kebutuhan: FR-14 s/d FR-16 & Rekap Partisipasi
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABEL DIREKTORI UKM (FR-14 & FR-16)
-- Direktori resmi Unit Kegiatan Mahasiswa binaan program studi
-- meliputi profil, pembina, ketua, kategori, dan jadwal rutin.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ukm_directories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_ukm VARCHAR(50) UNIQUE NOT NULL,
    nama_ukm VARCHAR(255) NOT NULL,
    kategori VARCHAR(50) NOT NULL 
        CHECK (kategori IN ('OLAHRAGA', 'SENI', 'KEAGAMAAN', 'PENALARAN', 'SOSIAL', 'KHUSUS')),
    dosen_pembina_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dosen_pembina_nama VARCHAR(255) NOT NULL,
    ketua_nim VARCHAR(30) NOT NULL,
    ketua_nama VARCHAR(255) NOT NULL,
    kontak_email VARCHAR(100),
    kontak_telepon VARCHAR(50),
    kontak_instagram VARCHAR(100),
    deskripsi TEXT,
    jadwal_rutin TEXT,
    status_aktif VARCHAR(30) NOT NULL DEFAULT 'AKTIF' 
        CHECK (status_aktif IN ('AKTIF', 'NONAKTIF')),
    jumlah_anggota_aktif INT NOT NULL DEFAULT 0 CHECK (jumlah_anggota_aktif >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pencarian direktori UKM
CREATE INDEX IF NOT EXISTS idx_ukm_directories_kode ON ukm_directories(kode_ukm);
CREATE INDEX IF NOT EXISTS idx_ukm_directories_kategori ON ukm_directories(kategori);
CREATE INDEX IF NOT EXISTS idx_ukm_directories_status ON ukm_directories(status_aktif);

-- ------------------------------------------------------------
-- 2. TABEL PENDAFTARAN & KEANGGOTAAN UKM (FR-15)
-- Pencatatan anggota dan pengurus UKM mahasiswa per periode,
-- serta validasi verifikasi oleh Dosen Pembina UKM.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ukm_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ukm_id UUID NOT NULL REFERENCES ukm_directories(id) ON DELETE CASCADE,
    ukm_nama VARCHAR(255) NOT NULL,
    mahasiswa_nim VARCHAR(30) NOT NULL,
    mahasiswa_nama VARCHAR(255) NOT NULL,
    angkatan INT NOT NULL DEFAULT 2023,
    jabatan VARCHAR(50) NOT NULL DEFAULT 'ANGGOTA' 
        CHECK (jabatan IN ('KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'BENDAHARA', 'KORDINATOR_DIVISI', 'ANGGOTA')),
    periode_kepengurusan VARCHAR(30) NOT NULL DEFAULT '2024/2025',
    status VARCHAR(30) NOT NULL DEFAULT 'MENUNGGU' 
        CHECK (status IN ('MENUNGGU', 'TERVERIFIKASI', 'DITOLAK')),
    diverifikasi_oleh VARCHAR(255),
    diverifikasi_at TIMESTAMPTZ,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index relasi keanggotaan mahasiswa dan UKM
CREATE INDEX IF NOT EXISTS idx_ukm_memberships_ukm_id ON ukm_memberships(ukm_id);
CREATE INDEX IF NOT EXISTS idx_ukm_memberships_nim ON ukm_memberships(mahasiswa_nim);
CREATE INDEX IF NOT EXISTS idx_ukm_memberships_status ON ukm_memberships(status);
CREATE INDEX IF NOT EXISTS idx_ukm_memberships_angkatan ON ukm_memberships(angkatan);

-- ------------------------------------------------------------
-- 3. TABEL REKAPITULASI PARTISIPASI MAHASISWA PER ANGKATAN (FR-16)
-- Agregasi keterlibatan mahasiswa aktif UKM per tahun angkatan
-- untuk kebutuhan evaluasi IKU akreditasi program studi.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ukm_participation_stats (
    angkatan INT PRIMARY KEY,
    total_mahasiswa_angkatan INT NOT NULL DEFAULT 0 CHECK (total_mahasiswa_angkatan >= 0),
    mahasiswa_aktif_ukm INT NOT NULL DEFAULT 0 CHECK (mahasiswa_aktif_ukm >= 0),
    persentase_aktif NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (persentase_aktif >= 0 AND persentase_aktif <= 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. TRIGGER SINKRONISASI ANGGOTA AKTIF UKM OTOMATIS
-- Menghitung jumlah anggota terverifikasi yang unik untuk UKM
-- dan memperbarui kolom jumlah_anggota_aktif pada ukm_directories.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_ukm_active_members()
RETURNS TRIGGER AS $$
DECLARE
    target_ukm_id UUID;
    total_verified_members INT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_ukm_id := OLD.ukm_id;
    ELSE
        target_ukm_id := NEW.ukm_id;
    END IF;

    -- Hitung total anggota unik yang berstatus TERVERIFIKASI
    SELECT COUNT(DISTINCT mahasiswa_nim)
    INTO total_verified_members
    FROM ukm_memberships
    WHERE ukm_id = target_ukm_id AND status = 'TERVERIFIKASI';

    -- Update tabel ukm_directories
    UPDATE ukm_directories
    SET jumlah_anggota_aktif = total_verified_members,
        updated_at = NOW()
    WHERE id = target_ukm_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ukm_active_members ON ukm_memberships;
CREATE TRIGGER trg_sync_ukm_active_members
AFTER INSERT OR UPDATE OF status, ukm_id, mahasiswa_nim OR DELETE
ON ukm_memberships
FOR EACH ROW
EXECUTE FUNCTION sync_ukm_active_members();

-- ------------------------------------------------------------
-- 5. SEED DATA AWAL MODUL 4
-- ------------------------------------------------------------
-- Direktori UKM:
-- 1. CSFC (Penalaran)
-- 2. SIBC (Olahraga)
-- 3. SIMPRO Arts (Seni)
-- 4. KAMIS (Keagamaan)
INSERT INTO ukm_directories (
    id, kode_ukm, nama_ukm, kategori, dosen_pembina_id, dosen_pembina_nama,
    ketua_nim, ketua_nama, kontak_email, kontak_telepon, kontak_instagram,
    deskripsi, jadwal_rutin, status_aktif, jumlah_anggota_aktif, created_at
) VALUES
(
    'b4000000-0000-0000-0000-000000000001',
    'UKM-PEN-01',
    'Cyber Security & Forensic Community (CSFC)',
    'PENALARAN',
    'a0000000-0000-0000-0000-000000000001',
    'Dr. Ahmad Fauzi, M.T.',
    '220101030',
    'Reza Pratama',
    'csfc@univ.ac.id',
    '081234567801',
    '@csfc.univ',
    'Wadah eksplorasi keamanan siber, ethical hacking, CTF, dan digital forensics bagi mahasiswa.',
    'Setiap Sabtu pukul 10:00 WIB di Lab Cyber & Cloud',
    'AKTIF',
    48,
    '2023-01-15T00:00:00Z'
),
(
    'b4000000-0000-0000-0000-000000000002',
    'UKM-OLA-02',
    'Sistem Informasi Badminton Club (SIBC)',
    'OLAHRAGA',
    'a0000000-0000-0000-0000-000000000004',
    'Ir. Hendra Wijaya, M.Sc.',
    '230201012',
    'Gilang Ramadhan',
    'sibc@univ.ac.id',
    '081234567802',
    '@sibc_official',
    'Membangun kebugaran fisik, sportivitas, dan solidaritas mahasiswa prodi lewat olahraga bulutangkis.',
    'Selasa & Kamis pukul 18:00 WIB di Hall Olahraga Utama',
    'AKTIF',
    32,
    '2023-02-01T00:00:00Z'
),
(
    'b4000000-0000-0000-0000-000000000003',
    'UKM-SEN-03',
    'SIMPRO Acoustic & Creative Arts Club',
    'SENI',
    'a0000000-0000-0000-0000-000000000002',
    'Dr. Siti Nurhaliza, M.Kom.',
    '230201050',
    'Tiara Andini',
    'creative.arts@univ.ac.id',
    '081234567803',
    '@simpro_arts',
    'Pengembangan minat bakat seni musik akustik, fotografi, dan videografi dokumenter prodi.',
    'Jumat pukul 16:00 WIB di Selasar Kreatif',
    'AKTIF',
    25,
    '2023-03-10T00:00:00Z'
),
(
    'b4000000-0000-0000-0000-000000000004',
    'UKM-KEA-04',
    'Keluarga Mahasiswa Islam SI (KAMIS)',
    'KEAGAMAAN',
    'a0000000-0000-0000-0000-000000000001',
    'Dr. Ahmad Fauzi, M.T.',
    '220101011',
    'Farhan Maulana',
    'kamis@univ.ac.id',
    '081234567804',
    '@kamis_si',
    'Pembinaan akhlak, kajian keislaman kontemporer, dan kegiatan sosial kepedulian masyarakat.',
    'Rabu Ba''da Ashar di Musholla Al-Hikmah Prodi',
    'AKTIF',
    60,
    '2023-01-20T00:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Data Pendaftaran & Keanggotaan UKM
INSERT INTO ukm_memberships (
    id, ukm_id, ukm_nama, mahasiswa_nim, mahasiswa_nama, angkatan,
    jabatan, periode_kepengurusan, status, diverifikasi_oleh,
    diverifikasi_at, catatan, created_at
) VALUES
(
    'b4100000-0000-0000-0000-000000000001',
    'b4000000-0000-0000-0000-000000000001',
    'Cyber Security & Forensic Community (CSFC)',
    '220101001',
    'Muhammad Farel',
    2022,
    'KORDINATOR_DIVISI',
    '2024/2025',
    'TERVERIFIKASI',
    'Dr. Ahmad Fauzi, M.T.',
    '2024-09-10T10:00:00Z',
    'Keanggotaan dan struktur kepengurusan divisi terverifikasi.',
    '2024-09-05T08:00:00Z'
),
(
    'b4100000-0000-0000-0000-000000000002',
    'b4000000-0000-0000-0000-000000000002',
    'Sistem Informasi Badminton Club (SIBC)',
    '230201045',
    'Anisa Putri Maharani',
    2023,
    'BENDAHARA',
    '2024/2025',
    'TERVERIFIKASI',
    'Ir. Hendra Wijaya, M.Sc.',
    '2024-09-12T14:00:00Z',
    'Keanggotaan disahkan sebagai pengurus bendahara.',
    '2024-09-08T09:00:00Z'
),
(
    'b4100000-0000-0000-0000-000000000003',
    'b4000000-0000-0000-0000-000000000001',
    'Cyber Security & Forensic Community (CSFC)',
    '230201018',
    'Fajar Nugraha',
    2023,
    'ANGGOTA',
    '2024/2025',
    'MENUNGGU',
    NULL,
    NULL,
    NULL,
    '2024-10-18T11:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Data Rekapitulasi Partisipasi Angkatan
INSERT INTO ukm_participation_stats (
    angkatan, total_mahasiswa_angkatan, mahasiswa_aktif_ukm, persentase_aktif, updated_at
) VALUES
(2021, 85, 68, 80.00, NOW()),
(2022, 92, 78, 85.00, NOW()),
(2023, 96, 74, 77.00, NOW()),
(2024, 75, 52, 69.00, NOW())
ON CONFLICT (angkatan) DO UPDATE
SET total_mahasiswa_angkatan = EXCLUDED.total_mahasiswa_angkatan,
    mahasiswa_aktif_ukm = EXCLUDED.mahasiswa_aktif_ukm,
    persentase_aktif = EXCLUDED.persentase_aktif,
    updated_at = NOW();

