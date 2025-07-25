package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mouizahmed/justscribe-backend/internal/middleware"
	"github.com/mouizahmed/justscribe-backend/internal/repository"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
	return &UserHandler{
		userRepo: userRepo,
	}
}

// GetCurrentUser returns the current authenticated user's information
func (h *UserHandler) GetCurrentUser(c *gin.Context) {
	// Get user ID from middleware
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Fetch user from database
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		fmt.Println("User ID:", userID)
		fmt.Println("Error fetching user:", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Return user data (excluding sensitive fields)
	c.JSON(http.StatusOK, gin.H{
		"id":              user.ID,
		"email":           user.Email,
		"name":            user.Name,
		"avatar_url":      user.AvatarURL,
		"plan":            user.Plan,
		"status":          user.Status,
		"email_verified":  user.EmailVerified,
		"api_quota_used":  user.APIQuotaUsed,
		"api_quota_limit": user.APIQuotaLimit,
		"created_at":      user.CreatedAt,
		"updated_at":      user.UpdatedAt,
	})
}
