package permit

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/redis/go-redis/v9"
	"strconv"
	"strings"
	"sync"
	"time"
)

var ErrQuota = errors.New("kuota aduan harian tercapai")
var ErrInvalid = errors.New("permit tidak valid atau kedaluwarsa")

type PermitManager struct {
	key   []byte
	redis *redis.Client
	mu    sync.Mutex
	date  string
	quota map[string]int
}

func NewPermitManager(secret string) *PermitManager {
	key := []byte(secret)
	if len(key) == 0 {
		key = make([]byte, 32)
		if _, err := rand.Read(key); err != nil {
			panic(err)
		}
	}
	return &PermitManager{key: key, quota: make(map[string]int)}
}
func NewShared(secret string, r *redis.Client) *PermitManager {
	m := NewPermitManager(secret)
	m.redis = r
	return m
}
func Digest(key []byte, value string) string {
	m := hmac.New(sha256.New, key)
	m.Write([]byte(value))
	return hex.EncodeToString(m.Sum(nil))
}
func TicketHash(key []byte, ticket string) string {
	return Digest(key, strings.ToUpper(strings.TrimSpace(ticket)))
}

var takeQuota = redis.NewScript(`
local n=tonumber(redis.call('GET',KEYS[1]) or '0')
if n >= tonumber(ARGV[1]) then return 0 end
redis.call('INCR',KEYS[1])
redis.call('EXPIREAT',KEYS[1],ARGV[2])
return 1`)

func (m *PermitManager) Issue(ctx context.Context, userID string, limit int) (string, time.Time, error) {
	now := time.Now().In(time.FixedZone("WIB", 7*3600))
	date := now.Format("2006-01-02")
	key := Digest(m.key, "quota:"+date+":"+userID)
	if m.redis != nil {
		end := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
		n, err := takeQuota.Run(ctx, m.redis, []string{"simpro:quota:" + key}, limit, end.Unix()).Int()
		if err != nil {
			return "", time.Time{}, errors.New("layanan kuota tidak tersedia")
		}
		if n != 1 {
			return "", time.Time{}, ErrQuota
		}
	} else {
		m.mu.Lock()
		defer m.mu.Unlock()
		if m.date != date {
			clear(m.quota)
			m.date = date
		}
		if m.quota[key] >= limit {
			return "", time.Time{}, ErrQuota
		}
		m.quota[key]++
	}
	var nonce [24]byte
	if _, err := rand.Read(nonce[:]); err != nil {
		return "", time.Time{}, err
	}
	exp := now.Add(15 * time.Minute)
	payload := fmt.Sprintf("%d.%s", exp.Unix(), base64.RawURLEncoding.EncodeToString(nonce[:]))
	return payload + "." + Digest(m.key, "permit:"+payload), exp, nil
}

// Verify returns an opaque replay key. The repository spends it in the same transaction as the complaint.
func (m *PermitManager) Verify(token string) (string, time.Time, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 || len(token) > 160 {
		return "", time.Time{}, ErrInvalid
	}
	expected := Digest(m.key, "permit:"+parts[0]+"."+parts[1])
	if !hmac.Equal([]byte(parts[2]), []byte(expected)) {
		return "", time.Time{}, ErrInvalid
	}
	unix, err := strconv.ParseInt(parts[0], 10, 64)
	exp := time.Unix(unix, 0)
	if err != nil || !time.Now().Before(exp) || time.Until(exp) > 15*time.Minute {
		return "", time.Time{}, ErrInvalid
	}
	return Digest(m.key, "spent:"+parts[1]), exp, nil
}
