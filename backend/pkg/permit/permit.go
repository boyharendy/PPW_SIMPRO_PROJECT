package permit

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"math/rand"
	"strconv"
	"strings"
	"sync"
	"time"
)

type PermitManager struct {
	secretKey     []byte
	mu            sync.Mutex
	userQuota     map[string]int       // key: userHash -> count today
	quotaDate     string               // YYYY-MM-DD
	usedTokens    map[string]time.Time // prevent token replay
}

func NewPermitManager(secret string) *PermitManager {
	if secret == "" {
		secret = "simpro-complaint-permit-secret-key-2026"
	}
	return &PermitManager{
		secretKey:  []byte(secret),
		userQuota:  make(map[string]int),
		quotaDate:  time.Now().Format("2006-01-02"),
		usedTokens: make(map[string]time.Time),
	}
}

// IssuePermit generates a 15-minute anonymous token for an authenticated student
func (m *PermitManager) IssuePermit(userID string) (token string, expiresAt time.Time, err error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	today := time.Now().Format("2006-01-02")
	if today != m.quotaDate {
		m.userQuota = make(map[string]int)
		m.quotaDate = today
		// clean expired used tokens
		now := time.Now()
		for k, exp := range m.usedTokens {
			if now.After(exp) {
				delete(m.usedTokens, k)
			}
		}
	}

	// Compute user pseudo-hash (no direct PII retained)
	userHash := m.computeHMAC(userID + ":" + today)
	if m.userQuota[userHash] >= 5 {
		return "", time.Time{}, errors.New("kuota pengajuan aduan harian Anda (maksimal 5 kali) telah tercapai")
	}

	m.userQuota[userHash]++

	issuedAt := time.Now().Unix()
	nonce := rand.Int63()
	expiresAt = time.Unix(issuedAt, 0).Add(15 * time.Minute)

	payload := fmt.Sprintf("%d:%d", issuedAt, nonce)
	sig := m.computeHMAC(payload)

	rawToken := fmt.Sprintf("%s:%s", payload, sig)
	encodedToken := base64.RawURLEncoding.EncodeToString([]byte(rawToken))

	return encodedToken, expiresAt, nil
}

// ValidatePermit validates the anonymous token HMAC and 15-minute expiration
func (m *PermitManager) ValidatePermit(encodedToken string) error {
	if encodedToken == "" {
		return errors.New("permit token wajib disertakan")
	}

	rawBytes, err := base64.RawURLEncoding.DecodeString(encodedToken)
	if err != nil {
		return errors.New("format permit token tidak valid")
	}

	parts := strings.Split(string(rawBytes), ":")
	if len(parts) != 3 {
		return errors.New("struktur permit token tidak valid")
	}

	issuedAtStr, nonceStr, sig := parts[0], parts[1], parts[2]
	payload := fmt.Sprintf("%s:%s", issuedAtStr, nonceStr)
	expectedSig := m.computeHMAC(payload)

	if !hmac.Equal([]byte(sig), []byte(expectedSig)) {
		return errors.New("tanda tangan permit token tidak valid atau telah dimanipulasi")
	}

	issuedAt, err := strconv.ParseInt(issuedAtStr, 10, 64)
	if err != nil {
		return errors.New("waktu penerbitan permit tidak valid")
	}

	issuedTime := time.Unix(issuedAt, 0)
	if time.Since(issuedTime) > 15*time.Minute {
		return errors.New("permit token telah kedaluwarsa (berlaku maksimal 15 menit)")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	if _, used := m.usedTokens[encodedToken]; used {
		return errors.New("permit token ini sudah pernah digunakan")
	}

	// Mark token used until expiry
	m.usedTokens[encodedToken] = issuedTime.Add(15 * time.Minute)

	return nil
}

func (m *PermitManager) computeHMAC(data string) string {
	h := hmac.New(sha256.New, m.secretKey)
	h.Write([]byte(data))
	return fmt.Sprintf("%x", h.Sum(nil))
}

