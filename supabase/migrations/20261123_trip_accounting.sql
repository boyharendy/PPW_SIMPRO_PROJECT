CREATE FUNCTION app.save_trip_costs(trip uuid,lines jsonb,actual boolean) RETURNS void
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE t travel_orders%rowtype; line record; affected int;
BEGIN
 SELECT * INTO STRICT t FROM travel_orders WHERE id=trip FOR UPDATE;
 IF actual AND (NOT app.is_trip_participant(trip) OR t.status NOT IN ('DISETUJUI','DISETUJUI_KAPRODI'))
 OR NOT actual AND (t.diajukan_oleh<>app.uid() OR t.status NOT IN ('DRAFT','DRAF','DITOLAK','PERLU_REVISI')) THEN RAISE EXCEPTION 'unauthorized costs'; END IF;
 IF jsonb_typeof(lines)<>'array' OR (SELECT count(*)<>count(DISTINCT e->>'komponen') FROM jsonb_array_elements(lines) e) THEN RAISE EXCEPTION 'invalid components'; END IF;
 IF NOT actual THEN DELETE FROM travel_costs WHERE travel_order_id=trip; END IF;
 FOR line IN SELECT * FROM jsonb_to_recordset(lines) AS l(komponen text,nominal_estimasi numeric,nominal_realisasi numeric,keterangan text,bukti_url text) LOOP
  IF line.komponen NOT IN ('TRANSPORTASI','AKOMODASI','UANG_HARIAN','LAINNYA') THEN RAISE EXCEPTION 'unknown component'; END IF;
  IF actual THEN
   UPDATE travel_costs SET nominal_realisasi=line.nominal_realisasi,realisasi_diisi=true,keterangan=line.keterangan,bukti_url=line.bukti_url
    WHERE travel_order_id=trip AND komponen=line.komponen;
   GET DIAGNOSTICS affected=ROW_COUNT;
   IF affected<>1 THEN RAISE EXCEPTION 'component missing or ambiguous'; END IF;
  ELSE
   INSERT INTO travel_costs(travel_order_id,komponen,nominal_estimasi,keterangan) VALUES(trip,line.komponen,line.nominal_estimasi,line.keterangan);
  END IF;
 END LOOP;
 UPDATE travel_orders SET total_estimasi_biaya=(SELECT coalesce(sum(nominal_estimasi),0) FROM travel_costs WHERE travel_order_id=trip),
 total_realisasi_biaya=(SELECT coalesce(sum(nominal_realisasi),0) FROM travel_costs WHERE travel_order_id=trip) WHERE id=trip;
