package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"simpro-backend/internal/model"
)

type JWTClaims struct {
	UserID              string       `json:"user_id"`
	Email               string       `json:"email"`
	Roles               []model.Role `json:"roles"`
	ActiveRole          model.Role   `json:"active_role"`
	PenangananKekerasan bool         `json:"penanganan_kekerasan"`
	jwt.RegisteredClaims
}

func GenerateTokens(user *model.User, secretKey string, expHours int, refreshDays int) (*model.AuthTokens, error) {
	expDuration := time.Duration(expHours) * time.Hour
	accessExpiry := time.Now().Add(expDuration)

	// Access Token Claims
	claims := JWTClaims{
		UserID:              user.ID,
		Email:               user.Email,
		Roles:               user.Roles,
		ActiveRole:          user.ActiveRole,
		PenangananKekerasan: user.PenangananKekerasan,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExpiry),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID,
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedAccessToken, err := accessToken.SignedString([]byte(secretKey))
	if err != nil {
		return nil, err
	}

	// Refresh Token Claims
	refreshDuration := time.Duration(refreshDays) * 24 * time.Hour
	refreshExpiry := time.Now().Add(refreshDuration)

	refreshClaims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(refreshExpiry),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Subject:   user.ID,
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedRefreshToken, err := refreshToken.SignedString([]byte(secretKey))
	if err != nil {
		return nil, err
	}

	return &model.AuthTokens{
		AccessToken:  signedAccessToken,
		RefreshToken: signedRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(expDuration.Seconds()),
	}, nil
}

func ValidateToken(tokenString string, secretKey string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
