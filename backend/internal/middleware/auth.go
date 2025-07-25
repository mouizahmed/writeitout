package middleware

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gin-gonic/gin"
)

type contextKey string

const UserIDKey contextKey = "userID"

// AuthMiddleware validates Clerk JWT tokens and extracts user ID
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>" format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		token := tokenParts[1]

		// Initialize Clerk client
		clerkSecretKey := os.Getenv("CLERK_SECRET_KEY")
		if clerkSecretKey == "" {
			log.Printf("CLERK_SECRET_KEY not set")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Authentication configuration error"})
			c.Abort()
			return
		}

		clerk.SetKey(clerkSecretKey)

		// Verify the JWT token
		claims, err := jwt.Verify(context.Background(), &jwt.VerifyParams{
			Token: token,
		})
		if err != nil {
			// Check if it's a clock skew issue and retry with a small delay
			if strings.Contains(err.Error(), "token issued in the future") {
				log.Printf("Clock skew detected, retrying JWT verification: %v", err)
				time.Sleep(2 * time.Second)
				claims, err = jwt.Verify(context.Background(), &jwt.VerifyParams{
					Token: token,
				})
			}
			
			if err != nil {
				log.Printf("JWT verification failed: %v", err)
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
				c.Abort()
				return
			}
		}

		// Extract user ID from claims
		userID := claims.Subject
		if userID == "" {
			log.Printf("No user ID found in JWT claims")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Store user ID in context for use by handlers
		c.Set(string(UserIDKey), userID)
		c.Next()
	}
}

// GetUserIDFromContext extracts the user ID from the Gin context
func GetUserIDFromContext(c *gin.Context) (string, bool) {
	userID, exists := c.Get(string(UserIDKey))
	if !exists {
		return "", false
	}

	userIDStr, ok := userID.(string)
	return userIDStr, ok
}
