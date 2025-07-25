package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mouizahmed/justscribe-backend/internal/models"
	"github.com/mouizahmed/justscribe-backend/internal/repository"
	svix "github.com/svix/svix-webhooks/go"
)

type ClerkWebhookHandler struct {
	userRepo *repository.UserRepository
}

func NewClerkWebhookHandler(userRepo *repository.UserRepository) *ClerkWebhookHandler {
	return &ClerkWebhookHandler{
		userRepo: userRepo,
	}
}

type ClerkEvent struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type ClerkUser struct {
	ID             string `json:"id"`
	EmailAddresses []struct {
		EmailAddress string `json:"email_address"`
	} `json:"email_addresses"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	ImageURL  *string `json:"image_url"`
	CreatedAt int64   `json:"created_at"`
}

func (h *ClerkWebhookHandler) HandleClerkWebhook(c *gin.Context) {
	// Get the webhook secret from environment
	webhookSecret := os.Getenv("CLERK_WEBHOOK_SECRET")
	if webhookSecret == "" {
		log.Printf("CLERK_WEBHOOK_SECRET not set")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Webhook secret not configured"})
		return
	}

	// Read the request body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Error reading webhook body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	// Create webhook instance
	wh, err := svix.NewWebhook(webhookSecret)
	if err != nil {
		log.Printf("Error creating webhook verifier: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Webhook configuration error"})
		return
	}

	// Verify the webhook
	err = wh.Verify(body, c.Request.Header)
	if err != nil {
		log.Printf("Error verifying webhook: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook signature"})
		return
	}

	// Parse the event
	var event ClerkEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Printf("Error parsing webhook payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook payload"})
		return
	}

	// Handle different event types
	switch event.Type {
	case "user.created":
		h.handleClerkUserCreated(c, event.Data)
	case "user.updated":
		h.handleClerkUserUpdated(c, event.Data)
	case "user.deleted":
		h.handleClerkUserDeleted(c, event.Data)
	default:
		log.Printf("Unhandled webhook event type: %s", event.Type)
		c.JSON(http.StatusOK, gin.H{"message": "Event received but not handled"})
	}
}

func (h *ClerkWebhookHandler) handleClerkUserCreated(c *gin.Context, data interface{}) {
	// Convert interface{} to ClerkUser
	userBytes, err := json.Marshal(data)
	if err != nil {
		log.Printf("Error marshaling user data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	var clerkUser ClerkUser
	if err := json.Unmarshal(userBytes, &clerkUser); err != nil {
		log.Printf("Error unmarshaling user.created data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	// Build full name
	var name string
	if clerkUser.FirstName != nil && clerkUser.LastName != nil {
		name = *clerkUser.FirstName + " " + *clerkUser.LastName
	} else if clerkUser.FirstName != nil {
		name = *clerkUser.FirstName
	} else if clerkUser.LastName != nil {
		name = *clerkUser.LastName
	} else {
		name = "Unknown User"
	}

	// Get primary email
	var email string
	if len(clerkUser.EmailAddresses) > 0 {
		email = clerkUser.EmailAddresses[0].EmailAddress
	}

	// Create user model
	user := &models.User{
		ID:            clerkUser.ID,
		Email:         email,
		Name:          name,
		AvatarURL:     clerkUser.ImageURL,
		Plan:          models.UserPlanFree,
		Status:        models.UserStatusActive,
		EmailVerified: true, // Clerk handles email verification
		APIQuotaUsed:  0,
		APIQuotaLimit: 1000,                                   // Default free tier limit
		CreatedAt:     time.Unix(clerkUser.CreatedAt/1000, 0), // Convert from milliseconds
		UpdatedAt:     time.Now(),
	}

	// Save to database
	if err := h.userRepo.CreateUser(user); err != nil {
		log.Printf("Error creating user in database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	log.Printf("User created successfully: %s (%s)", user.Name, user.Email)
	c.JSON(http.StatusOK, gin.H{"message": "User created successfully", "user_id": user.ID})
}

func (h *ClerkWebhookHandler) handleClerkUserUpdated(c *gin.Context, data interface{}) {
	// Convert interface{} to ClerkUser
	userBytes, err := json.Marshal(data)
	if err != nil {
		log.Printf("Error marshaling user data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	var clerkUser ClerkUser
	if err := json.Unmarshal(userBytes, &clerkUser); err != nil {
		log.Printf("Error unmarshaling user.updated data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	// Build full name
	var name string
	if clerkUser.FirstName != nil && clerkUser.LastName != nil {
		name = *clerkUser.FirstName + " " + *clerkUser.LastName
	} else if clerkUser.FirstName != nil {
		name = *clerkUser.FirstName
	} else if clerkUser.LastName != nil {
		name = *clerkUser.LastName
	} else {
		name = "Unknown User"
	}

	// Get primary email
	var email string
	if len(clerkUser.EmailAddresses) > 0 {
		email = clerkUser.EmailAddresses[0].EmailAddress
	}

	// Create user model for update
	user := &models.User{
		Email:         email,
		Name:          name,
		AvatarURL:     clerkUser.ImageURL,
		EmailVerified: true,
	}

	// Update in database
	if err := h.userRepo.UpdateUser(clerkUser.ID, user); err != nil {
		log.Printf("Error updating user in database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	log.Printf("User updated successfully: %s (%s)", user.Name, user.Email)
	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully", "user_id": clerkUser.ID})
}

func (h *ClerkWebhookHandler) handleClerkUserDeleted(c *gin.Context, data interface{}) {
	// Convert interface{} to get user ID
	userBytes, err := json.Marshal(data)
	if err != nil {
		log.Printf("Error marshaling user data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	var userData struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(userBytes, &userData); err != nil {
		log.Printf("Error unmarshaling user.deleted data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	if userData.ID == "" {
		log.Printf("Missing user ID in delete event")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user ID"})
		return
	}

	// Soft delete user in database
	if err := h.userRepo.DeleteUser(userData.ID); err != nil {
		log.Printf("Error deleting user in database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	log.Printf("User deleted successfully: %s", userData.ID)
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully", "user_id": userData.ID})
}
