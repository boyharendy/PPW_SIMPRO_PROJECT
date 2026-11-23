package identity

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestProviderJWT(t *testing.T) {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/auth/v1/.well-known/jwks.json" {
			http.NotFound(w, r)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"keys": []map[string]string{{"kid": "fixture", "kty": "EC", "crv": "P-256", "x": base64.RawURLEncoding.EncodeToString(key.X.FillBytes(make([]byte, 32))), "y": base64.RawURLEncoding.EncodeToString(key.Y.FillBytes(make([]byte, 32)))}}})
	}))
	defer server.Close()
	p := New(server.URL, "fixture", nil)
	for _, tc := range []struct {
		name, issuer, audience string
		life                   time.Duration
		valid                  bool
	}{
		{"configured provider", p.issuer, "authenticated", time.Minute, true},
		{"different issuer", "https://different.invalid", "authenticated", time.Minute, false},
		{"different audience", p.issuer, "other", time.Minute, false}, {"expired", p.issuer, "authenticated", -time.Minute, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			c := claims{SessionID: uuid.NewString(), RegisteredClaims: jwt.RegisteredClaims{Subject: uuid.NewString(), Issuer: tc.issuer, Audience: jwt.ClaimStrings{tc.audience}, ExpiresAt: jwt.NewNumericDate(time.Now().Add(tc.life))}}
			token := jwt.NewWithClaims(jwt.SigningMethodES256, c)
			token.Header["kid"] = "fixture"
			raw, err := token.SignedString(key)
			if err != nil {
				t.Fatal(err)
			}
			_, err = p.verify(context.Background(), raw)
			if (err == nil) != tc.valid {
				t.Fatalf("unexpected validity for %s", tc.name)
			}
		})
	}
}