END $$;
REVOKE ALL ON FUNCTION app.save_trip_costs(uuid,jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION app.save_trip_costs(uuid,jsonb,boolean) TO simpro_api;

-- Reconciliation is read-only, including for previously approved trips.
CREATE VIEW app.trip_cost_discrepancies AS
 SELECT t.id,t.status,t.total_estimasi_biaya,c.estimated,t.total_realisasi_biaya,c.actual
 FROM travel_orders t CROSS JOIN LATERAL(SELECT coalesce(sum(nominal_estimasi),0) estimated,
 coalesce(sum(nominal_realisasi),0) actual FROM travel_costs WHERE travel_order_id=t.id) c
 WHERE t.total_estimasi_biaya IS DISTINCT FROM c.estimated OR t.total_realisasi_biaya IS DISTINCT FROM c.actual;

ALTER FUNCTION app.apply_rka_version(uuid) RENAME TO apply_rka_version_impl;
CREATE FUNCTION app.apply_rka_version(p_version uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN IF app.acting('KAPRODI') IS NOT TRUE THEN RAISE EXCEPTION 'unauthorized decision'; END IF;
 RETURN app.apply_rka_version_impl(p_version);
END $$;
CREATE OR REPLACE FUNCTION app.confirm_business_trip(p_trip UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_trip RECORD;
  v_total_realisasi NUMERIC(15,2) := 0;
  v_actor UUID := app.uid();
  v_realization_id UUID;
BEGIN
  IF app.acting('KAPRODI','ADMIN_PRODI') IS NOT TRUE OR app.is_trip_participant(p_trip) THEN RAISE EXCEPTION 'unauthorized confirmation'; END IF;
 SELECT * INTO STRICT v_trip FROM travel_orders WHERE id=p_trip FOR UPDATE;
 IF v_trip.status<>'DILAPORKAN' THEN RAISE EXCEPTION 'report required'; END IF;
 SELECT coalesce(sum(nominal_realisasi),0) INTO v_total_realisasi FROM travel_costs WHERE travel_order_id=p_trip;
 IF EXISTS(SELECT FROM travel_costs WHERE travel_order_id=p_trip AND NOT realisasi_diisi) THEN RAISE EXCEPTION 'actuals required'; END IF;
 IF (SELECT count(DISTINCT komponen) FROM travel_costs WHERE travel_order_id=p_trip AND komponen IN ('TRANSPORTASI','AKOMODASI','UANG_HARIAN'))<>3
 OR NOT EXISTS(SELECT FROM travel_reports WHERE travel_order_id=p_trip AND trim(ringkasan_hasil)<>'')
 OR NOT EXISTS(SELECT FROM travel_proofs p JOIN attachments a ON a.id::text=p.file_url
     WHERE p.travel_order_id=p_trip AND p.kategori='FOTO_KEGIATAN' AND a.entity_type='BUSINESS_TRIP'
       AND a.entity_id=p_trip AND a.object_key IS NOT NULL AND a.mime_type IN ('image/jpeg','image/png'))
 OR EXISTS(SELECT FROM travel_costs c WHERE c.travel_order_id=p_trip AND c.nominal_realisasi>0 AND NOT EXISTS(
 SELECT FROM travel_proofs p JOIN attachments a ON a.id::text=p.file_url WHERE p.travel_order_id=p_trip
 AND a.entity_type='BUSINESS_TRIP' AND a.entity_id=p_trip AND a.object_key IS NOT NULL AND (p.kategori='KUITANSI' OR
 (c.komponen='TRANSPORTASI' AND p.kategori='TIKET') OR (c.komponen='AKOMODASI' AND p.kategori='BUKTI_PENGINAPAN'))))
 THEN RAISE EXCEPTION 'incomplete trip evidence'; END IF;
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
    -- Serialize postings to one RKA document before computing its new balance.
    PERFORM 1 FROM rka_documents d JOIN rka_budget_items b ON b.rka_id=d.id
     WHERE b.id=v_trip.rka_budget_item_id FOR UPDATE OF d,b;
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
REVOKE ALL ON FUNCTION app.apply_rka_version(uuid),app.apply_rka_version_impl(uuid),app.confirm_business_trip(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION app.apply_rka_version(uuid),app.confirm_business_trip(uuid) TO simpro_api;

DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='simpro_job') THEN CREATE ROLE simpro_job NOLOGIN NOBYPASSRLS; END IF; END $$;
GRANT simpro_job TO simpro_runtime;
GRANT USAGE ON SCHEMA public TO simpro_job;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['partner_invitations','travel_orders','rps_submissions','course_evaluations','publications','complaints','complaint_dispositions'] LOOP
 EXECUTE format('GRANT SELECT ON %I TO simpro_job',t);
 EXECUTE format('CREATE POLICY scheduler_read ON %I FOR SELECT TO simpro_job USING(true)',t);
 END LOOP;
END $$;
GRANT UPDATE(status) ON partner_invitations TO simpro_job;
GRANT UPDATE(status,tanggal_selesai,tanggal_penyelesaian,alasan_penutupan,is_escalated_kaprodi,escalated_at) ON complaints TO simpro_job;
CREATE POLICY scheduler_invitation ON partner_invitations FOR UPDATE TO simpro_job USING(true);
CREATE POLICY scheduler_case ON complaints FOR UPDATE TO simpro_job USING(true);
