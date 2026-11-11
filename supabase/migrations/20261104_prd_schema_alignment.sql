-- ============================================================
-- SIMPRO - Migration 20261104_prd_schema_alignment.sql
-- Milestone 1: Fondasi Skema PRD, Stored Procedures, Views & RLS
-- Selaras penuh dengan PRD Bab 6, 10, dan Roadmap Fase 1
-- ============================================================

-- ------------------------------------------------------------
-- 1. Skema app & Fungsi Pembantu Kontekstual & Keamanan (Bab 10.2)
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app;

-- Identitas pengguna dari GUC yang diset Go per transaksi
CREATE OR REPLACE FUNCTION app.uid() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.user_id', true), '')::uuid;
$$;

-- Pemeriksaan peran pengguna langsung dari tabel user_roles
CREATE OR REPLACE FUNCTION app.has_role(p_role text) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles r
    WHERE r.user_id = app.uid()
      AND r.role::text = p_role
      AND r.berlaku_dari <= CURRENT_DATE
      AND (r.berlaku_sampai IS NULL OR r.berlaku_sampai >= CURRENT_DATE)
  );
$$;

-- Helper Kaprodi
CREATE OR REPLACE FUNCTION app.is_kaprodi() RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$ SELECT app.has_role('KAPRODI'); $$;

-- Helper Koordinator Program (KP, PSI, PDLK)
CREATE OR REPLACE FUNCTION app.is_coordinator(p_program text) RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$ SELECT app.has_role('KOORDINATOR_' || p_program); $$;

-- Helper Pengelola Aduan dengan izin Penanganan Kekerasan (PGL-K)
CREATE OR REPLACE FUNCTION app.is_violence_handler() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles r
    WHERE r.user_id = app.uid()
      AND r.role::text = 'PENGELOLA_ADUAN'
      AND coalesce(r.penanganan_kekerasan, false) = TRUE
      AND r.berlaku_dari <= CURRENT_DATE
      AND (r.berlaku_sampai IS NULL OR r.berlaku_sampai >= CURRENT_DATE)
  );
$$;

-- Peran kontekstual: Peserta publikasi
CREATE OR REPLACE FUNCTION app.is_pub_participant(p_pub uuid) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM publications p
                 WHERE p.id = p_pub AND (p.created_by = app.uid() OR p.verifikator_id = app.uid()))
      OR EXISTS (SELECT 1 FROM publication_authors a
                 WHERE a.publication_id = p_pub AND a.user_id = app.uid())
      OR EXISTS (SELECT 1 FROM publication_reviews r
                 WHERE r.publication_id = p_pub AND r.reviewer_id = app.uid() AND r.status <> 'DIBATALKAN');
$$;

-- Peran kontekstual: Peserta perjalanan dinas
CREATE OR REPLACE FUNCTION app.is_trip_participant(p_trip uuid) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM travel_members x
                 WHERE x.travel_order_id = p_trip AND x.user_id = app.uid())
      OR EXISTS (SELECT 1 FROM travel_orders t
                 WHERE t.id = p_trip AND t.diajukan_oleh = app.uid());
$$;

-- Peran kontekstual: Pengampu kelas
CREATE OR REPLACE FUNCTION app.owns_course_class(p_class uuid) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM course_classes c
                 WHERE c.id = p_class AND c.dosen_pengampu_id = app.uid());
$$;

-- Peran kontekstual: Penanggung jawab disposisi aduan aktif
CREATE OR REPLACE FUNCTION app.has_active_disposition(p_complaint uuid) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM complaint_dispositions d
                 WHERE d.complaint_id = p_complaint
                   AND d.kepada_petugas_id = app.uid()
                   AND d.status IN ('AKTIF', 'DIESKALASI'));
$$;

-- ------------------------------------------------------------
-- 2. Penyesuaian Kolom & Constraint Skema Tabel PRD
-- ------------------------------------------------------------

-- Tambah flag penanganan_kekerasan pada user_roles (Bab 6 & 10)
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS penanganan_kekerasan BOOLEAN NOT NULL DEFAULT FALSE;

-- Update akun petugas kekerasan awal agar memiliki flag true
UPDATE user_roles
SET penanganan_kekerasan = TRUE
WHERE role IN ('PENGELOLA_ADUAN', 'PETUGAS_KEKERASAN')
  AND user_id = 'a0000000-0000-0000-0000-000000000002';

