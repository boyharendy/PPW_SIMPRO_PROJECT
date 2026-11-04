package database_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"simpro-backend/internal/database"
)

type TestProfile struct {
	ID          string `json:"id"`
	NamaLengkap string `json:"nama_lengkap"`
	Email       string `json:"email"`
}

func TestNewSupabaseClient_Empty(t *testing.T) {
	client := database.NewSupabaseClient("", "")
	if client != nil {
		t.Errorf("expected nil client for empty URL, got %+v", client)
	}
}

func TestSupabaseClient_Select(t *testing.T) {
	// Mock Supabase HTTP server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("apikey") != "test-key" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if r.URL.Path != "/rest/v1/profiles" {
			http.NotFound(w, r)
			return
		}

		profiles := []TestProfile{
			{ID: "1", NamaLengkap: "Kaprodi Test", Email: "kaprodi@test.com"},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(profiles)
	}))
	defer mockServer.Close()

	client := database.NewSupabaseClient(mockServer.URL, "test-key")
	if client == nil {
		t.Fatal("failed to create client")
	}

	var results []TestProfile
	err := client.Select("profiles", map[string]string{"select": "*"}, &results)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(results) != 1 || results[0].Email != "kaprodi@test.com" {
		t.Errorf("unexpected results: %+v", results)
	}
}

func TestSupabaseClient_Count(t *testing.T) {
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Range", "0-4/5")
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
	}))
	defer mockServer.Close()

	client := database.NewSupabaseClient(mockServer.URL, "test-key")
	count, err := client.Count("profiles", nil)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if count != 5 {
		t.Errorf("expected count 5, got %d", count)
	}
}

