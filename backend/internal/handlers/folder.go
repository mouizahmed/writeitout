package handlers

import (
	"net/http"
	"strings"

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
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication required",
			"message": "User authentication context not found. Please sign in again.",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Server error",
			"message": "Internal authentication error. Please try again or contact support.",
		})
		return
	}

	// Get folder ID from URL parameter (empty string for root)
	folderID := c.Param("id")

	// Get complete folder data
	folderData, err := h.folderRepo.GetFolderData(folderID, userIDStr)
	if err != nil {
		if err.Error() == "folder not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Folder not found",
				"message": "The requested folder does not exist or you don't have access to it.",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": "Unable to retrieve folder data. Please try again later.",
		})
		return
	}

	c.JSON(http.StatusOK, folderData)
}

// GetAllFolders handles requests for all user folders (for tree view)
func (h *FolderHandler) GetAllFolders(c *gin.Context) {
	// Get user ID from authentication middleware
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication required",
			"message": "User authentication context not found. Please sign in again.",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Server error",
			"message": "Internal authentication error. Please try again or contact support.",
		})
		return
	}

	// Get all folders for the user
	folders, err := h.folderRepo.GetAllUserFolders(userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": "Unable to retrieve folders. Please try again later.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"folders": folders,
	})
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
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication required",
			"message": "User authentication context not found. Please sign in again.",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Server error",
			"message": "Internal authentication error. Please try again or contact support.",
		})
		return
	}

	// Parse request body
	var req CreateFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"message": "Request body is missing required fields or has invalid format. Please check that 'name' is provided.",
		})
		return
	}

	// Validate folder name
	if len(req.Name) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": "Folder name cannot be empty.",
		})
		return
	}

	if len(req.Name) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": "Folder name must be less than 255 characters.",
		})
		return
	}

	// Create folder
	folder, err := h.folderRepo.CreateFolder(req.Name, req.ParentID, userIDStr)
	if err != nil {
		// Check for specific database errors
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "already exists") {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "Folder already exists",
				"message": "A folder with this name already exists in this location.",
			})
			return
		}
		if strings.Contains(err.Error(), "foreign key") || strings.Contains(err.Error(), "parent") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid parent folder",
				"message": "The specified parent folder does not exist or is not accessible.",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": "Unable to create folder. Please try again later.",
		})
		return
	}

	c.JSON(http.StatusCreated, folder)
}
