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
}

func LoadConfig() *Config {
	// Load .env if present
	_ = godotenv.Load()

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

	return &Config{
		ServerPort:         port,
		ServerEnv:          env,
		APIPrefix:          prefix,
		FrontendURL:        frontendURL,
		JWTSecret:          jwtSecret,
		JWTExpirationHours: jwtExpHours,
		JWTRefreshDays:     jwtRefreshDays,
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
