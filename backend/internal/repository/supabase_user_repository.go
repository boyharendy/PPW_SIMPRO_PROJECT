package repository

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"simpro-backend/internal/database"
	"simpro-backend/internal/model"
)

type dbProfile struct {
	ID          string     `json:"id"`
	NomorInduk  string     `json:"nomor_induk"`
	NamaLengkap string     `json:"nama_lengkap"`
	Email       string     `json:"email"`
	Tipe        string     `json:"tipe_pengguna"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type dbUserRole struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

type supabaseUserRepository struct {
	client *database.SupabaseClient
}

// NewSupabaseUserRepository creates a UserRepository powered by Supabase REST API
func NewSupabaseUserRepository(client *database.SupabaseClient) UserRepository {
	return &supabaseUserRepository{client: client}
}

func (r *supabaseUserRepository) FindAll(search string, page, limit int) ([]*model.User, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	offset := (page - 1) * limit
	queryParams := map[string]string{
		"select": "*",
		"limit":  fmt.Sprintf("%d", limit),
		"offset": fmt.Sprintf("%d", offset),
		"order":  "created_at.desc",
	}

	countParams := map[string]string{}

	if strings.TrimSpace(search) != "" {
		filter := fmt.Sprintf("or=(nama_lengkap.ilike.*%s*,email.ilike.*%s*)", search, search)
		queryParams[filter] = ""
		countParams[filter] = ""
	}

	var profiles []dbProfile
	if err := r.client.Select("profiles", queryParams, &profiles); err != nil {
		return nil, 0, fmt.Errorf("gagal query profiles: %w", err)
	}

	total, err := r.client.Count("profiles", countParams)
	if err != nil {
		total = len(profiles)
	}

	users := make([]*model.User, len(profiles))
	for i, p := range profiles {
		roles, _ := r.fetchRolesForUser(p.ID)
		activeRole := model.RoleMahasiswa
		if len(roles) > 0 {
			activeRole = roles[0]
		}

		users[i] = &model.User{
			ID:          p.ID,
			NamaLengkap: p.NamaLengkap,
			Email:       p.Email,
			Roles:       roles,
			ActiveRole:  activeRole,
			IsActive:    p.IsActive,
			CreatedAt:   p.CreatedAt,
			UpdatedAt:   p.UpdatedAt,
		}
	}

	return users, total, nil
}

func (r *supabaseUserRepository) FindByID(id string) (*model.User, error) {
	var profiles []dbProfile
	err := r.client.Select("profiles", map[string]string{
		"id":    fmt.Sprintf("eq.%s", id),
		"limit": "1",
	}, &profiles)

	if err != nil {
		return nil, fmt.Errorf("gagal query user by ID: %w", err)
	}

	if len(profiles) == 0 {
		return nil, errors.New("user not found")
	}

	p := profiles[0]
	roles, _ := r.fetchRolesForUser(p.ID)
	activeRole := model.RoleMahasiswa
	if len(roles) > 0 {
		activeRole = roles[0]
	}

	return &model.User{
		ID:          p.ID,
		NamaLengkap: p.NamaLengkap,
		Email:       p.Email,
		Roles:       roles,
		ActiveRole:  activeRole,
		IsActive:    p.IsActive,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}, nil
}

func (r *supabaseUserRepository) FindByEmail(email string) (*model.User, error) {
	var profiles []dbProfile
	err := r.client.Select("profiles", map[string]string{
		"email": fmt.Sprintf("eq.%s", strings.TrimSpace(email)),
		"limit": "1",
	}, &profiles)

	if err != nil {
		return nil, fmt.Errorf("gagal query user by email: %w", err)
	}

	if len(profiles) == 0 {
		return nil, errors.New("user not found")
	}

	p := profiles[0]
	roles, _ := r.fetchRolesForUser(p.ID)
	activeRole := model.RoleMahasiswa
	if len(roles) > 0 {
		activeRole = roles[0]
	}

	return &model.User{
		ID:          p.ID,
		NamaLengkap: p.NamaLengkap,
		Email:       p.Email,
		Roles:       roles,
		ActiveRole:  activeRole,
		IsActive:    p.IsActive,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}, nil
}

func (r *supabaseUserRepository) Create(user *model.User) (*model.User, error) {
	if user.ID == "" {
		user.ID = uuid.New().String()
	}

	nomorInduk := fmt.Sprintf("USR-%s", user.ID[:8])
	profilePayload := map[string]interface{}{
		"id":           user.ID,
		"nomor_induk":  nomorInduk,
		"nama_lengkap": user.NamaLengkap,
		"email":        user.Email,
		"is_active":    user.IsActive,
	}

	var inserted []dbProfile
	if err := r.client.Insert("profiles", profilePayload, &inserted); err != nil {
		return nil, fmt.Errorf("gagal insert profile: %w", err)
	}

	// Insert roles
	for _, role := range user.Roles {
		rolePayload := map[string]interface{}{
			"user_id": user.ID,
			"role":    string(role),
		}
		_ = r.client.Insert("user_roles", rolePayload, nil)
	}

	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	return user, nil
}

func (r *supabaseUserRepository) Update(id string, user *model.User) (*model.User, error) {
	updatePayload := map[string]interface{}{}
	if user.NamaLengkap != "" {
		updatePayload["nama_lengkap"] = user.NamaLengkap
	}
	updatePayload["is_active"] = user.IsActive

	var updated []dbProfile
	err := r.client.Update("profiles", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	}, updatePayload, &updated)

	if err != nil {
		return nil, fmt.Errorf("gagal update profile: %w", err)
	}

	if len(updated) == 0 {
		return nil, errors.New("user not found")
	}

	return r.FindByID(id)
}

func (r *supabaseUserRepository) Delete(id string) error {
	return r.client.Delete("profiles", map[string]string{
		"id": fmt.Sprintf("eq.%s", id),
	})
}

func (r *supabaseUserRepository) fetchRolesForUser(userID string) ([]model.Role, error) {
	var dbRoles []dbUserRole
	err := r.client.Select("user_roles", map[string]string{
		"user_id": fmt.Sprintf("eq.%s", userID),
	}, &dbRoles)

	if err != nil {
		return nil, err
	}

	roles := make([]model.Role, 0, len(dbRoles))
	for _, r := range dbRoles {
		roles = append(roles, model.Role(r.Role))
	}
	return roles, nil
}

