package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort          string
	ServerEnv           string
	APIPrefix           string
	FrontendURL         string
	JWTSecret           string
	JWTExpirationHours  int
	JWTRefreshDays      int
	DatabaseURL         string
	DBHost              string
	DBPort              string
	DBUser              string
	DBPassword          string
	DBName              string
	DBSSLMode           string
	SupabaseURL         string
	SupabaseAnonKey     string
	SupabaseServiceKey  string
}

func LoadConfig() *Config {
	// Try loading environment files in order of precedence:
	_ = godotenv.Load(".env.local")
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../frontend/.env.local")

	port := getEnv("SERVER_PORT", "8080")
	env := getEnv("SERVER_ENV", "development")
	prefix := getEnv("API_PREFIX", "/api/v1")
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:3000")
	jwtSecret := getEnv("JWT_SECRET", "simpro_secret_jwt_key_default_2026")

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

	supabaseURL := getEnv("NEXT_PUBLIC_SUPABASE_URL", getEnv("SUPABASE_URL", ""))
	supabaseAnonKey := getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", getEnv("SUPABASE_ANON_KEY", ""))
	supabaseServiceKey := getEnv("SUPABASE_SERVICE_ROLE_KEY", "")

	return &Config{
		ServerPort:         port,
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
