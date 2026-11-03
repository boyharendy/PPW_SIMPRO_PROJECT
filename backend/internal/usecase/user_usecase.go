package usecase

import (
	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type UserUsecase interface {
	GetUsers(search string, page, limit int) ([]*model.User, int, error)
	GetUserByID(id string) (*model.User, error)
	UpdateUser(id string, user *model.User) (*model.User, error)
	DeleteUser(id string) error
}

type userUsecase struct {
	userRepo repository.UserRepository
}

func NewUserUsecase(userRepo repository.UserRepository) UserUsecase {
	return &userUsecase{userRepo: userRepo}
}

func (u *userUsecase) GetUsers(search string, page, limit int) ([]*model.User, int, error) {
	return u.userRepo.FindAll(search, page, limit)
}

func (u *userUsecase) GetUserByID(id string) (*model.User, error) {
	return u.userRepo.FindByID(id)
}

func (u *userUsecase) UpdateUser(id string, user *model.User) (*model.User, error) {
	return u.userRepo.Update(id, user)
}

func (u *userUsecase) DeleteUser(id string) error {
	return u.userRepo.Delete(id)
}
