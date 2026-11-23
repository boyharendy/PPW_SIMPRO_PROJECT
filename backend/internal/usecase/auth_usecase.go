package usecase

import (
	"crypto/sha256"
	"errors"
	"slices"
	"sync"

	"golang.org/x/crypto/bcrypt"
	"simpro-backend/internal/config"
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/pkg/utils"
)

type AuthUsecase interface {
	Authenticate(token string) (*model.User, error)
	Logout(token string) error
	Login(req *model.LoginRequest) (*model.AuthResponse, error)
	Register(req *model.RegisterRequest) (*model.AuthResponse, error)
	GetProfile(userID string) (*model.User, error)
	SwitchRole(userID string, role model.Role) (*model.AuthResponse, error)
	RefreshToken(refreshToken string) (*model.AuthTokens, error)
}

type localSession struct {
	role            model.Role
	access, refresh [32]byte
}
type authUsecase struct {
	mu       sync.Mutex
	sessions map[[32]byte]localSession
	userRepo repository.UserRepository
	cfg      *config.Config
}

func NewAuthUsecase(userRepo repository.UserRepository, cfg *config.Config) AuthUsecase {
	return &authUsecase{
		userRepo: userRepo, sessions: make(map[[32]byte]localSession),
		cfg: cfg,
	}
}

func (u *authUsecase) Login(req *model.LoginRequest) (*model.AuthResponse, error) {
	user, err := u.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("email atau password salah")
	}

	if !user.IsActive {
		return nil, errors.New("email atau password salah")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("email atau password salah")
	}

	tokens, err := u.start(user)
	if err != nil {
		return nil, errors.New("gagal membuat token autentikasi")
	}

	return &model.AuthResponse{
		User:   user,
		Tokens: tokens,
	}, nil
}

func (u *authUsecase) Register(req *model.RegisterRequest) (*model.AuthResponse, error) {
	if _, err := u.userRepo.FindByEmail(req.Email); err == nil {
		return nil, errors.New("email sudah terdaftar dalam sistem")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("gagal mengenkripsi password")
	}

	// NF-02: Self-registration strictly grants MAHASISWA. Administrative/academic roles are assigned by Kaprodi.
	roles := []model.Role{model.RoleMahasiswa}

	newUser := &model.User{
		NamaLengkap:    req.NamaLengkap,
		Email:          req.Email,
		Password:       string(hashedPassword),
		Roles:          roles,
		ActiveRole:     roles[0],
		IsActive:       true,
		AcademicStatus: "AKTIF",
	}

	createdUser, err := u.userRepo.Create(newUser)
	if err != nil {
		return nil, errors.New("gagal mendaftarkan pengguna baru")
	}

	tokens, err := u.start(createdUser)
	if err != nil {
		return nil, errors.New("gagal membuat token autentikasi")
	}

	return &model.AuthResponse{
		User:   createdUser,
		Tokens: tokens,
	}, nil
}

func (u *authUsecase) GetProfile(userID string) (*model.User, error) {
	return u.userRepo.FindByID(userID)
}

var errLocalSession = errors.New("sesi tidak valid")

func (u *authUsecase) start(user *model.User) (*model.AuthTokens, error) {
	u.mu.Lock()
	defer u.mu.Unlock()
	return u.issue(user)
}
func (u *authUsecase) issue(user *model.User) (*model.AuthTokens, error) {
	tokens, err := utils.GenerateTokens(user, u.cfg.JWTSecret, u.cfg.JWTExpirationHours, u.cfg.JWTRefreshDays)
	if err != nil {
		return nil, err
	}
	sess := localSession{role: user.ActiveRole, access: sha256.Sum256([]byte(tokens.AccessToken)), refresh: sha256.Sum256([]byte(tokens.RefreshToken))}
	u.sessions[sess.access] = sess
	u.sessions[sess.refresh] = sess
	return tokens, nil
}
func (u *authUsecase) lookup(token string, refresh bool) (*model.User, localSession, error) {
	key := sha256.Sum256([]byte(token))
	s, ok := u.sessions[key]
	if !ok || (refresh && key != s.refresh) || (!refresh && key != s.access) {
		return nil, s, errLocalSession
	}
	claims, err := utils.ValidateToken(token, u.cfg.JWTSecret)
	if err != nil {
		return nil, s, errLocalSession
	}
	user, err := u.userRepo.FindByID(claims.Subject)
	if err != nil || !user.IsActive || !slices.Contains(user.Roles, s.role) {
		return nil, s, errLocalSession
	}
	view := *user
	view.ActiveRole = s.role
	return &view, s, nil
}
func (u *authUsecase) Authenticate(token string) (*model.User, error) {
	u.mu.Lock()
	defer u.mu.Unlock()
	user, _, err := u.lookup(token, false)
	return user, err
}
func (u *authUsecase) forget(s localSession) {
	delete(u.sessions, s.access)
	delete(u.sessions, s.refresh)
}
func (u *authUsecase) Logout(token string) error {
	u.mu.Lock()
	defer u.mu.Unlock()
	_, s, err := u.lookup(token, false)
	if err == nil {
		u.forget(s)
	}
	return err
}
func (u *authUsecase) SwitchRole(token string, role model.Role) (*model.AuthResponse, error) {
	u.mu.Lock()
	defer u.mu.Unlock()
	user, s, err := u.lookup(token, false)
	if err != nil {
		return nil, err
	}
	if !slices.Contains(user.Roles, role) {
		return nil, errLocalSession
	}
	user.ActiveRole = role
	tokens, err := u.issue(user)
	if err != nil {
		return nil, err
	}
	u.forget(s)
	return &model.AuthResponse{User: user, Tokens: tokens}, nil
}
func (u *authUsecase) RefreshToken(token string) (*model.AuthTokens, error) {
	u.mu.Lock()
	defer u.mu.Unlock()
	user, s, err := u.lookup(token, true)
	if err != nil {
		return nil, err
	}
	tokens, err := u.issue(user)
	if err == nil {
		u.forget(s)
	}
	return tokens, err
}
