package config

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	RedisURL           string
	PermitSecret       string
	TicketPepper       string
	ServerHost         string
	ServerPort         string
	ServerEnv          string
	APIPrefix          string
	FrontendURL        string
	JWTSecret          string
	JWTExpirationHours int
	JWTRefreshDays     int
	DatabaseURL        string
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBSSLMode          string
	SupabaseURL        string
	SupabaseAnonKey    string
	SupabaseServiceKey string
}

func LoadConfig() *Config {
	// Muat konfigurasi server privat dari backend/.env
	_ = godotenv.Load(".env")
	_ = godotenv.Load("backend/.env")

	port := getEnv("SERVER_PORT", "8080")
	env := getEnv("SERVER_ENV", "production")
	prefix := getEnv("API_PREFIX", "/api/v1")
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:3000")
	jwtSecret := getEnv("JWT_SECRET", "")

	jwtExpHours, _ := strconv.Atoi(getEnv("JWT_EXPIRATION_HOURS", "24"))
	if jwtExpHours <= 0 {
		jwtExpHours = 24
	}

	jwtRefreshDays, _ := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRATION_DAYS", "7"))
	if jwtRefreshDays <= 0 {
		jwtRefreshDays = 7
	}

	dbURL := getEnv("DATABASE_URL", "")
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPass := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "postgres")
	dbSSL := getEnv("DB_SSLMODE", "require")

	supabaseURL := getEnv("SUPABASE_URL", "")
	supabaseAnonKey := getEnv("SUPABASE_ANON_KEY", "")
	supabaseServiceKey := getEnv("SUPABASE_SERVICE_ROLE_KEY", "")

	return &Config{
		ServerHost: os.Getenv("SERVER_HOST"),
		ServerPort: port,
		RedisURL:   os.Getenv("REDIS_URL"), PermitSecret: os.Getenv("PERMIT_SECRET"),
		TicketPepper:       os.Getenv("TICKET_PEPPER"),
		ServerEnv:          env,
		APIPrefix:          prefix,
		FrontendURL:        frontendURL,
		JWTSecret:          jwtSecret,
		JWTExpirationHours: jwtExpHours,
		JWTRefreshDays:     jwtRefreshDays,
		DatabaseURL:        dbURL,
		DBHost:             dbHost,
		DBPort:             dbPort,
		DBUser:             dbUser,
		DBPassword:         dbPass,
		DBName:             dbName,
		DBSSLMode:          dbSSL,
		SupabaseURL:        supabaseURL,
		SupabaseAnonKey:    supabaseAnonKey,
		SupabaseServiceKey: supabaseServiceKey,
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func (c *Config) Local() bool { return c.ServerEnv == "development" || c.ServerEnv == "test" }

func (c *Config) Validate() error {
	if c.Local() {
		for _, value := range []*string{&c.JWTSecret, &c.PermitSecret, &c.TicketPepper} {
			if *value == "" {
				var key [32]byte
				if _, err := rand.Read(key[:]); err != nil {
					return err
				}
				*value = hex.EncodeToString(key[:])
			}
		}
		return nil
	}
	if c.ServerEnv != "production" && c.ServerEnv != "staging" {
		return errors.New("SERVER_ENV tidak dikenal")
	}
	u, err := url.Parse(c.SupabaseURL)
	if err != nil || u.Scheme != "https" || u.Host == "" || c.RedisURL == "" || c.DatabaseURL == "" || c.SupabaseAnonKey == "" || c.SupabaseServiceKey == "" {
		return errors.New("konfigurasi Supabase Auth, Storage dan PostgreSQL wajib diisi")
	}
	if c.SupabaseAnonKey == c.SupabaseServiceKey || strings.Contains(c.SupabaseServiceKey, "your-service-role") || strings.Contains(c.DatabaseURL, "[YOUR-PASSWORD]") {
		return errors.New("isi kredensial layanan yang sebenarnya")
	}
	if len(c.PermitSecret) < 32 || len(c.TicketPepper) < 32 || c.PermitSecret == c.TicketPepper || strings.Contains(c.PermitSecret, "change-me") || strings.Contains(c.TicketPepper, "change-me") {
		return errors.New("PERMIT_SECRET dan TICKET_PEPPER wajib berupa dua kunci acak terpisah minimal 32 byte")
	}
	return nil
}
