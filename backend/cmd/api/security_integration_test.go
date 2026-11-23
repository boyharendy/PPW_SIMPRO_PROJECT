package main

import (
	"bytes"
	"context"
	"image"
	"image/png"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"simpro-backend/internal/database"
	"simpro-backend/internal/model"
	"simpro-backend/internal/storage"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/permit"
)

// The test needs only an isolated, migrated database. All fixture changes roll back.
func TestSecurityPostgres(t *testing.T) {
	dsn := os.Getenv("SIMPRO_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set SIMPRO_TEST_DATABASE_URL to an isolated database")
	}
	ctx := context.Background()
	cfg, err := pgx.ParseConfig(dsn)
	if err != nil || !strings.HasPrefix(cfg.Database, "simpro_test_") {
		t.Fatal("expected a dedicated simpro_test_ database")
	}
	conn, err := pgx.ConnectConfig(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close(ctx)
	tx, err := conn.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback(ctx)
	check := func(err error) {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
	}
	exec := func(sql string, args ...any) { t.Helper(); _, err := tx.Exec(ctx, sql, args...); check(err) }
	profile := func(role string) string {
		t.Helper()
		id := uuid.NewString()
		exec("INSERT INTO profiles(id,nomor_induk,nama_lengkap,email,tipe_pengguna,is_active) VALUES($1,$2,'Fixture',$3,'DOSEN',true)", id, id, id+"@example.test")
		exec("INSERT INTO user_roles(user_id,role) VALUES($1,$2)", id, role)
		return id
	}
	owner := profile("DOSEN")
	other := profile("DOSEN")
	head := profile("KAPRODI")
	staff := profile("PENGELOLA_ADUAN")
	handler := profile("PENGELOLA_ADUAN")
	exec("UPDATE user_roles SET penanganan_kekerasan=true WHERE user_id=$1", handler)
	scoped := &database.TxStore{Ctx: ctx, Tx: tx}
	r := fromStore(scoped)
	actor := func(id, role string) {
		t.Helper()
		exec("RESET ROLE")
		if id == "" {
			exec("SET LOCAL ROLE simpro_public")
		} else {
			exec("SET LOCAL ROLE simpro_api")
		}
		exec("SELECT set_config('app.user_id',$1,true),set_config('app.active_role',$2,true),set_config('app.ticket_hash','',true),set_config('app.new_ticket','',true)", id, role)
		scoped.InternalRequest = id != ""
	}
	manager := permit.NewPermitManager("")
	pepper := []byte("unit-test-only-pepper")
	cases := usecase.NewSecureComplaints(r.complaints, manager, pepper)
	token, _, err := manager.Issue(ctx, uuid.NewString(), 3)
	check(err)
	actor("", "")
	files := usecase.NewPrivateAttachments(ctx, r.files, r.admin, storage.NewMemory("/api/v1"), nil)
	pdf := []byte("%PDF-1.4\nfixture\n%%EOF")
	f, err := files.Prepare(bytes.NewReader(pdf), "fixture.pdf", int64(len(pdf)))
	check(err)
	c, err := cases.CreatePublicComplaint(&model.PublicComplaintRequest{Kategori: model.ComplaintCatPerundunganKekerasan, Judul: "Judul privat", IsiAduan: "Isi privat", PermitToken: token, LampiranURL: f.ID()})
	check(err)
	if c.KodeTiket == "" || c.NomorAduan == c.KodeTiket {
		t.Fatal("receipt and internal number must differ")
	}
	_, err = files.Save(f, model.AttachmentEntityComplaint, c.ID, nil)
	check(err)
	actor(handler, "PENGELOLA_ADUAN")
	full, err := cases.GetComplaintByID(c.ID, model.RolePengelolaAduan, true)
	check(err)
	if full.IsiAduan == "" || full.KodeTiket != "" {
		t.Fatal("handler projection")
	}
	check(cases.AddInternalMessage(c.ID, handler, model.RolePengelolaAduan, "Catatan privat", true))
	check(cases.AddInternalMessage(c.ID, handler, model.RolePengelolaAduan, "Tanggapan biasa", false))
	actor(head, "KAPRODI")
	meta, err := cases.GetComplaintByID(c.ID, model.RoleKaprodi, false)
	check(err)
	if meta.Judul != "" || meta.IsiAduan != "" || meta.LampiranURL != "" || len(meta.Messages) != 0 {
		t.Fatal("metadata disclosure")
	}
	if _, err = files.GetAttachmentURL(f.ID()); err == nil {
		t.Fatal("sensitive attachment visible to leadership")
	}
	actor(staff, "PENGELOLA_ADUAN")
	if _, err = cases.GetComplaintByID(c.ID, model.RolePengelolaAduan, false); err == nil {
		t.Fatal("ordinary handler can read sensitive case")
	}
	actor("", "")
	view, err := cases.GetPublicComplaint(c.KodeTiket)
	check(err)
	if len(view.Messages) != 1 || view.Messages[0].Pesan != "Tanggapan biasa" {
		t.Fatal("unexpected public thread")
	}
	_, err = files.GetAttachmentURL(f.ID())
	check(err)
	if _, err = cases.GetPublicComplaint(c.NomorAduan); err == nil {
		t.Fatal("internal number accepted as ticket")
	}
	if _, err = files.GetAttachmentURL(f.ID()); err == nil {
		t.Fatal("attachment visible without its ticket")
	}

	exec("RESET ROLE")
	doc, pos := uuid.NewString(), uuid.NewString()
	exec("INSERT INTO rka_documents(id,tahun_anggaran,pagu_total,status) VALUES($1,2088,2000,'AKTIF')", doc)
	exec("INSERT INTO rka_budget_items(id,rka_id,kode_mata_anggaran,nama_kegiatan,kategori,anggaran_alokasi) VALUES($1,$2,'R-1','Dinas uji','DINAS',2000)", pos, doc)
	trips := usecase.NewTripUsecase(r.trips, r.rka)
	actor(owner, "DOSEN")
	options, err := trips.BudgetOptions()
	check(err)
	foundBudget := false
	for _, item := range options {
		if item.ID == pos && item.SisaAnggaran == 2000 {
			foundBudget = true
		}
	}
	if !foundBudget {
		t.Fatal("active budget option missing")
	}
	costs := []*model.TravelCost{{Komponen: "TRANSPORTASI", NominalEstimasi: 120}, {Komponen: "AKOMODASI", NominalEstimasi: 20}, {Komponen: "UANG_HARIAN"}}
	trip, err := trips.CreateTrip(owner, &model.TravelOrder{NomorSuratTugas: "ST-" + uuid.NewString(), Tujuan: "Kampus", Keperluan: "Rapat", TanggalBerangkat: "2026-01-01", TanggalKembali: "2026-01-02", SumberDana: "RKA_PRODI", RkaBudgetItemID: pos, Costs: costs, TotalEstimasiBiaya: 999})
	check(err)
	check(trips.UpdateCosts(trip.ID, costs))
	check(trips.SubmitTrip(trip.ID))
	actor(other, "DOSEN")
	if _, err = trips.GetTripByID(trip.ID); err == nil {
		t.Fatal("unrelated lecturer can see trip")
	}
	actor(head, "KAPRODI")
	check(trips.DecideTrip(trip.ID, head, model.TripDecision{Status: model.TripStatusPerluRevisi, Catatan: "Periksa rincian"}))
	actor(owner, "DOSEN")
	check(trips.UpdateCosts(trip.ID, costs))
	check(trips.SubmitTrip(trip.ID))
	actor(head, "KAPRODI")
	check(trips.DecideTrip(trip.ID, head, model.TripDecision{Status: model.TripStatusDisetujuiKaprodi, SuratTugas: "ST-FIXTURE"}))
	actor(owner, "DOSEN")
	costs[0].NominalRealisasi = 105
	check(trips.UpdateRealizationCosts(trip.ID, costs))
	var photo bytes.Buffer
	check(png.Encode(&photo, image.NewRGBA(image.Rect(0, 0, 2, 2))))
	for _, proof := range []struct {
		name, kind string
		data       []byte
	}{{"foto.png", "FOTO_KEGIATAN", photo.Bytes()}, {"tiket.pdf", "TIKET", pdf}} {
		prepared, err := files.Prepare(bytes.NewReader(proof.data), proof.name, int64(len(proof.data)))
		check(err)
		attachment, err := files.Save(prepared, model.AttachmentEntityBusinessTrip, trip.ID, &owner)
		check(err)
		check(trips.AddProof(trip.ID, &model.TravelProof{Kategori: proof.kind, FileName: proof.name, FileURL: attachment.ID, UploadedBy: owner}))
	}
	check(trips.SubmitReport(trip.ID, owner, "Selesai", "", 999))
	actor(head, "KAPRODI")
	exec("SAVEPOINT missing_private_photo")
	exec("RESET ROLE")
	exec("UPDATE attachments SET object_key=NULL WHERE entity_type='BUSINESS_TRIP' AND entity_id=$1 AND mime_type='image/png'", trip.ID)
	actor(head, "KAPRODI")
	if _, err := trips.ConfirmTrip(trip.ID, head); err == nil {
		t.Fatal("historical proof without private bytes accepted")
	}
	exec("ROLLBACK TO SAVEPOINT missing_private_photo")
	completed, err := trips.ConfirmTrip(trip.ID, head)
	check(err)
	if completed.TotalEstimasiBiaya != 140 || completed.TotalRealisasiBiaya != 105 {
		t.Fatal("totals must match persisted costs")
	}
	var postings int
	var amount float64
	check(tx.QueryRow(ctx, "SELECT count(*),coalesce(sum(nominal),0) FROM rka_realizations WHERE travel_order_id=$1", trip.ID).Scan(&postings, &amount))
	if postings != 1 || amount != 105 {
		t.Fatal("incorrect RKA posting")
	}
	exec("SAVEPOINT repeated_confirmation")
	if _, err = trips.ConfirmTrip(trip.ID, head); err == nil {
		t.Fatal("repeat confirmation accepted")
	}
	exec("ROLLBACK TO SAVEPOINT repeated_confirmation")
	check(tx.QueryRow(ctx, "SELECT anggaran_terpakai FROM rka_budget_items WHERE id=$1", pos).Scan(&amount))
	if amount != 105 {
		t.Fatal("incorrect RKA balance")
	}
	recap, err := trips.GetRecap()
	check(err)
	if recap.PerKomponen["TRANSPORTASI"] == nil {
		t.Fatal("recap omits components")
	}

	actor(owner, "DOSEN")
	publications := usecase.NewPublicationUsecase(r.pubs)
	pub, err := publications.CreatePublication(owner, &model.Publication{Judul: "Naskah uji", Tipe: "JURNAL", TahunTerbit: 2026, VerifikatorID: other, Authors: []*model.PublicationAuthor{{NamaPenulis: "Pembimbing", UserID: other, TipePenulis: "DOSEN", Peran: "PEMBIMBING", Urutan: 1}}})
	check(err)
	exec("SET CONSTRAINTS ALL IMMEDIATE")
	actor(staff, "PENGELOLA_ADUAN")
	if _, err = r.pubs.FindByID(pub.ID); err == nil {
		t.Fatal("unrelated publication visible")
	}
	actor(other, "DOSEN")
	check(publications.VerifyPublication(pub.ID, model.PubStatusTerverifikasi, other, "Diterima"))
	exec("RESET ROLE")
	course := uuid.NewString()
	exec("INSERT INTO courses(id,kode_mk,nama_mk,sks) VALUES($1,$2,'Matakuliah uji',3)", course, "X"+course[:6])
	var period string
	check(tx.QueryRow(ctx, "SELECT id::text FROM academic_periods LIMIT 1").Scan(&period))
	exec("INSERT INTO course_classes(course_id,academic_period_id,kode_kelas,dosen_pengampu_id) VALUES($1,$2,$3,$4)", course, period, "test-"+uuid.NewString(), owner)
	actor(owner, "DOSEN")
	rps := usecase.NewRpsUsecase(r.rps)
	sub, err := rps.CreateSubmission(owner, &model.RpsSubmission{CourseID: course, AcademicPeriodID: period, TahunAkademik: "2026/2027"})
	check(err)
	check(rps.SubmitForReview(sub.ID))
	actor(other, "DOSEN")
	if _, err = rps.GetSubmissionByID(sub.ID); err == nil {
		t.Fatal("unassigned RPS visible")
	}
	actor(head, "KAPRODI")
	check(rps.AssignReviewer(sub.ID, other))
	actor(other, "DOSEN")
	check(rps.ReviewSubmission(sub.ID, other, "Sesuai", "DISETUJUI"))
	exec("RESET ROLE")
	subject := uuid.NewString()
	session := uuid.NewString()
	exec("INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,$3)", subject, subject+"@example.test", time.Now())
	exec("INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)", session, subject)
	exec("UPDATE profiles SET auth_user_id=$1 WHERE id=$2", subject, owner)
	exec("SET LOCAL ROLE simpro_runtime")
	valid := func() bool {
		var ok bool
		check(tx.QueryRow(ctx, "SELECT app.session_profile($1,$2) IS NOT NULL", subject, session).Scan(&ok))
		return ok
	}
	if !valid() {
		t.Fatal("valid mapped session was rejected")
	}
	exec("RESET ROLE")
	exec("UPDATE profiles SET is_active=false WHERE id=$1", owner)
	exec("SET LOCAL ROLE simpro_runtime")
	if valid() {
		t.Fatal("disabled account still active")
	}
	exec("RESET ROLE")
	exec("UPDATE profiles SET is_active=true WHERE id=$1", owner)
	exec("SET LOCAL ROLE simpro_runtime")
	exec("SELECT app.revoke_session($1,$2)", subject, session)
	if valid() {
		t.Fatal("revoked session still active")
	}
	var direct bool
	check(tx.QueryRow(ctx, "SELECT has_table_privilege('authenticated','public.complaints','SELECT') OR has_table_privilege('anon','public.attachments','SELECT')").Scan(&direct))
	if direct {
		t.Fatal("direct public data API grants")
	}
}
