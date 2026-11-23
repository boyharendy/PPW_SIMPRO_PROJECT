package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"simpro-backend/internal/model"
	"simpro-backend/internal/storage"
)

func TestRestoreLegacyComplaintAttachment(t *testing.T) {
	dsn := os.Getenv("SIMPRO_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("requires an isolated migrated database")
	}
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil || !strings.HasPrefix(cfg.ConnConfig.Database, "simpro_test_") {
		t.Fatal("expected a dedicated test database")
	}
	ctx := context.Background()
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	exec := func(query string, args ...any) {
		t.Helper()
		if _, err := pool.Exec(ctx, query, args...); err != nil {
			t.Fatal(err)
		}
	}
	first, second, id := uuid.NewString(), uuid.NewString(), uuid.NewString()
	oldURL := "/archive/" + uuid.NewString()
	exec("INSERT INTO complaints(id,nomor_aduan,judul,isi_aduan,lampiran_url) VALUES ($1,$3,'Fixture','Fixture',$5),($2,$4,'Fixture','Fixture',$5)", first, second, "LAP-"+first, "LAP-"+second, oldURL)
	defer exec("DELETE FROM complaints WHERE id=$1 OR id=$2", first, second)
	exec("INSERT INTO attachments(id,entity_type,entity_id,file_name,file_url,mime_type,file_size) VALUES ($1,'COMPLAINT',$2,'original.pdf',$3,'application/pdf',0)", id, first, oldURL)
	defer exec("DELETE FROM attachments WHERE id=$1", id)
	path := filepath.Join(t.TempDir(), "archive.pdf")
	if err := os.WriteFile(path, []byte("%PDF-1.4\nfixture\n%%EOF"), 0600); err != nil {
		t.Fatal(err)
	}
	f, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	objects := storage.NewMemory("/test")
	item := oldAttachment{id, "original.pdf", model.AttachmentEntityComplaint}
	for range 2 {
		if err := restoreOne(ctx, pool, objects, item, f); err != nil {
			t.Fatal(err)
		}
	}
	var key, name, link, unrelated string
	err = pool.QueryRow(ctx, "SELECT a.object_key,a.file_name,c.lampiran_url,d.lampiran_url FROM attachments a JOIN complaints c ON c.id=a.entity_id JOIN complaints d ON d.id=$2 WHERE a.id=$1", id, second).Scan(&key, &name, &link, &unrelated)
	if err != nil {
		t.Fatal(err)
	}
	if name != "lampiran.pdf" || link != id || unrelated != oldURL {
		t.Fatal("legacy references were not preserved within the proper parent")
	}
	if _, err := objects.Sign(ctx, key); err != nil {
		t.Fatal(err)
	}
}
