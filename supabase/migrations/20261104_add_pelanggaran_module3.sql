-- ============================================================
-- SIMPRO - Migration Modul 3: Pelanggaran dan Sanksi Sosial
-- Sesuai Spesifikasi Kebutuhan: FR-09 s/d FR-13 & UU PDP No. 27/2022
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABEL KASUS PELANGGARAN MAHASISWA (FR-09 & FR-12)
-- Mencatat kasus pelanggaran akademik/non-akademik/kode etik,
-- nomor berita acara keputusan, dan alokasi total jam sanksi sosial.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mahasiswa_nim VARCHAR(30) NOT NULL,
    mahasiswa_nama VARCHAR(255) NOT NULL,
    angkatan INT NOT NULL DEFAULT 2023,
    status_mahasiswa VARCHAR(30) NOT NULL DEFAULT 'AKTIF' 
        CHECK (status_mahasiswa IN ('AKTIF', 'CUTI', 'LULUS', 'KELUAR', 'MENGUNDURKAN_DIRI')),
    tanggal_pelanggaran DATE NOT NULL DEFAULT CURRENT_DATE,
    jenis_pelanggaran VARCHAR(50) NOT NULL 
        CHECK (jenis_pelanggaran IN ('AKADEMIK', 'NON_AKADEMIK', 'KODE_ETIK')),
    tingkat VARCHAR(30) NOT NULL 
        CHECK (tingkat IN ('RINGAN', 'SEDANG', 'BERAT')),
    judul_kasus TEXT NOT NULL,
    uraian TEXT NOT NULL,
    dasar_keputusan VARCHAR(150) NOT NULL,
    total_jam_sanksi INT NOT NULL DEFAULT 0 CHECK (total_jam_sanksi >= 0),
    jam_sanksi_terpenuhi INT NOT NULL DEFAULT 0 CHECK (jam_sanksi_terpenuhi >= 0),
    status_sanksi VARCHAR(30) NOT NULL DEFAULT 'BELUM_DIMULAI' 
        CHECK (status_sanksi IN ('BELUM_DIMULAI', 'DALAM_PROSES', 'SELESAI')),
    dosen_pencatat_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dosen_pencatat_nama VARCHAR(255),
    dosen_wali_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dosen_wali_nama VARCHAR(255),
    dosen_verifikator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dosen_verifikator_nama VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index performa pencarian kasus pelanggaran
CREATE INDEX IF NOT EXISTS idx_student_violations_nim ON student_violations(mahasiswa_nim);
CREATE INDEX IF NOT EXISTS idx_student_violations_status ON student_violations(status_sanksi);
CREATE INDEX IF NOT EXISTS idx_student_violations_jenis ON student_violations(jenis_pelanggaran);

-- ------------------------------------------------------------
-- 2. TABEL LOG AKTIVITAS SANKSI SOSIAL (FR-10 & FR-11)
-- Pencatatan kegiatan kerja sosial mandiri oleh mahasiswa dan
-- proses verifikasi/validasi oleh Dosen Wali / Kaprodi.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sanction_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_id UUID NOT NULL REFERENCES student_violations(id) ON DELETE CASCADE,
    mahasiswa_nim VARCHAR(30) NOT NULL,
    mahasiswa_nama VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    durasi_jam INT NOT NULL DEFAULT 1 CHECK (durasi_jam > 0),
    lokasi TEXT NOT NULL,
    uraian_kegiatan TEXT NOT NULL,
    bukti_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'MENUNGGU' 
        CHECK (status IN ('MENUNGGU', 'TERVERIFIKASI', 'DITOLAK')),
    catatan_verifikator TEXT,
    diverifikasi_oleh VARCHAR(255),
    diverifikasi_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index relasi log aktivitas ke kasus pelanggaran dan mahasiswa
CREATE INDEX IF NOT EXISTS idx_sanction_logs_violation_id ON sanction_activity_logs(violation_id);
CREATE INDEX IF NOT EXISTS idx_sanction_logs_nim ON sanction_activity_logs(mahasiswa_nim);
CREATE INDEX IF NOT EXISTS idx_sanction_logs_status ON sanction_activity_logs(status);

