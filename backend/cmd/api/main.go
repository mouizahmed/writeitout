package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/mouizahmed/justscribe-backend/internal/database"
	"github.com/mouizahmed/justscribe-backend/internal/handlers"
	"github.com/mouizahmed/justscribe-backend/internal/middleware"
	"github.com/mouizahmed/justscribe-backend/internal/repository"
)

func init() {
	gin.SetMode(gin.ReleaseMode)
}

func main() {
	err := godotenv.Load("cmd/api/.env")
	if err != nil {
		log.Fatal("Error loading cmd/api/.env file")
	}

	// Initialize database
	db, err := database.New()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	folderRepo := repository.NewFolderRepository(db)

	// Initialize handlers
	clerkWebhookHandler := handlers.NewClerkWebhookHandler(userRepo)
	userHandler := handlers.NewUserHandler(userRepo)
	folderHandler := handlers.NewFolderHandler(folderRepo)

	// Initialize the router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Cache-Control", "Connection", "Access-Control-Allow-Origin", "svix-id", "svix-timestamp", "svix-signature"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type", "Cache-Control", "Content-Encoding", "Transfer-Encoding"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API Routes
	api := router.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})

		// Webhook routes (no auth required)
		api.POST("/webhooks/clerk", clerkWebhookHandler.HandleClerkWebhook)

		// Authenticated routes
		authenticated := api.Group("/")
		authenticated.Use(middleware.AuthMiddleware())
		{
			// User routes
			authenticated.GET("/user/me", userHandler.GetCurrentUser)

			// Folder routes
			authenticated.GET("/folders", folderHandler.GetFolderData)
			authenticated.GET("/folders/all", folderHandler.GetAllFolders) // New endpoint for folder tree
			authenticated.GET("/folders/:id", folderHandler.GetFolderData)
			authenticated.POST("/folders", folderHandler.CreateFolder)
		}
	}

	// Start the server
	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080" // Default port if not specified
	}
	log.Printf("Starting server on port %s", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	} else {
		log.Printf("Server started on port %s", port)
	}
}
