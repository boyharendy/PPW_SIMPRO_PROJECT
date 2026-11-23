package config

import (
	"strings"
	"testing"
)

func TestSecureModes(t *testing.T) {
	for _, mode := range []string{"production", "staging", "unknown"} {
		if (&Config{ServerEnv: mode}).Validate() == nil {
			t.Fatalf("incomplete %s configuration accepted", mode)
		}
	}
	c := Config{ServerEnv: "test"}
	if err := c.Validate(); err != nil || c.PermitSecret == c.JWTSecret || c.PermitSecret == c.TicketPepper {
		t.Fatal("local ephemeral keys")
	}
	c = Config{ServerEnv: "production", SupabaseURL: "https://campus.example.test", SupabaseAnonKey: "public", SupabaseServiceKey: "private", RedisURL: "rediss://quota", DatabaseURL: "postgres://simpro_runtime@db/app", PermitSecret: strings.Repeat("p", 32), TicketPepper: strings.Repeat("t", 32)}
	if err := c.Validate(); err != nil {
		t.Fatal(err)
	}
	c.TicketPepper = c.PermitSecret
	if c.Validate() == nil {
		t.Fatal("shared keys accepted")
	}
}
