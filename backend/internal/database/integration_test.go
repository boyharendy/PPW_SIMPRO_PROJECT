package database_test

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/joho/godotenv"
	"simpro-backend/internal/database"
)

func TestPostgresPool_Integration(t *testing.T) {
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../../backend/.env")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	pool, err := database.NewPostgresPool(ctx, dbURL)
	if err != nil {
		t.Skipf("direct postgres connection not reachable on current network: %v", err)
		return
	}
	defer pool.Close()

	if err := database.Ping(ctx, pool); err != nil {
		t.Fatalf("ping failed: %v", err)
	}

	var count int
	err = pool.QueryRow(ctx, "SELECT count(*) FROM profiles").Scan(&count)
	if err != nil {
		t.Fatalf("query profiles failed: %v", err)
	}

	if count < 5 {
		t.Errorf("expected at least 5 profiles, got %d", count)
	}
}

func TestSupabaseClient_LiveIntegration(t *testing.T) {
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../../backend/.env")

	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" || serviceKey == "" {
		t.Skip("Supabase credentials not set, skipping live test")
	}

	client := database.NewSupabaseClient(supabaseURL, serviceKey)
	if client == nil {
		t.Fatal("failed to initialize supabase client")
	}

	var profiles []TestProfile
	err := client.Select("profiles", map[string]string{
		"select": "id,nama_lengkap,email",
		"limit":  "5",
	}, &profiles)

	if err != nil {
		t.Fatalf("live query to Supabase failed: %v", err)
	}

	if len(profiles) < 5 {
		t.Errorf("expected at least 5 profiles in Supabase seed data, got %d", len(profiles))
	}
}
