// Package identity authenticates SIMPRO requests against the shared Supabase project.
package identity

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"simpro-backend/internal/model"
)

var ErrSession = errors.New("sesi tidak valid atau profil belum memperoleh akses")

type Provider struct {
	issuer, key string
	http        *http.Client
	pool        *pgxpool.Pool
	mu          sync.Mutex
	keys        map[string]any
	fetched     time.Time
}

func New(url, key string, pool *pgxpool.Pool) *Provider {
	return &Provider{issuer: strings.TrimRight(url, "/") + "/auth/v1", key: key, http: &http.Client{Timeout: 10 * time.Second}, pool: pool}
}
func (p *Provider) call(ctx context.Context, method, path, token string, input, output any) error {
	var body io.Reader
	if input != nil {
		raw, err := json.Marshal(input)
		if err != nil {
			return err
		}
		body = bytes.NewReader(raw)
	}
	req, err := http.NewRequestWithContext(ctx, method, p.issuer+path, body)
	if err != nil {
		return err
	}
	req.Header.Set("apikey", p.key)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := p.http.Do(req)
	if err != nil {
		return errors.New("layanan autentikasi tidak tersedia")
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return ErrSession
	}
	if output != nil {
		return json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(output)
	}
	return nil
}

type jwk struct{ Kid, Kty, Crv, X, Y, N, E string }

func (k jwk) publicKey() any {
	number := func(s string) *big.Int {
		b, err := base64.RawURLEncoding.DecodeString(s)
		if err != nil {
			return new(big.Int)
		}
		return new(big.Int).SetBytes(b)
	}
	switch k.Kty {
	case "EC":
		x, y := number(k.X), number(k.Y)
		if k.Crv == "P-256" && elliptic.P256().IsOnCurve(x, y) {
			return &ecdsa.PublicKey{Curve: elliptic.P256(), X: x, Y: y}
		}
	case "RSA":
		n, e := number(k.N), number(k.E)
		if n.BitLen() >= 2048 && e.IsInt64() && e.Int64() >= 3 && e.BitLen() <= 31 {
			return &rsa.PublicKey{N: n, E: int(e.Int64())}
		}
	}
	return nil
}
func (p *Provider) keyFor(ctx context.Context, kid string) (any, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	age := time.Since(p.fetched)
	if k := p.keys[kid]; k != nil && age < 5*time.Minute {
		return k, nil
	}
	if age < 10*time.Second {
		return nil, ErrSession
	}
	p.fetched = time.Now()
	p.keys = nil
	var data struct{ Keys []jwk }
	if err := p.call(ctx, "GET", "/.well-known/jwks.json", "", nil, &data); err != nil {
		return nil, err
	}
	p.keys = map[string]any{}
	for _, k := range data.Keys {
		if key := k.publicKey(); key != nil {
			p.keys[k.Kid] = key
		}
	}
	if k := p.keys[kid]; k != nil {
		return k, nil
	}
	return nil, ErrSession
}

type claims struct {
	SessionID string `json:"session_id"`
	jwt.RegisteredClaims
}

func (p *Provider) verify(ctx context.Context, raw string) (*claims, error) {
	c := new(claims)
	_, err := jwt.ParseWithClaims(raw, c, func(t *jwt.Token) (any, error) {
		kid, _ := t.Header["kid"].(string)
		if kid == "" {
			return nil, ErrSession
		}
		return p.keyFor(ctx, kid)
	}, jwt.WithValidMethods([]string{"ES256", "RS256"}), jwt.WithAudience("authenticated"), jwt.WithIssuer(p.issuer), jwt.WithExpirationRequired())
	if err != nil || uuid.Validate(c.SessionID) != nil || uuid.Validate(c.Subject) != nil {
		return nil, ErrSession
	}
	return c, nil
}
func (p *Provider) profile(ctx context.Context, c *claims) (*model.User, error) {
	var user model.User
	var data []byte
	err := p.pool.QueryRow(ctx, "select app.session_profile($1,$2)", c.Subject, c.SessionID).Scan(&data)
	if err != nil || len(data) == 0 || json.Unmarshal(data, &user) != nil || !user.IsActive || user.ActiveRole == "" {
		return nil, ErrSession
	}
	return &user, nil
}
func (p *Provider) Authenticate(ctx context.Context, token string) (*model.User, error) {
	c, err := p.verify(ctx, token)
	if err != nil {
		return nil, err
	}
	return p.profile(ctx, c)
}
func (p *Provider) exchange(ctx context.Context, grant string, body any) (*model.AuthResponse, error) {
	var tokens model.AuthTokens
	if err := p.call(ctx, "POST", "/token?grant_type="+grant, "", body, &tokens); err != nil {
		return nil, err
	}
	user, err := p.Authenticate(ctx, tokens.AccessToken)
	if err != nil {
		return nil, err
	}
	return &model.AuthResponse{User: user, Tokens: &tokens}, nil
}
func (p *Provider) Login(ctx context.Context, req *model.LoginRequest) (*model.AuthResponse, error) {
	return p.exchange(ctx, "password", req)
}
func (p *Provider) Refresh(ctx context.Context, req *model.RefreshTokenRequest) (*model.AuthTokens, error) {
	out, err := p.exchange(ctx, "refresh_token", req)
	if err != nil {
		return nil, err
	}
	return out.Tokens, nil
}
func (p *Provider) Register(ctx context.Context, req *model.RegisterRequest) error {
	return p.call(ctx, "POST", "/signup", "", map[string]any{"email": req.Email, "password": req.Password, "data": map[string]string{"nama_lengkap": req.NamaLengkap}}, nil)
}
func (p *Provider) Switch(ctx context.Context, token string, role model.Role) (*model.AuthResponse, error) {
	c, err := p.verify(ctx, token)
	if err != nil {
		return nil, err
	}
	var ok bool
	err = p.pool.QueryRow(ctx, "select app.switch_session_role($1,$2,$3)", c.Subject, c.SessionID, role).Scan(&ok)
	if err != nil || !ok {
		return nil, ErrSession
	}
	u, err := p.profile(ctx, c)
	if err != nil {
		return nil, err
	}
	return &model.AuthResponse{User: u, Tokens: &model.AuthTokens{AccessToken: token, TokenType: "Bearer", ExpiresIn: int64(time.Until(c.ExpiresAt.Time).Seconds())}}, nil
}
func (p *Provider) Logout(ctx context.Context, token string) error {
	c, err := p.verify(ctx, token)
	if err != nil {
		return err
	}
	if _, err = p.pool.Exec(ctx, "select app.revoke_session($1,$2)", c.Subject, c.SessionID); err != nil {
		return ErrSession
	}
	return p.call(ctx, "POST", "/logout?scope=local", token, nil, nil)
}
