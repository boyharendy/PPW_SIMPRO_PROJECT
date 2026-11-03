package usecase

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
	"simpro-backend/internal/config"
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/pkg/utils"
)

type AuthUsecase interface {
	Login(req *model.LoginRequest) (*model.AuthResponse, error)
	Register(req *model.RegisterRequest) (*model.AuthResponse, error)
	GetProfile(userID string) (*model.User, error)
	SwitchRole(userID string, role model.Role) (*model.User, error)
	RefreshToken(refreshToken string) (*model.AuthTokens, error)
}

type authUsecase struct {
	userRepo repository.UserRepository
	cfg      *config.Config
}

func NewAuthUsecase(userRepo repository.UserRepository, cfg *config.Config) AuthUsecase {
	return &authUsecase{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (u *authUsecase) Login(req *model.LoginRequest) (*model.AuthResponse, error) {
	user, err := u.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("email atau password salah")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("email atau password salah")
	}

	tokens, err := utils.GenerateTokens(user, u.cfg.JWTSecret, u.cfg.JWTExpirationHours, u.cfg.JWTRefreshDays)
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

	roles := req.Roles
	if len(roles) == 0 {
		roles = []model.Role{model.RoleMahasiswa}
	}

	newUser := &model.User{
		NamaLengkap: req.NamaLengkap,
		Email:       req.Email,
		Password:    string(hashedPassword),
		Roles:       roles,
		ActiveRole:  roles[0],
		IsActive:    true,
	}

	createdUser, err := u.userRepo.Create(newUser)
	if err != nil {
		return nil, errors.New("gagal mendaftarkan pengguna baru")
	}

	tokens, err := utils.GenerateTokens(createdUser, u.cfg.JWTSecret, u.cfg.JWTExpirationHours, u.cfg.JWTRefreshDays)
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

func (u *authUsecase) SwitchRole(userID string, role model.Role) (*model.User, error) {
	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	// Verify user has the requested role
	hasRole := false
	for _, r := range user.Roles {
		if r == role {
			hasRole = true
			break
		}
	}
	if !hasRole {
		return nil, errors.New("anda tidak memiliki hak akses untuk peran ini")
	}

	user.ActiveRole = role
	return u.userRepo.Update(userID, user)
}

func (u *authUsecase) RefreshToken(refreshToken string) (*model.AuthTokens, error) {
	claims, err := utils.ValidateToken(refreshToken, u.cfg.JWTSecret)
	if err != nil {
		return nil, errors.New("refresh token tidak valid atau sudah kadaluarsa")
	}

	user, err := u.userRepo.FindByID(claims.Subject)
	if err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	return utils.GenerateTokens(user, u.cfg.JWTSecret, u.cfg.JWTExpirationHours, u.cfg.JWTRefreshDays)
}
