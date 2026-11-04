package repository_test

import (
	"os"
	"testing"

	"github.com/joho/godotenv"
	"simpro-backend/internal/database"
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

func getTestSupabaseClient(t *testing.T) *database.SupabaseClient {
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../../backend/.env")

	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" || serviceKey == "" {
		t.Skip("Supabase credentials not set, skipping test")
	}

	client := database.NewSupabaseClient(supabaseURL, serviceKey)
	if client == nil {
		t.Fatal("failed to create Supabase client")
	}
	return client
}

func TestSupabaseUserRepository_FindAll(t *testing.T) {
	client := getTestSupabaseClient(t)
	repo := repository.NewSupabaseUserRepository(client)

	users, total, err := repo.FindAll("", 1, 10)
	if err != nil {
		t.Fatalf("FindAll failed: %v", err)
	}

	if total < 5 {
		t.Errorf("expected at least 5 users in total, got %d", total)
	}

	if len(users) < 5 {
		t.Errorf("expected at least 5 users returned, got %d", len(users))
	}

	// Verify roles were loaded
	foundKaprodi := false
	for _, u := range users {
		if u.Email == "kaprodi@univ.ac.id" {
			foundKaprodi = true
			if len(u.Roles) == 0 {
				t.Errorf("expected Kaprodi to have roles, got 0")
			}
		}
	}
	if !foundKaprodi {
		t.Errorf("kaprodi@univ.ac.id not found in user list")
	}
}

func TestSupabaseUserRepository_FindByEmail(t *testing.T) {
	client := getTestSupabaseClient(t)
	repo := repository.NewSupabaseUserRepository(client)

	user, err := repo.FindByEmail("kaprodi@univ.ac.id")
	if err != nil {
		t.Fatalf("FindByEmail failed: %v", err)
	}

	if user.NamaLengkap != "Dr. Ahmad Fauzi, M.T." {
		t.Errorf("unexpected name: %s", user.NamaLengkap)
	}

	if len(user.Roles) == 0 {
		t.Errorf("expected user roles, got 0")
	}
}

func TestSupabaseUserRepository_FindByID(t *testing.T) {
	client := getTestSupabaseClient(t)
	repo := repository.NewSupabaseUserRepository(client)

	user, err := repo.FindByID("a0000000-0000-0000-0000-000000000001")
	if err != nil {
		t.Fatalf("FindByID failed: %v", err)
	}

	if user.Email != "kaprodi@univ.ac.id" {
		t.Errorf("unexpected email: %s", user.Email)
	}
}

func TestSupabaseUserRepository_NotFound(t *testing.T) {
	client := getTestSupabaseClient(t)
	repo := repository.NewSupabaseUserRepository(client)

	_, err := repo.FindByEmail("non-existent-user-999@univ.ac.id")
	if err == nil {
		t.Errorf("expected error for non-existent email, got nil")
	}

	_, err = repo.FindByID("00000000-0000-0000-0000-000000000999")
	if err == nil {
		t.Errorf("expected error for non-existent ID, got nil")
	}
}

func TestSupabaseUserRepository_CreateUpdateDelete(t *testing.T) {
	client := getTestSupabaseClient(t)
	repo := repository.NewSupabaseUserRepository(client)

	testEmail := "unittest_user@univ.ac.id"
	// Clean up if previous run failed
	if existing, _ := repo.FindByEmail(testEmail); existing != nil {
		_ = repo.Delete(existing.ID)
	}

	newUser := &model.User{
		NamaLengkap: "Unit Test User",
		Email:       testEmail,
		Roles:       []model.Role{model.RoleDosen},
		IsActive:    true,
	}

	created, err := repo.Create(newUser)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	if created.ID == "" {
		t.Fatal("expected non-empty user ID")
	}

	// Update user
	created.NamaLengkap = "Unit Test User Updated"
	updated, err := repo.Update(created.ID, created)
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	if updated.NamaLengkap != "Unit Test User Updated" {
		t.Errorf("expected updated name, got %s", updated.NamaLengkap)
	}

	// Delete user
	err = repo.Delete(created.ID)
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	// Verify deletion
	_, err = repo.FindByID(created.ID)
	if err == nil {
		t.Errorf("expected user not found after deletion, got nil error")
	}
}
