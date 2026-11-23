// migrate-private converts legacy tickets and imports recovered attachment bytes.
// The operator supplies an owner connection separately from the API login.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"simpro-backend/internal/database"
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/storage"
	"simpro-backend/internal/usecase"
	"simpro-backend/pkg/permit"
)

func main() {
	apply := flag.Bool("apply", false, "write verified conversions; default only counts pending records")
	dir := flag.String("attachment-dir", "", "directory of recovered files named <attachment UUID>.<extension>")
	flag.Parse()
	if err := run(context.Background(), *apply, *dir); err != nil {
		log.Fatal(err)
	}
}
func run(ctx context.Context, apply bool, dir string) error {
	dsn := os.Getenv("MIGRATION_DATABASE_URL")
	if dsn == "" {
		return errors.New("MIGRATION_DATABASE_URL is required")
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return errors.New("invalid migration connection")
	}
	defer pool.Close()
	var privateCases, files int
	if err = pool.QueryRow(ctx, "SELECT count(*) FROM complaints WHERE nullif(kode_tiket,'') IS NOT NULL OR (nomor_aduan LIKE 'ADU-%' AND kode_tiket_hash IS NULL)").Scan(&privateCases); err != nil {
		return errors.New("cannot inspect legacy complaints")
	}
	if err = pool.QueryRow(ctx, "SELECT count(*) FROM attachments WHERE object_key IS NULL").Scan(&files); err != nil {
		return errors.New("cannot inspect legacy attachments")
	}
	fmt.Printf("Pending tickets: %d. Attachments without private bytes: %d.\n", privateCases, files)
	if !apply {
		return nil
	}
	if privateCases > 0 {
		key := os.Getenv("TICKET_PEPPER")
		if len(key) < 32 {
			return errors.New("supply the API ticket pepper")
		}
		if err = convertTickets(ctx, pool, []byte(key)); err != nil {
			return err
		}
	}
	if files == 0 || dir == "" {
		return nil
	}
	endpoint, key := os.Getenv("SUPABASE_URL"), os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if !strings.HasPrefix(endpoint, "https://") || key == "" {
		return errors.New("private storage configuration required")
	}
	return restoreFiles(ctx, pool, storage.NewSupabase(endpoint, key), dir)
}
func convertTickets(ctx context.Context, pool *pgxpool.Pool, key []byte) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return errors.New("cannot start migration")
	}
	defer tx.Rollback(ctx)
	rows, err := tx.Query(ctx, "SELECT id::text,coalesce(nullif(kode_tiket,''),nomor_aduan) FROM complaints WHERE nullif(kode_tiket,'') IS NOT NULL OR (nomor_aduan LIKE 'ADU-%' AND kode_tiket_hash IS NULL) ORDER BY id FOR UPDATE")
	if err != nil {
		return errors.New("cannot lock legacy tickets")
	}
	items, err := pgx.CollectRows(rows, pgx.RowToStructByPos[legacyTicket])
	if err != nil {
		return errors.New("cannot read legacy tickets")
	}
	for _, r := range items {
		_, err = tx.Exec(ctx, "UPDATE complaints SET kode_tiket_hash=$1,kode_tiket=NULL,nomor_aduan=CASE WHEN nomor_aduan=$2 OR nomor_aduan LIKE 'ADU-%' THEN $3 ELSE nomor_aduan END WHERE id=$4", permit.TicketHash(key, r.Code), r.Code, "LAP-"+uuid.NewString(), r.ID)
		if err != nil {
			return errors.New("ticket conversion rolled back; inspect duplicate legacy identifiers privately")
		}
	}
	if tx.Commit(ctx) != nil {
		return errors.New("cannot confirm ticket migration; run the count again")
	}
	return nil
}

type legacyTicket struct{ ID, Code string }
type oldAttachment struct {
	ID, Name string
	Kind     model.AttachmentEntityType
}

