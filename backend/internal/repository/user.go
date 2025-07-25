package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/mouizahmed/justscribe-backend/internal/database"
	"github.com/mouizahmed/justscribe-backend/internal/models"
)

type UserRepository struct {
	db *database.DB
}

func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(user *models.User) error {
	query := `
		INSERT INTO users (id, email, name, avatar_url, plan, status, email_verified, api_quota_used, api_quota_limit, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	
	_, err := r.db.Exec(query,
		user.ID,
		user.Email,
		user.Name,
		user.AvatarURL,
		user.Plan,
		user.Status,
		user.EmailVerified,
		user.APIQuotaUsed,
		user.APIQuotaLimit,
		user.CreatedAt,
		user.UpdatedAt,
	)
	
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	
	return nil
}

func (r *UserRepository) UpdateUser(id string, user *models.User) error {
	query := `
		UPDATE users 
		SET email = $2, name = $3, avatar_url = $4, email_verified = $5, updated_at = $6
		WHERE id = $1
	`
	
	_, err := r.db.Exec(query,
		id,
		user.Email,
		user.Name,
		user.AvatarURL,
		user.EmailVerified,
		time.Now(),
	)
	
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	
	return nil
}

func (r *UserRepository) DeleteUser(id string) error {
	query := `UPDATE users SET deleted_at = $2 WHERE id = $1`
	
	_, err := r.db.Exec(query, id, time.Now())
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	
	return nil
}

func (r *UserRepository) GetUserByID(id string) (*models.User, error) {
	query := `
		SELECT id, email, name, avatar_url, plan, status, email_verified, 
		       api_quota_used, api_quota_limit, created_at, updated_at, deleted_at
		FROM users 
		WHERE id = $1 AND deleted_at IS NULL
	`
	
	var user models.User
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.AvatarURL,
		&user.Plan,
		&user.Status,
		&user.EmailVerified,
		&user.APIQuotaUsed,
		&user.APIQuotaLimit,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	
	return &user, nil
}