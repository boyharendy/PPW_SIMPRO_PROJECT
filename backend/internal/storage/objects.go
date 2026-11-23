package storage

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"simpro-backend/pkg/permit"
	"strconv"
	"strings"
	"sync"
	"time"
)

const Bucket = "simpro-private"

type Objects interface {
	Put(context.Context, string, string, []byte) error
	Sign(context.Context, string) (string, error)
	Remove(context.Context, string) error
}
type Supabase struct {
	base, key string
	client    *http.Client
}

func NewSupabase(base, key string) *Supabase {
	return &Supabase{strings.TrimRight(base, "/") + "/storage/v1", key, &http.Client{Timeout: 30 * time.Second}}
}
func (s *Supabase) request(ctx context.Context, method, path, mime string, data []byte) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, method, s.base+path, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("apikey", s.key)
	req.Header.Set("Authorization", "Bearer "+s.key)
	req.Header.Set("Content-Type", mime)
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, errors.New("storage tidak tersedia")
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return nil, errors.New("operasi storage gagal")
	}
	return io.ReadAll(io.LimitReader(resp.Body, 1<<20))
}
func (s *Supabase) Put(ctx context.Context, key, mime string, data []byte) error {
	_, err := s.request(ctx, "POST", "/object/"+Bucket+"/"+url.PathEscape(key), mime, data)
	return err
}
func (s *Supabase) Remove(ctx context.Context, key string) error {
	_, err := s.request(ctx, "DELETE", "/object/"+Bucket+"/"+url.PathEscape(key), "", nil)
	return err
}
func (s *Supabase) Sign(ctx context.Context, key string) (string, error) {
	raw, err := s.request(ctx, "POST", "/object/sign/"+Bucket+"/"+url.PathEscape(key), "application/json", []byte(`{"expiresIn":300}`))
	if err != nil {
		return "", err
	}
	var result struct{ SignedURL string }
	if json.Unmarshal(raw, &result) != nil || !strings.HasPrefix(result.SignedURL, "/object/sign/"+Bucket+"/") {
		return "", errors.New("URL storage tidak valid")
	}
	return s.base + result.SignedURL, nil
}

type blob struct {
	data []byte
	mime string
}
type Memory struct {
	mu    sync.RWMutex
	items map[string]blob
	key   [32]byte
	base  string
}

func NewMemory(base string) *Memory {
	s := &Memory{items: map[string]blob{}, base: base}
	if _, err := rand.Read(s.key[:]); err != nil {
		panic(err)
	}
	return s
}
func (s *Memory) Put(_ context.Context, k, mime string, b []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[k] = blob{b, mime}
	return nil
}
func (s *Memory) Remove(_ context.Context, k string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, k)
	return nil
}
func (s *Memory) Sign(_ context.Context, k string) (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if _, ok := s.items[k]; !ok {
		return "", errors.New("berkas tidak tersedia")
	}
	exp := strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)
	return fmt.Sprintf("%s/attachments/local/%s?exp=%s&sig=%s", s.base, k, exp, permit.Digest(s.key[:], k+":"+exp)), nil
}
func (s *Memory) Open(k, exp, sig string) ([]byte, string, bool) {
	end, err := strconv.ParseInt(exp, 10, 64)
	if err != nil || end <= time.Now().Unix() || !hmac.Equal([]byte(sig), []byte(permit.Digest(s.key[:], k+":"+exp))) {
		return nil, "", false
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	b, ok := s.items[k]
	return b.data, b.mime, ok
}
