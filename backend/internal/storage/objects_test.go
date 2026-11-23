package storage

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestPrivateStorage(t *testing.T) {
	const body = "fixture bytes"
	stored := ""
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer fixture-private" {
			t.Error("storage credential missing")
		}
		switch r.URL.Path {
		case "/storage/v1/object/simpro-private/document.pdf":
			b, _ := io.ReadAll(r.Body)
			stored = string(b)
			w.WriteHeader(201)
		case "/storage/v1/object/sign/simpro-private/document.pdf":
			var input struct{ ExpiresIn int }
			_ = json.NewDecoder(r.Body).Decode(&input)
			if input.ExpiresIn != 300 {
				t.Error("unexpected expiry")
			}
			_ = json.NewEncoder(w).Encode(map[string]string{"signedURL": "/object/sign/simpro-private/document.pdf?token=fixture"})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	s := NewSupabase(server.URL, "fixture-private")
	if err := s.Put(context.Background(), "document.pdf", "application/pdf", []byte(body)); err != nil || stored != body {
		t.Fatal("bytes not persisted")
	}
	link, err := s.Sign(context.Background(), "document.pdf")
	if err != nil || !strings.HasPrefix(link, server.URL+"/storage/v1/object/sign/") {
		t.Fatal("invalid signed file response")
	}
}