-- ------------------------------------------------------------
-- 3. TABEL AUDIT LOG RETENSI PELANGGARAN (FR-13 & UU PDP No. 27/2022)
-- Menampung log audit saat rekaman pelanggaran mahasiswa yang telah
-- lulus/keluar dihapus secara permanen untuk mematuhi privasi data.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS violation_retention_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal_hapus TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    alasan_status VARCHAR(50) NOT NULL 
        CHECK (alasan_status IN ('LULUS', 'KELUAR', 'MENGUNDURKAN_DIRI')),
    mahasiswa_hash VARCHAR(100) NOT NULL,
    operator VARCHAR(255) NOT NULL,
    catatan_audit TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violation_retention_tanggal ON violation_retention_logs(tanggal_hapus);

-- ------------------------------------------------------------
-- 4. TRIGGER SINKRONISASI JAM SANKSI & STATUS KASUS OTOMATIS
-- Menghitung akumulasi jam sanksi yang berstatus 'TERVERIFIKASI'
-- dan memperbarui status_sanksi pada tabel student_violations.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_sanction_hours_and_status()
RETURNS TRIGGER AS $$
DECLARE
    target_violation_id UUID;
    total_verified INT;
    required_hours INT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_violation_id := OLD.violation_id;
    ELSE
        target_violation_id := NEW.violation_id;
    END IF;

    -- Hitung total jam terverifikasi saat ini
    SELECT COALESCE(SUM(durasi_jam), 0)
    INTO total_verified
    FROM sanction_activity_logs
    WHERE violation_id = target_violation_id AND status = 'TERVERIFIKASI';

    -- Ambil target total jam sanksi kasus
    SELECT total_jam_sanksi
    INTO required_hours
    FROM student_violations
    WHERE id = target_violation_id;

    -- Update tabel student_violations
    UPDATE student_violations
    SET jam_sanksi_terpenuhi = total_verified,
        status_sanksi = CASE 
            WHEN total_verified >= required_hours AND required_hours > 0 THEN 'SELESAI'
            WHEN total_verified > 0 THEN 'DALAM_PROSES'
            ELSE 'BELUM_DIMULAI'
        END,
        updated_at = NOW()
    WHERE id = target_violation_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_sanction_hours ON sanction_activity_logs;
CREATE TRIGGER trg_sync_sanction_hours
AFTER INSERT OR UPDATE OF status, durasi_jam, violation_id OR DELETE
ON sanction_activity_logs
FOR EACH ROW
EXECUTE FUNCTION sync_sanction_hours_and_status();

