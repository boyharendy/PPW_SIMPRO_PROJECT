package database_test

import (
	"context"
	"testing"
	"time"

	"simpro-backend/internal/database"
)

func TestInitDB_EmptyURL(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	pool, err := database.NewPostgresPool(ctx, "")
	if err == nil {
		if pool != nil {
			pool.Close()
		}
		t.Errorf("expected error for empty database URL, got nil")
	}
}

func TestInitDB_InvalidURL(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	pool, err := database.NewPostgresPool(ctx, "invalid-postgres-connection-string")
	if err == nil {
		if pool != nil {
			pool.Close()
		}
		t.Errorf("expected error for invalid database URL, got nil")
	}
}

func TestPing_NilPool(t *testing.T) {
	ctx := context.Background()
	err := database.Ping(ctx, nil)
	if err == nil {
		t.Errorf("expected error when pinging nil pool, got nil")
	}
}
