package repository

import (
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"simpro-backend/internal/model"
)

type UserRepository interface {
	FindAll(search string, page, limit int) ([]*model.User, int, error)
	FindByID(id string) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	Create(user *model.User) (*model.User, error)
	Update(id string, user *model.User) (*model.User, error)
	Delete(id string) error
}

type memoryUserRepository struct {
	mu    sync.RWMutex
	users map[string]*model.User
}

func NewMemoryUserRepository() UserRepository {
	repo := &memoryUserRepository{
		users: make(map[string]*model.User),
	}

	// Seed default Kaprodi / Dosen user for development
	hashedPass, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	defaultUser := &model.User{
		ID:          "u1",
		NamaLengkap: "Dr. Eng. Dosen Kaprodi, S.T., M.Eng.",
		Email:       "kaprodi@universitas.ac.id",
		Password:    string(hashedPass),
		Roles: []model.Role{
			model.RoleKaprodi,
			model.RoleGKM,
			model.RoleKoordKP,
			model.RoleKoordTA,
			model.RoleKoordMagang,
			model.RoleDosen,
			model.RoleMahasiswa,
			model.RoleHimpunan,
		},
		ActiveRole: model.RoleKaprodi,
		IsActive:   true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	repo.users[defaultUser.ID] = defaultUser

	return repo
}

func (r *memoryUserRepository) FindAll(search string, page, limit int) ([]*model.User, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []*model.User
	searchLower := strings.ToLower(search)

	for _, u := range r.users {
		if search == "" ||
			strings.Contains(strings.ToLower(u.NamaLengkap), searchLower) ||
			strings.Contains(strings.ToLower(u.Email), searchLower) {
			filtered = append(filtered, u)
		}
	}

	total := len(filtered)
	if limit <= 0 {
		limit = 10
	}
	if page <= 0 {
		page = 1
	}

	start := (page - 1) * limit
	if start >= total {
		return []*model.User{}, total, nil
	}

	end := start + limit
	if end > total {
		end = total
	}

	return filtered[start:end], total, nil
}

func (r *memoryUserRepository) FindByID(id string) (*model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	u, exists := r.users[id]
	if !exists {
		return nil, errors.New("user not found")
	}
	return u, nil
}

func (r *memoryUserRepository) FindByEmail(email string) (*model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.users {
		if strings.EqualFold(u.Email, email) {
			return u, nil
		}
	}
	return nil, errors.New("user not found")
}

func (r *memoryUserRepository) Create(user *model.User) (*model.User, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if user.ID == "" {
		user.ID = uuid.New().String()
	}
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	r.users[user.ID] = user
	return user, nil
}

func (r *memoryUserRepository) Update(id string, user *model.User) (*model.User, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	existing, exists := r.users[id]
	if !exists {
		return nil, errors.New("user not found")
	}

	if user.NamaLengkap != "" {
		existing.NamaLengkap = user.NamaLengkap
	}
	if user.ActiveRole != "" {
		existing.ActiveRole = user.ActiveRole
	}
	if len(user.Roles) > 0 {
		existing.Roles = user.Roles
	}
	existing.UpdatedAt = time.Now()

	return existing, nil
}

func (r *memoryUserRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.users[id]; !exists {
		return errors.New("user not found")
	}

	delete(r.users, id)
	return nil
}