-- Penyesuaian RKA (Bab 6 Tabel 21 & 22): versi aktif, row_version, draft_payload
ALTER TABLE rka_documents ADD COLUMN IF NOT EXISTS versi_aktif_id UUID;
ALTER TABLE rka_versions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE rka_versions ADD COLUMN IF NOT EXISTS row_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE rka_versions ADD COLUMN IF NOT EXISTS draft_payload JSONB;

-- Penyesuaian is_active pada pos anggaran & kegiatan RKA
ALTER TABLE rka_activities ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE rka_budget_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Constraint Idempotensi Realisasi SPPD ke RKA
DO $$ BEGIN
  ALTER TABLE rka_realizations ADD CONSTRAINT uq_realization_trip UNIQUE (travel_order_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Penyesuaian Survei Mitra (Token Hash & Kedaluwarsa)
ALTER TABLE partner_invitations ADD COLUMN IF NOT EXISTS token_hash TEXT;
ALTER TABLE partner_invitations ADD COLUMN IF NOT EXISTS kedaluwarsa_at TIMESTAMPTZ;
UPDATE partner_invitations
SET kedaluwarsa_at = expired_at
WHERE kedaluwarsa_at IS NULL;

-- Penyesuaian Aduan (Kode Tiket Hash & Tanggal Diterima)
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS kode_tiket_hash TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS tanggal_diterima DATE DEFAULT CURRENT_DATE;

-- Tabel Pengaturan Sistem (app_settings) - Bab 6 Tabel 40
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Pengaturan Awal Sistem
INSERT INTO app_settings (key, value, description, is_secret) VALUES
('max_upload_mb', '10', 'Batas maksimal ukuran berkas unggahan lampiran (MB)', FALSE),
('complaint_sla_days', '5', 'Batas hari kerja SLA penanganan aduan mahasiswa', FALSE),
('aduan_kaprodi_lihat_isi_sensitif', 'false', 'Kebijakan Kaprodi melihat kronologi aduan kekerasan seksual/perundungan', FALSE),
('survey_invitation_expiry_days', '30', 'Masa aktif tautan token kuesioner mitra', FALSE)
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Stored Procedures Transaksi Atomik (Bab 10.2)
-- ------------------------------------------------------------

-- A. app.apply_rka_version(p_version uuid)
-- Menerapkan draft_payload versi kerja RKA secara atomik ke data aktif
CREATE OR REPLACE FUNCTION app.apply_rka_version(p_version UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version RECORD;
  v_rka RECORD;
  v_item JSONB;
  v_activity JSONB;
  v_total_alokasi NUMERIC(15,2) := 0;
  v_existing_realisasi NUMERIC(15,2);
  v_item_id UUID;
  v_activity_id UUID;
  v_payload_item_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- 1. Ambil versi RKA
  SELECT * INTO v_version FROM rka_versions WHERE id = p_version;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Versi RKA dengan ID % tidak ditemukan', p_version;
  END IF;

  -- 2. Ambil dokumen RKA
  SELECT * INTO v_rka FROM rka_documents WHERE id = v_version.rka_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dokumen RKA tidak ditemukan';
  END IF;

  -- 3. Terapkan Activities jika ada di draft_payload
  IF v_version.draft_payload IS NOT NULL AND v_version.draft_payload ? 'activities' THEN
    FOR v_activity IN SELECT * FROM jsonb_array_elements(v_version.draft_payload->'activities')
    LOOP
      v_activity_id := NULL;
      IF v_activity ? 'id' AND (v_activity->>'id') IS NOT NULL AND (v_activity->>'id') <> '' THEN
        v_activity_id := (v_activity->>'id')::UUID;
        UPDATE rka_activities
        SET 
          nama_kegiatan = coalesce(v_activity->>'nama_kegiatan', nama_kegiatan),
          indikator_kinerja = coalesce(v_activity->>'indikator_kinerja', indikator_kinerja),
          target_kinerja = v_activity->>'target_kinerja',
          jadwal_mulai = (v_activity->>'jadwal_mulai')::DATE,
          jadwal_selesai = (v_activity->>'jadwal_selesai')::DATE,
          triwulan = coalesce((v_activity->>'triwulan')::SMALLINT, triwulan),
          is_active = TRUE
        WHERE id = v_activity_id;
      ELSE
        INSERT INTO rka_activities (
          rka_id, nama_kegiatan, indikator_kinerja, target_kinerja,
          jadwal_mulai, jadwal_selesai, triwulan, is_active
        ) VALUES (
          v_version.rka_id,
          v_activity->>'nama_kegiatan',
          coalesce(v_activity->>'indikator_kinerja', '-'),
          v_activity->>'target_kinerja',
          (v_activity->>'jadwal_mulai')::DATE,
          (v_activity->>'jadwal_selesai')::DATE,
          coalesce((v_activity->>'triwulan')::SMALLINT, 1),
          TRUE
        ) RETURNING id INTO v_activity_id;
      END IF;
    END LOOP;
  END IF;

  -- 4. Terapkan Budget Items jika ada di draft_payload
  IF v_version.draft_payload IS NOT NULL AND v_version.draft_payload ? 'budget_items' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_version.draft_payload->'budget_items')
    LOOP
      v_item_id := NULL;
      IF v_item ? 'id' AND (v_item->>'id') IS NOT NULL AND (v_item->>'id') <> '' THEN
        v_item_id := (v_item->>'id')::UUID;
        v_payload_item_ids := array_append(v_payload_item_ids, v_item_id);

        UPDATE rka_budget_items
        SET
          kode_mata_anggaran = coalesce(v_item->>'kode_mata_anggaran', kode_mata_anggaran),
          nama_kegiatan = coalesce(v_item->>'nama_kegiatan', nama_kegiatan),
          kategori = coalesce(v_item->>'kategori', kategori),
          sumber_dana = coalesce(v_item->>'sumber_dana', sumber_dana),
          triwulan = coalesce((v_item->>'triwulan')::SMALLINT, triwulan),
          anggaran_alokasi = (v_item->>'anggaran_alokasi')::NUMERIC(15,2),
          is_active = TRUE
        WHERE id = v_item_id;
      ELSE
        INSERT INTO rka_budget_items (
          rka_id, kode_mata_anggaran, nama_kegiatan, kategori,
          sumber_dana, triwulan, anggaran_alokasi, is_active
        ) VALUES (
          v_version.rka_id,
          v_item->>'kode_mata_anggaran',
          v_item->>'nama_kegiatan',
          coalesce(v_item->>'kategori', 'OPERASIONAL'),
          coalesce(v_item->>'sumber_dana', 'RKAT_UNIVERSITAS'),
          coalesce((v_item->>'triwulan')::SMALLINT, 1),
          (v_item->>'anggaran_alokasi')::NUMERIC(15,2),
          TRUE
        ) RETURNING id INTO v_item_id;
        v_payload_item_ids := array_append(v_payload_item_ids, v_item_id);
      END IF;
      v_total_alokasi := v_total_alokasi + (v_item->>'anggaran_alokasi')::NUMERIC(15,2);
    END LOOP;

    -- 5. Non-aktifkan pos anggaran aktif yang tidak tercantum di draft_payload
    FOR v_item_id IN 
      SELECT id FROM rka_budget_items 
      WHERE rka_id = v_version.rka_id AND is_active = TRUE AND NOT (id = ANY(v_payload_item_ids))
    LOOP
      SELECT coalesce(sum(nominal), 0) INTO v_existing_realisasi FROM rka_realizations WHERE budget_item_id = v_item_id;
      IF v_existing_realisasi > 0 THEN
        RAISE EXCEPTION 'Pos anggaran ID % tidak boleh dihapus karena telah memiliki realisasi sebesar Rp %', v_item_id, v_existing_realisasi;
      END IF;

      IF EXISTS (SELECT 1 FROM travel_orders WHERE rka_budget_item_id = v_item_id) THEN
        RAISE EXCEPTION 'Pos anggaran ID % tidak boleh dihapus karena tertaut dengan perjalanan dinas', v_item_id;
      END IF;

      UPDATE rka_budget_items SET is_active = FALSE WHERE id = v_item_id;
    END LOOP;
  END IF;

  -- 6. Update status versi: versi lama menjadi DIGANTIKAN, versi terpilih DISETUJUI
  UPDATE rka_versions
  SET status = 'DIGANTIKAN'
  WHERE rka_id = v_version.rka_id AND id <> p_version AND status = 'DISETUJUI';

  UPDATE rka_versions
  SET status = 'DISETUJUI'
  WHERE id = p_version;

  -- 7. Update dokumen RKA aktif
  UPDATE rka_documents
  SET 
    status = 'AKTIF',
    pagu_total = CASE WHEN v_total_alokasi > 0 THEN v_total_alokasi ELSE pagu_total END,
    versi_aktif_id = p_version,
    updated_at = NOW()
  WHERE id = v_version.rka_id;

  RETURN jsonb_build_object(
    'success', true,
    'rka_id', v_version.rka_id,
    'version_id', p_version,
    'total_anggaran', v_total_alokasi
  );
END;
$$;

-- B. app.confirm_business_trip(p_trip uuid)
-- Konfirmasi selesai perjalanan dinas oleh Admin Prodi dengan auto-realisasi RKA atomik
CREATE OR REPLACE FUNCTION app.confirm_business_trip(p_trip UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip RECORD;
  v_total_realisasi NUMERIC(15,2) := 0;
  v_actor UUID := app.uid();
  v_realization_id UUID;
BEGIN
  -- 1. Ambil data perjalanan
  SELECT * INTO v_trip FROM travel_orders WHERE id = p_trip;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perjalanan dinas dengan ID % tidak ditemukan', p_trip;
  END IF;

  -- 2. Validasi status saat ini
  IF v_trip.status NOT IN ('DISETUJUI', 'DISETUJUI_KAPRODI', 'DILAPORKAN') THEN
    RAISE EXCEPTION 'Perjalanan dinas tidak dapat diselesaikan pada status %', v_trip.status;
  END IF;

  -- 3. Cek Separation of Duties (Kecuali aktor bertindak sebagai KAPRODI)
  IF v_actor IS NOT NULL THEN
    IF NOT app.is_kaprodi() THEN
      IF v_trip.diajukan_oleh = v_actor THEN
        RAISE EXCEPTION 'Pemisahan wewenang dilanggar: pengaju tidak dapat mengonfirmasi perjalanannya sendiri';
      END IF;
      IF EXISTS (SELECT 1 FROM travel_members WHERE travel_order_id = p_trip AND user_id = v_actor) THEN
        RAISE EXCEPTION 'Pemisahan wewenang dilanggar: pelaksana dinas tidak dapat mengonfirmasi perjalanannya sendiri';
      END IF;
    END IF;
  END IF;

  -- 4. Hitung akumulasi realisasi riil biaya dinas
  SELECT coalesce(sum(coalesce(nominal_realisasi, nominal_estimasi)), 0)
  INTO v_total_realisasi
  FROM travel_costs
  WHERE travel_order_id = p_trip;

  IF v_total_realisasi = 0 AND v_trip.total_realisasi_biaya > 0 THEN
    v_total_realisasi := v_trip.total_realisasi_biaya;
  ELSIF v_total_realisasi = 0 THEN
    v_total_realisasi := v_trip.total_estimasi_biaya;
  END IF;

  -- 5. Ubah status perjalanan menjadi SELESAI
  UPDATE travel_orders
  SET
    status = 'SELESAI',
    total_realisasi_biaya = v_total_realisasi,
    dikonfirmasi_oleh = coalesce(v_actor, dikonfirmasi_oleh),
    dikonfirmasi_at = NOW(),
    updated_at = NOW()
  WHERE id = p_trip;

  -- 6. Integrasi Otomatis ke Realisasi Belanja RKA (jika sumber dana RKA_PRODI)
  IF v_trip.sumber_dana IN ('RKA_PRODI', 'RKAT_PRODI', 'RKA') AND v_trip.rka_budget_item_id IS NOT NULL THEN
    INSERT INTO rka_realizations (
      budget_item_id,
      travel_order_id,
      sumber_pencatatan,
      uraian,
      nominal,
      tanggal_realisasi,
      dicatat_oleh
    ) VALUES (
      v_trip.rka_budget_item_id,
      p_trip,
      'PERJALANAN_DINAS',
      'Realisasi Perjalanan Dinas: ' || coalesce(v_trip.nomor_surat_tugas, v_trip.tujuan) || ' - ' || v_trip.keperluan,
      v_total_realisasi,
      CURRENT_DATE,
      v_actor
    )
    ON CONFLICT (travel_order_id) DO UPDATE SET
      nominal = EXCLUDED.nominal,
      uraian = EXCLUDED.uraian,
      tanggal_realisasi = EXCLUDED.tanggal_realisasi
    RETURNING id INTO v_realization_id;

    -- Update akumulasi anggaran_terpakai di pos rka_budget_items
    UPDATE rka_budget_items
    SET anggaran_terpakai = (
      SELECT coalesce(sum(nominal), 0) FROM rka_realizations WHERE budget_item_id = v_trip.rka_budget_item_id
    )
    WHERE id = v_trip.rka_budget_item_id;

    -- Update akumulasi total_terpakai di dokumen rka_documents
    UPDATE rka_documents
    SET total_terpakai = (
      SELECT coalesce(sum(r.nominal), 0)
      FROM rka_realizations r
      JOIN rka_budget_items bi ON bi.id = r.budget_item_id
      WHERE bi.rka_id = rka_documents.id
    )
    WHERE id IN (SELECT rka_id FROM rka_budget_items WHERE id = v_trip.rka_budget_item_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'trip_id', p_trip,
    'status', 'SELESAI',
    'total_realisasi', v_total_realisasi,
    'realization_id', v_realization_id
  );
END;
$$;

-- ------------------------------------------------------------
-- 4. Views Terbatas & Proteksi Akses Sensitif (Bab 10.2)
-- ------------------------------------------------------------

-- A. v_user_directory (Koleksi pengguna tanpa ekspos email privat)
CREATE OR REPLACE VIEW v_user_directory AS
SELECT 
  id, 
  nomor_induk, 
  nama_lengkap, 
  tipe_pengguna, 
  angkatan, 
  is_active
FROM profiles
WHERE is_active = TRUE;

-- B. v_rka_pos_picker (Pilihan pos aktif beserta pagu & sisa anggaran)
CREATE OR REPLACE VIEW v_rka_pos_picker AS
SELECT 
  bi.id,
  bi.rka_id,
  bi.kode_mata_anggaran AS kode_pos,
  bi.nama_kegiatan AS nama_pos,
  bi.kategori,
  bi.triwulan,
  bi.anggaran_alokasi AS pagu,
  coalesce(sum(r.nominal), 0) AS realisasi,
  (bi.anggaran_alokasi - coalesce(sum(r.nominal), 0)) AS sisa_anggaran
FROM rka_budget_items bi
JOIN rka_documents d ON d.id = bi.rka_id AND d.status = 'AKTIF'
LEFT JOIN rka_realizations r ON r.budget_item_id = bi.id
WHERE bi.is_active = TRUE
GROUP BY bi.id, bi.rka_id, bi.kode_mata_anggaran, bi.nama_kegiatan, bi.kategori, bi.triwulan, bi.anggaran_alokasi;

-- C. v_complaint_metadata (Tampilan Khusus Kaprodi: Tanpa Judul, Kronologi, & Pesan Sensitif)
CREATE OR REPLACE VIEW v_complaint_metadata AS
SELECT 
  c.id, 
  c.nomor_aduan, 
  c.kategori, 
  c.is_sensitif, 
  c.status,
  c.tanggal_pengaduan AS tanggal_diterima, 
  c.tanggal_selesai,
  (CURRENT_DATE - c.tanggal_pengaduan) AS umur_hari,
  d.deadline_tindak_lanjut AS tenggat_terakhir, 
  d.status AS status_disposisi,
  p.nama_lengkap AS penanggung_jawab
FROM complaints c
LEFT JOIN LATERAL (
  SELECT * FROM complaint_dispositions x
  WHERE x.complaint_id = c.id ORDER BY x.created_at DESC LIMIT 1
) d ON TRUE
LEFT JOIN profiles p ON p.id = d.kepada_petugas_id;

-- D. v_publikasi_dosen_terverifikasi (Koleksi Publikasi Layak Kinerja Dosen)
CREATE OR REPLACE VIEW v_publikasi_dosen_terverifikasi AS
SELECT 
  p.id,
  p.judul,
  p.tipe,
  p.status,
  p.nama_jurnal_konferensi,
  p.peringkat,
  p.tahun_terbit,
  p.doi,
  p.url_publikasi,
  p.status_verifikasi,
  p.diverifikasi_at,
  p.created_by AS dosen_id
FROM publications p
WHERE p.status_verifikasi IN ('TERVERIFIKASI', 'TIDAK_PERLU');

-- ------------------------------------------------------------
-- 5. Views Kompatibilitas Naming Antara PRD & Database
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW partner_survey_templates AS SELECT * FROM partner_surveys;
CREATE OR REPLACE VIEW partner_survey_aspects AS SELECT * FROM survey_questions;
CREATE OR REPLACE VIEW partner_survey_invitations AS SELECT * FROM partner_invitations;
CREATE OR REPLACE VIEW partner_survey_responses AS SELECT * FROM partner_responses;
CREATE OR REPLACE VIEW partner_survey_answers AS SELECT * FROM partner_response_items;
CREATE OR REPLACE VIEW business_trips AS SELECT * FROM travel_orders;
CREATE OR REPLACE VIEW business_trip_participants AS SELECT * FROM travel_members;
CREATE OR REPLACE VIEW business_trip_costs AS SELECT * FROM travel_costs;

