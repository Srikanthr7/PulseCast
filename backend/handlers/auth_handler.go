package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pulsecast/backend/config"
	"github.com/pulsecast/backend/middleware"
	"github.com/pulsecast/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// Signup handles POST /api/auth/signup for new poll creators.
func Signup(c *gin.Context) {
	var input models.SignupInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid registration payload",
			"details": err.Error(),
		})
		return
	}

	name := strings.TrimSpace(input.Name)
	if len(name) < 2 || len(name) > 60 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Name must be between 2 and 60 characters",
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") || len(email) < 5 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Please provide a valid email address",
		})
		return
	}

	if len(input.Password) < 6 || len(input.Password) > 72 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Password must be between 6 and 72 characters",
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	usersCol := config.UsersCollection()

	// Check for existing user with identical email
	var existingUser models.User
	err := usersCol.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "An account with this email already exists. Please log in.",
		})
		return
	} else if err != mongo.ErrNoDocuments {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database query error",
			"details": err.Error(),
		})
		return
	}

	// Hash password with bcrypt cost factor 12
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to securely hash password",
		})
		return
	}

	newUser := models.User{
		ID:           primitive.NewObjectID(),
		Name:         name,
		Email:        email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now().UTC(),
	}

	_, err = usersCol.InsertOne(ctx, newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to save user account",
			"details": err.Error(),
		})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(newUser.ID, newUser.Email, newUser.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate authorization token",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Creator account created successfully",
		"token":   token,
		"user":    newUser.ToResponse(),
	})
}

// Login handles POST /api/auth/login for returning poll creators.
func Login(c *gin.Context) {
	var input models.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid login payload",
			"details": err.Error(),
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))
	if email == "" || input.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email and password are required",
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	usersCol := config.UsersCollection()

	var user models.User
	err := usersCol.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid email or password",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database query error",
			"details": err.Error(),
		})
		return
	}

	// Verify password against stored bcrypt hash
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(user.ID, user.Email, user.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate authorization token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user":    user.ToResponse(),
	})
}
