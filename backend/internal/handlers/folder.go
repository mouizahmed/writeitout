package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mouizahmed/justscribe-backend/internal/repository"
)

type FolderHandler struct {
	folderRepo *repository.FolderRepository
}

func NewFolderHandler(folderRepo *repository.FolderRepository) *FolderHandler {
	return &FolderHandler{
		folderRepo: folderRepo,
	}
}

// GetFolderData handles both root folder (/api/folders) and specific folder (/api/folders/:id) requests
func (h *FolderHandler) GetFolderData(c *gin.Context) {
	// Get user ID from authentication middleware
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get folder ID from URL parameter (empty string for root)
	folderID := c.Param("id")

	// Get complete folder data
	folderData, err := h.folderRepo.GetFolderData(folderID, userIDStr)
	if err != nil {
		if err.Error() == "folder not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Folder not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get folder data"})
		return
	}

	c.JSON(http.StatusOK, folderData)
}

type CreateFolderRequest struct {
	Name     string  `json:"name" binding:"required"`
	ParentID *string `json:"parent_id"`
}

// CreateFolder handles folder creation
func (h *FolderHandler) CreateFolder(c *gin.Context) {
	// Get user ID from authentication middleware
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse request body
	var req CreateFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Create folder
	folder, err := h.folderRepo.CreateFolder(req.Name, req.ParentID, userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create folder"})
		return
	}

	c.JSON(http.StatusCreated, folder)
}
