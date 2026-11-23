ALTER TYPE travel_status ADD VALUE IF NOT EXISTS 'PERLU_REVISI';
-- Grant the deployment login its password outside version control.
DO $$ BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='simpro_runtime') THEN CREATE ROLE simpro_runtime LOGIN NOINHERIT NOBYPASSRLS; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='simpro_api') THEN CREATE ROLE simpro_api NOLOGIN NOBYPASSRLS; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='simpro_public') THEN CREATE ROLE simpro_public NOLOGIN NOBYPASSRLS; END IF;
END $$;
GRANT simpro_api, simpro_public TO simpro_runtime;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA app FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA app TO simpro_runtime, simpro_api, simpro_public;
GRANT USAGE ON SCHEMA public TO simpro_api, simpro_public;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
-- IDs already shared with Auth can be linked without relying on an email address.
UPDATE profiles p SET auth_user_id=p.id FROM auth.users u
 WHERE p.id=u.id AND p.auth_user_id IS NULL AND u.email_confirmed_at IS NOT NULL;

CREATE TABLE app.session_preferences(
 session_id uuid PRIMARY KEY REFERENCES auth.sessions(id) ON DELETE CASCADE,
 auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 active_role text, revoked boolean NOT NULL DEFAULT false
);
CREATE FUNCTION app.session_profile(subject uuid,sid uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT jsonb_build_object('id',p.id,'nama_lengkap',p.nama_lengkap,'email',p.email,'is_active',true,
 'status_akademik', CASE WHEN p.tipe_pengguna='MAHASISWA' THEN p.status_akademik END,
 'roles',roles.role_names,'active_role',coalesce(pref.active_role,roles.role_names[1]),
 'penanganan_kekerasan',coalesce(pref.active_role,roles.role_names[1]) IN ('PENGELOLA_ADUAN','PETUGAS_KEKERASAN') AND roles.can_handle)
 FROM auth.sessions s JOIN auth.users u ON u.id=s.user_id JOIN profiles p ON p.auth_user_id=u.id
 LEFT JOIN app.session_preferences pref ON pref.session_id=s.id
 CROSS JOIN LATERAL(SELECT array_agg(r.role::text ORDER BY r.berlaku_dari,r.id) AS role_names,
 bool_or(r.penanganan_kekerasan AND r.role='PENGELOLA_ADUAN' OR r.role='PETUGAS_KEKERASAN') can_handle
 FROM user_roles r WHERE r.user_id=p.id AND r.berlaku_dari<=CURRENT_DATE AND (r.berlaku_sampai IS NULL OR r.berlaku_sampai>=CURRENT_DATE)) roles
 WHERE s.id=sid AND u.id=subject AND u.email_confirmed_at IS NOT NULL AND p.is_active
 AND NOT coalesce(pref.revoked,false) AND roles.role_names IS NOT NULL
 AND (pref.active_role IS NULL OR pref.active_role=ANY(roles.role_names));
$$;
CREATE FUNCTION app.switch_session_role(subject uuid,sid uuid,requested text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF NOT coalesce((app.session_profile(subject,sid)->'roles') ? requested,false) THEN RETURN false; END IF;
 INSERT INTO app.session_preferences(session_id,auth_user_id,active_role) VALUES(sid,subject,requested)
 ON CONFLICT(session_id) DO UPDATE SET active_role=excluded.active_role WHERE NOT session_preferences.revoked;
 RETURN FOUND;
END $$;
CREATE FUNCTION app.revoke_session(subject uuid,sid uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 INSERT INTO app.session_preferences(session_id,auth_user_id,revoked)
 SELECT id,user_id,true FROM auth.sessions WHERE id=sid AND user_id=subject
 ON CONFLICT(session_id) DO UPDATE SET revoked=true;
$$;

ALTER TABLE complaints ALTER COLUMN kode_tiket DROP NOT NULL;
CREATE UNIQUE INDEX complaints_ticket_digest ON complaints(kode_tiket_hash) WHERE kode_tiket_hash IS NOT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS solusi_tindak_lanjut text, ADD COLUMN IF NOT EXISTS alasan_penutupan text,
 ADD COLUMN IF NOT EXISTS tanggal_penyelesaian date;
ALTER TABLE complaint_messages ADD COLUMN IF NOT EXISTS lampiran_url text;
ALTER TABLE complaint_dispositions ADD COLUMN IF NOT EXISTS unit_tujuan text;
ALTER TABLE rps_reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'DITUGASKAN';
ALTER TABLE travel_costs ADD COLUMN IF NOT EXISTS realisasi_diisi boolean NOT NULL DEFAULT false;
UPDATE travel_costs c SET realisasi_diisi=true FROM travel_orders t WHERE c.travel_order_id=t.id
 AND (c.nominal_realisasi>0 OR t.status IN ('DILAPORKAN','SELESAI','LAPORAN_TERVERIFIKASI'));

CREATE TABLE app.spent_permits(digest text PRIMARY KEY,expires_at timestamptz NOT NULL);
CREATE INDEX spent_permits_expiry ON app.spent_permits(expires_at);
CREATE FUNCTION app.spend_permit(digest text,expiry timestamptz,ticket text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF expiry<=clock_timestamp() OR expiry>clock_timestamp()+interval '15 minutes' OR length(ticket)<>64 THEN RAISE EXCEPTION 'invalid permit'; END IF;
 DELETE FROM app.spent_permits WHERE expires_at<now();
 INSERT INTO app.spent_permits VALUES(digest,expiry);
 PERFORM set_config('app.new_ticket',ticket,true),set_config('app.ticket_hash',ticket,true);
END $$;

CREATE TABLE IF NOT EXISTS attachments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),entity_type text NOT NULL,entity_id uuid NOT NULL,
 file_name text NOT NULL,file_url text NOT NULL DEFAULT '',file_size bigint NOT NULL,mime_type text NOT NULL,uploaded_by uuid REFERENCES profiles(id),created_at timestamptz NOT NULL DEFAULT current_date);
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS object_key text;
CREATE INDEX IF NOT EXISTS attachments_parent ON attachments(entity_type,entity_id);
INSERT INTO storage.buckets(id,name,public) VALUES('simpro-private','simpro-private',false) ON CONFLICT(id) DO UPDATE SET public=false;

-- Only the runtime login can resolve and revoke provider sessions.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.session_profile(uuid,uuid),app.switch_session_role(uuid,uuid,text),app.revoke_session(uuid,uuid) TO simpro_runtime;
GRANT EXECUTE ON FUNCTION app.spend_permit(text,timestamptz,text) TO simpro_public;