-- ------------------------------------------------------------
-- 5. SEED DATA AWAL MODUL 3
-- ------------------------------------------------------------
-- Kasus 1: Budi Darmawan (Plagiarisme Kode Sumber Tugas Besar - 20 Jam)
-- Kasus 2: Aditya Bagus (Merokok di Koridor Bebas Rokok - 8 Jam)
INSERT INTO student_violations (
    id, mahasiswa_nim, mahasiswa_nama, angkatan, status_mahasiswa,
    tanggal_pelanggaran, jenis_pelanggaran, tingkat, judul_kasus, uraian,
    dasar_keputusan, total_jam_sanksi, jam_sanksi_terpenuhi, status_sanksi,
    dosen_pencatat_id, dosen_pencatat_nama, dosen_wali_id, dosen_wali_nama,
    dosen_verifikator_id, dosen_verifikator_nama, created_at
) VALUES
(
    'b3000000-0000-0000-0000-000000000001',
    '220101088',
    'Budi Darmawan',
    2022,
    'AKTIF',
    '2024-10-05',
    'AKADEMIK',
    'SEDANG',
    'Plagiarisme Kode Sumber Tugas Besar Mata Kuliah Pemrograman Web',
    'Terbukti menyalin lebih dari 80% kode proyek akhir dari repositori publik tanpa sitasi dan pengakuan.',
    'BA-KOMISI-ETIK/2024/X/012',
    20,
    12,
    'DALAM_PROSES',
    'a0000000-0000-0000-0000-000000000001',
    'Dr. Ahmad Fauzi, M.T.',
    'a0000000-0000-0000-0000-000000000001',
    'Dr. Ahmad Fauzi, M.T.',
    'a0000000-0000-0000-0000-000000000001',
    'Dr. Ahmad Fauzi, M.T.',
    '2024-10-06T10:00:00Z'
),
(
    'b3000000-0000-0000-0000-000000000002',
    '230201099',
    'Aditya Bagus',
    2023,
    'AKTIF',
    '2024-09-20',
    'NON_AKADEMIK',
    'RINGAN',
    'Merokok di Koridor Bebas Asap Rokok Gedung Laboratorium Komputer',
    'Melanggar tata tertib kawasan kampus bebas rokok pada saat jam perkuliahan berlangsung.',
    'BA-KEMAHASISWAAN/2024/IX/003',
    8,
    8,
    'SELESAI',
    'a0000000-0000-0000-0000-000000000002',
    'Dr. Siti Nurhaliza, M.Kom.',
    'a0000000-0000-0000-0000-000000000002',
    'Dr. Siti Nurhaliza, M.Kom.',
    'a0000000-0000-0000-0000-000000000002',
    'Dr. Siti Nurhaliza, M.Kom.',
    '2024-09-21T08:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Log Kegiatan Sanksi Sosial
INSERT INTO sanction_activity_logs (
    id, violation_id, mahasiswa_nim, mahasiswa_nama, tanggal, durasi_jam,
    lokasi, uraian_kegiatan, bukti_url, status, catatan_verifikator,
    diverifikasi_oleh, diverifikasi_at, created_at
) VALUES
(
    'b3100000-0000-0000-0000-000000000001',
    'b3000000-0000-0000-0000-000000000001',
    '220101088',
    'Budi Darmawan',
    '2024-10-15',
    6,
    'Perpustakaan Pusat Kampus',
    'Membantu penataan kembali rak koleksi buku teknologi informasi dan scanning kartu anggota perpustakaan.',
    '/docs/bukti-sanksi-budi-1.pdf',
    'TERVERIFIKASI',
    'Dikonfirmasi oleh Kepala Perpustakaan Pusat.',
    'Dr. Ahmad Fauzi, M.T.',
    '2024-10-16T09:00:00Z',
    '2024-10-15T17:00:00Z'
),
(
    'b3100000-0000-0000-0000-000000000002',
    'b3000000-0000-0000-0000-000000000001',
    '220101088',
    'Budi Darmawan',
    '2024-10-22',
    6,
    'Laboratorium Jaringan Komputer',
    'Membantu penataan kabel LAN dan pembersihan fisik rack server lab.',
    '/docs/bukti-sanksi-budi-2.pdf',
    'TERVERIFIKASI',
    'Telah diverifikasi sesuai laporan laboran.',
    'Dr. Ahmad Fauzi, M.T.',
    '2024-10-23T10:00:00Z',
    '2024-10-22T17:00:00Z'
),
(
    'b3100000-0000-0000-0000-000000000003',
    'b3000000-0000-0000-0000-000000000001',
    '220101088',
    'Budi Darmawan',
    '2024-10-29',
    4,
    'Taman dan Selasar Program Studi',
    'Kegiatan kerja bakti kebersihan selasar prodi dan pemilahan bank sampah kampus.',
    '/docs/bukti-sanksi-budi-3.jpg',
    'MENUNGGU',
    NULL,
    NULL,
    NULL,
    '2024-10-29T16:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Log Retensi Pelanggaran (Audit Trail UU PDP)
INSERT INTO violation_retention_logs (
    id, tanggal_hapus, alasan_status, mahasiswa_hash, operator, catatan_audit, created_at
) VALUES
(
    'b3200000-0000-0000-0000-000000000001',
    '2024-08-30 14:00:00+07',
    'LULUS',
    'SHA256:7e1f4a9b2c8d1e3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
    'Dr. Ahmad Fauzi, M.T. (Kaprodi)',
    'Penghapusan permanen 1 rekaman kasus pelanggaran setelah mahasiswa resmi dinyatakan lulus yudisium sesuai UU PDP No. 27/2022 Pasal 45.',
    '2024-08-30 14:00:00+07'
),
(
    'b3200000-0000-0000-0000-000000000002',
    '2024-02-15 10:30:00+07',
    'MENGUNDURKAN_DIRI',
    'SHA256:2a8c3d7e1b4f5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    'Dr. Ahmad Fauzi, M.T. (Kaprodi)',
    'Penghapusan permanen data berkas sanksi mahasiswa berstatus non-aktif mutasi keluar.',
    '2024-02-15 10:30:00+07'
)
ON CONFLICT (id) DO NOTHING;

