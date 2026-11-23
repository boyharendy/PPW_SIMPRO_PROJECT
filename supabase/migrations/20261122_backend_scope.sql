-- Row policies for the SIMPRO API. Only the Go runtime can assume these roles.
CREATE FUNCTION app.acting(VARIADIC allowed text[]) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT current_setting('app.active_role',true)=ANY(allowed) AND app.has_role(current_setting('app.active_role',true))
$$;
CREATE FUNCTION app.pub_author(pub uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT EXISTS(SELECT FROM publications WHERE id=pub AND created_by=app.uid()) OR EXISTS(SELECT FROM publication_authors WHERE publication_id=pub AND user_id=app.uid())
$$;
CREATE FUNCTION app.pub_verifier(pub uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT EXISTS(SELECT FROM publications WHERE id=pub AND verifikator_id=app.uid() AND created_by<>app.uid()) AND app.acting('DOSEN','DOSEN_VERIFIKATOR')
$$;
CREATE FUNCTION app.rps_reviewer(sub uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT EXISTS(SELECT FROM rps_reviews WHERE rps_submission_id=sub AND reviewer_id=app.uid() AND status<>'DIBATALKAN')
 OR EXISTS(SELECT FROM rps_submissions WHERE id=sub AND gkm_reviewer_id=app.uid())
$$;
CREATE FUNCTION app.case_access(cid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT EXISTS(SELECT FROM complaints c WHERE c.id=cid AND (
 app.has_active_disposition(cid) OR app.acting('PETUGAS_KEKERASAN') OR (app.acting('PENGELOLA_ADUAN') AND app.is_violence_handler())
 OR (NOT c.is_sensitif AND app.acting('PENGELOLA_ADUAN','KAPRODI'))))
$$;
CREATE FUNCTION app.ticket_case(cid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT EXISTS(SELECT FROM complaints WHERE id=cid AND kode_tiket_hash=nullif(current_setting('app.ticket_hash',true),''))
$$;
CREATE FUNCTION app.attachment_allowed(kind text,parent uuid,writing boolean) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT CASE kind
 WHEN 'COMPLAINT' THEN app.case_access(parent) OR app.ticket_case(parent)
 WHEN 'COMPLAINT_MESSAGE' THEN EXISTS(SELECT FROM complaint_messages m WHERE m.id=parent AND
   (app.case_access(m.complaint_id) OR (app.ticket_case(m.complaint_id) AND NOT m.is_catatan_internal)))
 WHEN 'PUBLICATION' THEN CASE WHEN writing THEN app.pub_author(parent) ELSE app.is_pub_participant(parent) OR app.acting('KAPRODI') END
 WHEN 'BUSINESS_TRIP' THEN app.is_trip_participant(parent) OR (NOT writing AND app.acting('KAPRODI','ADMIN_PRODI'))
 WHEN 'RPS' THEN EXISTS(SELECT FROM rps_submissions s WHERE s.id=parent AND (s.dosen_penyusun_id=app.uid() OR app.rps_reviewer(parent) OR (NOT writing AND app.acting('GKM','KAPRODI'))))
 WHEN 'COURSE_EVALUATION' THEN EXISTS(SELECT FROM course_evaluations e WHERE e.id=parent AND (app.owns_course_class(e.course_class_id) OR (NOT writing AND app.acting('GKM','KAPRODI'))))
 ELSE false END
$$;

-- Remove direct Data API privileges from the objects belonging to these modules.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY string_to_array('profiles user_roles academic_periods courses course_classes audit_logs app_settings partner_institutions student_placements partner_surveys survey_questions partner_invitations partner_responses partner_response_items publications publication_authors publication_stage_logs publication_reviews travel_orders travel_members travel_costs travel_proofs travel_reports rka_documents rka_versions rka_activities rka_budget_items rka_realizations rps_submissions rps_versions rps_reviews rps_review_items course_evaluations cpmk_evaluations course_evaluation_grades course_improvement_plans course_feedback_summaries complaints complaint_messages complaint_dispositions attachments',' ') LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO simpro_api',t);
 END LOOP;
 FOREACH t IN ARRAY string_to_array('v_user_directory v_rka_pos_picker v_complaint_metadata v_publikasi_dosen_terverifikasi partner_survey_templates partner_survey_aspects partner_survey_invitations partner_survey_responses partner_survey_answers business_trips business_trip_participants business_trip_costs',' ') LOOP
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 END LOOP;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION app.uid(),app.acting(text[]),app.has_role(text),app.is_violence_handler(),app.is_kaprodi(),app.has_active_disposition(uuid),app.pub_author(uuid),app.pub_verifier(uuid),app.is_pub_participant(uuid),app.is_trip_participant(uuid),app.rps_reviewer(uuid),app.case_access(uuid),app.ticket_case(uuid),app.owns_course_class(uuid),app.attachment_allowed(text,uuid,boolean) TO simpro_api,simpro_public;

CREATE POLICY directory ON profiles FOR SELECT TO simpro_api USING (id=app.uid() OR app.acting('KAPRODI','GKM','ADMIN_PRODI','PENGELOLA_ADUAN','KOORDINATOR_KP','KOORDINATOR_PSI','KOORDINATOR_PDLK'));
CREATE POLICY manage_profiles ON profiles TO simpro_api USING(app.acting('KAPRODI')) WITH CHECK(app.acting('KAPRODI'));
CREATE POLICY read_roles ON user_roles FOR SELECT TO simpro_api USING(EXISTS(SELECT FROM profiles WHERE id=user_id));
CREATE POLICY manage_roles ON user_roles TO simpro_api USING(app.acting('KAPRODI')) WITH CHECK(app.acting('KAPRODI'));
CREATE POLICY read_settings ON app_settings FOR SELECT TO simpro_api USING(NOT is_secret);
CREATE POLICY change_settings ON app_settings FOR UPDATE TO simpro_api USING(NOT is_secret AND app.acting('KAPRODI','ADMIN_PRODI')) WITH CHECK(NOT is_secret);
CREATE POLICY audit_reader ON audit_logs FOR SELECT TO simpro_api USING(app.acting('KAPRODI'));
CREATE POLICY audit_append ON audit_logs FOR INSERT TO simpro_api WITH CHECK(aktor_id=app.uid());

CREATE POLICY pub_read ON publications FOR SELECT TO simpro_api USING(app.is_pub_participant(id) OR app.acting('KAPRODI'));
CREATE POLICY pub_create ON publications FOR INSERT TO simpro_api WITH CHECK(created_by=app.uid() AND app.acting('DOSEN','MAHASISWA') AND status IN ('DRAF','DRAFT'));
CREATE POLICY pub_edit ON publications FOR UPDATE TO simpro_api USING(((app.pub_author(id) OR app.acting('KAPRODI')) AND status_verifikasi<>'TERVERIFIKASI') OR app.pub_verifier(id)) WITH CHECK(app.pub_author(id) OR app.pub_verifier(id) OR app.acting('KAPRODI'));
CREATE POLICY pub_delete ON publications FOR DELETE TO simpro_api USING(created_by=app.uid() AND status IN ('DRAF','DRAFT') AND status_verifikasi<>'TERVERIFIKASI');
CREATE POLICY authors_read ON publication_authors FOR SELECT TO simpro_api USING(EXISTS(SELECT FROM publications WHERE id=publication_id));
CREATE POLICY authors_write ON publication_authors TO simpro_api USING(app.pub_author(publication_id)) WITH CHECK(app.pub_author(publication_id));
CREATE POLICY stages_read ON publication_stage_logs FOR SELECT TO simpro_api USING(EXISTS(SELECT FROM publications WHERE id=publication_id));
CREATE POLICY stages_add ON publication_stage_logs FOR INSERT TO simpro_api WITH CHECK(app.pub_author(publication_id) AND dicatat_oleh=app.uid());
CREATE POLICY stages_verify ON publication_stage_logs FOR UPDATE TO simpro_api USING(app.pub_verifier(publication_id));
CREATE POLICY pub_review_read ON publication_reviews FOR SELECT TO simpro_api USING(EXISTS(SELECT FROM publications WHERE id=publication_id));
CREATE POLICY pub_review_assign ON publication_reviews FOR INSERT TO simpro_api WITH CHECK((app.acting('KAPRODI') OR (app.acting('DOSEN') AND app.pub_author(publication_id))) AND reviewer_id<>app.uid());
CREATE POLICY pub_review_complete ON publication_reviews FOR UPDATE TO simpro_api USING(reviewer_id=app.uid() AND app.acting('DOSEN')) WITH CHECK(reviewer_id=app.uid());

CREATE POLICY trip_read ON travel_orders FOR SELECT TO simpro_api USING(app.is_trip_participant(id) OR app.acting('KAPRODI','ADMIN_PRODI'));
CREATE POLICY trip_create ON travel_orders FOR INSERT TO simpro_api WITH CHECK(diajukan_oleh=app.uid() AND status IN ('DRAFT','DRAF'));
CREATE POLICY trip_change ON travel_orders FOR UPDATE TO simpro_api USING(
 (diajukan_oleh=app.uid() AND status IN ('DRAFT','DRAF','DITOLAK','PERLU_REVISI')) OR
 (app.is_trip_participant(id) AND status IN ('DISETUJUI','DISETUJUI_KAPRODI')) OR
 (app.acting('KAPRODI') AND status='DIAJUKAN')) WITH CHECK(diajukan_oleh=app.uid() OR app.is_trip_participant(id) OR app.acting('KAPRODI'));
CREATE POLICY trip_delete ON travel_orders FOR DELETE TO simpro_api USING(diajukan_oleh=app.uid() AND status IN ('DRAF','DRAFT'));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['travel_costs','travel_members','travel_proofs','travel_reports'] LOOP
 EXECUTE format('CREATE POLICY trip_child_read ON %I FOR SELECT TO simpro_api USING(EXISTS(SELECT FROM travel_orders t WHERE t.id=travel_order_id))',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['travel_costs','travel_members'] LOOP
 EXECUTE format('CREATE POLICY draft_write ON %I TO simpro_api USING(EXISTS(SELECT FROM travel_orders t WHERE t.id=travel_order_id AND t.diajukan_oleh=app.uid() AND t.status IN (''DRAFT'',''DRAF'',''DITOLAK'',''PERLU_REVISI'')))',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['travel_costs','travel_proofs','travel_reports'] LOOP
 EXECUTE format('CREATE POLICY actual_write ON %I FOR UPDATE TO simpro_api USING(app.is_trip_participant(travel_order_id) AND EXISTS(SELECT FROM travel_orders t WHERE t.id=travel_order_id AND t.status IN (''DISETUJUI'',''DISETUJUI_KAPRODI'')))',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['travel_proofs','travel_reports'] LOOP
 EXECUTE format('CREATE POLICY evidence_insert ON %I FOR INSERT TO simpro_api WITH CHECK(app.is_trip_participant(travel_order_id) AND EXISTS(SELECT FROM travel_orders t WHERE t.id=travel_order_id AND t.status IN (''DISETUJUI'',''DISETUJUI_KAPRODI'')))',t);
 END LOOP;
END $$;

CREATE POLICY rps_read ON rps_submissions FOR SELECT TO simpro_api USING(dosen_penyusun_id=app.uid() OR app.rps_reviewer(id) OR app.acting('GKM','KAPRODI'));
CREATE POLICY rps_create ON rps_submissions FOR INSERT TO simpro_api WITH CHECK(dosen_penyusun_id=app.uid() AND app.acting('DOSEN'));
CREATE POLICY rps_update ON rps_submissions FOR UPDATE TO simpro_api USING(dosen_penyusun_id=app.uid() OR app.rps_reviewer(id) OR app.acting('GKM','KAPRODI'));
CREATE POLICY versions_read ON rps_versions FOR SELECT TO simpro_api USING(EXISTS(SELECT FROM rps_submissions WHERE id=rps_submission_id));
CREATE POLICY versions_write ON rps_versions FOR INSERT TO simpro_api WITH CHECK(EXISTS(SELECT FROM rps_submissions WHERE id=rps_submission_id AND dosen_penyusun_id=app.uid()));
CREATE POLICY reviews_read ON rps_reviews FOR SELECT TO simpro_api USING(EXISTS(SELECT FROM rps_submissions WHERE id=rps_submission_id));
CREATE POLICY reviews_assign ON rps_reviews FOR INSERT TO simpro_api WITH CHECK(app.acting('GKM','KAPRODI') OR (reviewer_id=app.uid() AND app.rps_reviewer(rps_submission_id)));
CREATE POLICY reviews_change ON rps_reviews FOR UPDATE TO simpro_api USING(reviewer_id=app.uid() AND app.acting('DOSEN'));
CREATE POLICY checklist_read ON rps_review_items FOR SELECT TO simpro_api USING(EXISTS(SELECT FROM rps_reviews WHERE id=rps_review_id));
CREATE POLICY checklist_add ON rps_review_items FOR INSERT TO simpro_api WITH CHECK(app.acting('KAPRODI','GKM') OR EXISTS(SELECT FROM rps_reviews WHERE id=rps_review_id AND reviewer_id=app.uid()));
CREATE POLICY checklist_change ON rps_review_items FOR UPDATE TO simpro_api USING(EXISTS(SELECT FROM rps_reviews WHERE id=rps_review_id AND reviewer_id=app.uid()));

CREATE POLICY case_read ON complaints FOR SELECT TO simpro_api USING(app.case_access(id));
CREATE POLICY case_change ON complaints FOR UPDATE TO simpro_api USING(app.case_access(id));
CREATE POLICY case_messages ON complaint_messages FOR SELECT TO simpro_api USING(app.case_access(complaint_id));
CREATE POLICY staff_reply ON complaint_messages FOR INSERT TO simpro_api WITH CHECK(app.case_access(complaint_id) AND sender_id=app.uid() AND sender_type='PETUGAS');
CREATE POLICY case_dispositions ON complaint_dispositions FOR SELECT TO simpro_api USING(app.case_access(complaint_id));
CREATE POLICY case_assign ON complaint_dispositions FOR INSERT TO simpro_api WITH CHECK(app.case_access(complaint_id) AND app.acting('PENGELOLA_ADUAN','PETUGAS_KEKERASAN','KAPRODI'));
CREATE POLICY upload_read ON attachments FOR SELECT TO simpro_api,simpro_public USING(app.attachment_allowed(entity_type,entity_id,false));
CREATE POLICY upload_create ON attachments FOR INSERT TO simpro_api,simpro_public WITH CHECK(app.attachment_allowed(entity_type,entity_id,true));

GRANT SELECT,INSERT ON complaints,complaint_messages,attachments TO simpro_public;
GRANT SELECT ON complaint_dispositions TO simpro_public;
GRANT UPDATE(rating_kepuasan,komentar_kepuasan,status,lampiran_url) ON complaints TO simpro_public;
CREATE POLICY ticket_read ON complaints FOR SELECT TO simpro_public USING(kode_tiket_hash=nullif(current_setting('app.ticket_hash',true),''));
CREATE POLICY ticket_create ON complaints FOR INSERT TO simpro_public WITH CHECK(kode_tiket_hash=nullif(current_setting('app.new_ticket',true),'') AND status='DITERIMA' AND kode_tiket IS NULL);
CREATE POLICY ticket_update ON complaints FOR UPDATE TO simpro_public USING(app.ticket_case(id)) WITH CHECK(app.ticket_case(id));
CREATE POLICY ticket_thread ON complaint_messages FOR SELECT TO simpro_public USING(app.ticket_case(complaint_id) AND NOT is_catatan_internal);
CREATE POLICY ticket_reply ON complaint_messages FOR INSERT TO simpro_public WITH CHECK(app.ticket_case(complaint_id) AND sender_type='PELAPOR' AND sender_id IS NULL AND NOT is_catatan_internal);

-- Metadata is intentionally visible to Kaprodi without granting access to the complaint row.
CREATE VIEW simpro_case_metadata WITH (security_barrier=true) AS SELECT * FROM v_complaint_metadata
 WHERE app.acting('KAPRODI') OR app.case_access(id);
REVOKE ALL ON simpro_case_metadata FROM PUBLIC,anon,authenticated;
GRANT SELECT ON simpro_case_metadata TO simpro_api;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['academic_periods','courses','course_classes','partner_institutions','student_placements'] LOOP
 EXECUTE format('CREATE POLICY references_read ON %I FOR SELECT TO simpro_api USING(app.uid() IS NOT NULL)',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['partner_surveys','survey_questions','partner_invitations','partner_responses','partner_response_items'] LOOP
 EXECUTE format('CREATE POLICY survey_read ON %I FOR SELECT TO simpro_api USING(app.acting(''KAPRODI''))',t);
 EXECUTE format('CREATE POLICY survey_manage ON %I TO simpro_api USING(app.acting(''KOORDINATOR_KP'',''KOORDINATOR_PSI'',''KOORDINATOR_PDLK'',''KOORDINATOR_KP_PSI_PDLK''))',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['rka_documents','rka_versions','rka_activities','rka_budget_items','rka_realizations'] LOOP
 EXECUTE format('CREATE POLICY budget_read ON %I FOR SELECT TO simpro_api USING(app.acting(''ADMIN_PRODI'',''KAPRODI''))',t);
 EXECUTE format('CREATE POLICY budget_write ON %I TO simpro_api USING(app.acting(''KAPRODI''))',t);
 END LOOP;
END $$;
CREATE POLICY record_spending ON rka_realizations FOR INSERT TO simpro_api WITH CHECK(app.acting('ADMIN_PRODI') AND dicatat_oleh=app.uid());
CREATE POLICY class_eval ON course_evaluations TO simpro_api USING(app.owns_course_class(course_class_id) OR app.acting('KAPRODI','GKM'));
CREATE POLICY feedback_read ON course_feedback_summaries FOR SELECT TO simpro_api USING(app.owns_course_class(course_class_id) OR app.acting('KAPRODI','GKM'));
CREATE POLICY improve ON course_improvement_plans TO simpro_api USING(EXISTS(SELECT FROM course_evaluations e WHERE e.id=evaluation_id) OR app.acting('KAPRODI','GKM'));
CREATE POLICY grade_access ON course_evaluation_grades TO simpro_api USING(EXISTS(SELECT FROM course_evaluations e WHERE e.id=evaluation_id));
CREATE POLICY cpmk_access ON cpmk_evaluations TO simpro_api USING(EXISTS(SELECT FROM course_evaluations e WHERE e.id=evaluation_id));

-- Public partner invitations are also served using the restricted public role.
GRANT SELECT ON partner_invitations,partner_surveys,survey_questions,partner_responses,partner_response_items TO simpro_public;
GRANT INSERT ON partner_responses,partner_response_items TO simpro_public;
GRANT UPDATE(is_completed,status) ON partner_invitations TO simpro_public;
CREATE POLICY survey_ticket ON partner_invitations FOR SELECT TO simpro_public USING(token=nullif(current_setting('app.survey_token',true),'') AND status NOT IN ('DIBATALKAN','KEDALUWARSA') AND coalesce(kedaluwarsa_at,expired_at)>now());
CREATE POLICY survey_finish ON partner_invitations FOR UPDATE TO simpro_public USING(token=nullif(current_setting('app.survey_token',true),'') AND NOT is_completed) WITH CHECK(is_completed);
CREATE POLICY survey_template ON partner_surveys FOR SELECT TO simpro_public USING(EXISTS(SELECT FROM partner_invitations i WHERE i.survey_id=partner_surveys.id));
CREATE POLICY survey_questions_read ON survey_questions FOR SELECT TO simpro_public USING(EXISTS(SELECT FROM partner_invitations i WHERE i.survey_id=survey_questions.survey_id));
CREATE POLICY survey_response ON partner_responses TO simpro_public USING(EXISTS(SELECT FROM partner_invitations i WHERE i.id=invitation_id AND NOT i.is_completed));
CREATE POLICY survey_answers ON partner_response_items TO simpro_public USING(EXISTS(SELECT FROM partner_responses r WHERE r.id=response_id));
