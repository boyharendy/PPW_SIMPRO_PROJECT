package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestUserUsecase_CRUD(t *testing.T) {
	memRepo := repository.NewMemoryUserRepository()
	uc := usecase.NewUserUsecase(memRepo)

	// 1. GetUsers
	users, total, err := uc.GetUsers("", 1, 10)
	if err != nil {
		t.Fatalf("GetUsers failed: %v", err)
	}
	if total == 0 || len(users) == 0 {
		t.Fatalf("expected seeded user in memory repo, got 0")
	}

	// 2. CreateUser
	newUser := &model.User{
		NamaLengkap: "Budi Usecase Test",
		Email:       "budi_uc@univ.ac.id",
		Roles:       []model.Role{model.RoleDosen},
		IsActive:    true,
	}
	created, err := uc.CreateUser(newUser)
	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if created.ID == "" {
		t.Errorf("expected non-empty ID")
	}

	// 3. GetUserByID
	found, err := uc.GetUserByID(created.ID)
	if err != nil {
		t.Fatalf("GetUserByID failed: %v", err)
	}
	if found.Email != "budi_uc@univ.ac.id" {
		t.Errorf("expected budi_uc@univ.ac.id, got %s", found.Email)
	}

	// 4. UpdateUser
	found.NamaLengkap = "Budi Updated"
	updated, err := uc.UpdateUser(found.ID, found)
	if err != nil {
		t.Fatalf("UpdateUser failed: %v", err)
	}
	if updated.NamaLengkap != "Budi Updated" {
		t.Errorf("expected updated name, got %s", updated.NamaLengkap)
	}

	// 5. DeleteUser
	err = uc.DeleteUser(found.ID)
	if err != nil {
		t.Fatalf("DeleteUser failed: %v", err)
	}

	// 6. GetRoles
	roles := uc.GetAvailableRoles()
	if len(roles) != 14 {
		t.Errorf("expected 14 roles per PRD, got %d", len(roles))
	}
}