func restoreFiles(ctx context.Context, pool *pgxpool.Pool, objects storage.Objects, dir string) error {
	root, err := os.OpenRoot(dir)
	if err != nil {
		return errors.New("cannot open attachment archive")
	}
	defer root.Close()
	rows, err := pool.Query(ctx, "SELECT id::text,file_name,entity_type FROM attachments WHERE object_key IS NULL ORDER BY id")
	if err != nil {
		return errors.New("cannot list legacy attachments")
	}
	items, err := pgx.CollectRows(rows, pgx.RowToStructByPos[oldAttachment])
	if err != nil {
		return errors.New("cannot read attachment inventory")
	}
	restored, missing := 0, 0
	for _, item := range items {
		name := item.ID + strings.ToLower(filepath.Ext(item.Name))
		f, err := root.Open(name)
		if errors.Is(err, os.ErrNotExist) {
			missing++
			continue
		}
		if err != nil {
			return errors.New("cannot open recovered file")
		}
		err = restoreOne(ctx, pool, objects, item, f)
		f.Close()
		if err != nil {
			return err
		}
		restored++
	}
	fmt.Printf("Private files restored or already available: %d. Missing archive bytes: %d.\n", restored, missing)
	return nil
}
func restoreOne(ctx context.Context, pool *pgxpool.Pool, objects storage.Objects, item oldAttachment, f *os.File) error {
	info, err := f.Stat()
	if err != nil || !info.Mode().IsRegular() {
		return errors.New("archive entry must be a regular file")
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		return errors.New("cannot start attachment migration")
	}
	defer tx.Rollback(ctx)
	var current *string
	var parent, oldURL string
	if err = tx.QueryRow(ctx, "SELECT object_key,entity_id::text,coalesce(file_url,'') FROM attachments WHERE id=$1 FOR UPDATE", item.ID).Scan(&current, &parent, &oldURL); err != nil {
		return errors.New("cannot lock attachment")
	}
	if current != nil {
		return nil
	}
	store := &database.TxStore{Ctx: ctx, Tx: tx}
	files := usecase.NewPrivateAttachments(ctx, nil, repository.NewSupabaseAdminRepository(store), objects, nil)
	prepared, err := files.Prepare(f, item.Name, info.Size())
	if err != nil {
		return errors.New("recovered file failed content or size validation")
	}
	key, mime, size, err := prepared.Store(ctx, objects)
	if err != nil {
		return errors.New("cannot store recovered bytes")
	}
	_, err = tx.Exec(ctx, "UPDATE attachments SET object_key=$1,file_url='',mime_type=$2,file_size=$3,file_name=CASE WHEN entity_type IN ('COMPLAINT','COMPLAINT_MESSAGE') THEN $4 ELSE file_name END,uploaded_by=CASE WHEN entity_type IN ('COMPLAINT','COMPLAINT_MESSAGE') THEN NULL ELSE uploaded_by END,created_at=CASE WHEN entity_type IN ('COMPLAINT','COMPLAINT_MESSAGE') THEN date_trunc('day',created_at) ELSE created_at END WHERE id=$5", key, mime, size, "lampiran"+filepath.Ext(key), item.ID)
	if err == nil {
		err = relinkAttachment(ctx, tx, item, parent, oldURL)
	}
	if err != nil {
		_ = objects.Remove(ctx, key)
		return errors.New("cannot update attachment metadata")
	}
	if tx.Commit(ctx) != nil {
		return errors.New("cannot confirm imported attachment; reconcile private objects before retry")
	}
	return nil
}

// A private reference must agree with the legacy parent and the original URL.
// For a case or message with an empty reference, only a single direct attachment is unambiguous.
func relinkAttachment(ctx context.Context, tx pgx.Tx, item oldAttachment, parent, oldURL string) error {
	var query string
	switch item.Kind {
	case model.AttachmentEntityComplaint:
		query = "UPDATE complaints SET lampiran_url=$1 WHERE id=$2 AND "
	case model.AttachmentEntityComplaintMessage:
		query = "UPDATE complaint_messages SET lampiran_url=$1 WHERE id=$2 AND "
	case model.AttachmentEntityBusinessTrip:
		if oldURL == "" {
			return nil
		}
		_, err := tx.Exec(ctx, "UPDATE travel_proofs SET file_url=$1 WHERE travel_order_id=$2 AND file_url=$3", item.ID, parent, oldURL)
		return err
	default:
		return nil
	}
	query += "(lampiran_url=nullif($3,'') OR (nullif(lampiran_url,'') IS NULL AND 1=(SELECT count(*) FROM attachments WHERE entity_type=$4 AND entity_id=$2)))"
	_, err := tx.Exec(ctx, query, item.ID, parent, oldURL, string(item.Kind))
	return err
}
