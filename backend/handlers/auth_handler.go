package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
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

// GoogleTokenInfo represents the payload returned by Google's tokeninfo API.
type GoogleTokenInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Audience      string `json:"aud"`
	Error         string `json:"error_description"`
}

// GoogleLogin handles POST /api/auth/google.
// It verifies the Google ID token with Google's OAuth2 service,
// finds or provisions the User in MongoDB, and signs a PulseCast JWT session token.
func GoogleLogin(c *gin.Context) {
	var input models.GoogleAuthInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing or invalid Google credential payload",
			"details": err.Error(),
		})
		return
	}

	credential := strings.TrimSpace(input.Credential)
	if credential == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Google credential token is required",
		})
		return
	}

	// Verify token with Google's public tokeninfo endpoint
	client := &http.Client{Timeout: 10 * time.Second}
	verifyURL := "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential
	resp, err := client.Get(verifyURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to contact Google OAuth servers for verification",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired Google OAuth credential",
		})
		return
	}

	var tokenInfo GoogleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&tokenInfo); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to parse Google token verification response",
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(tokenInfo.Email))
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Google account did not provide a valid email address",
		})
		return
	}

	name := strings.TrimSpace(tokenInfo.Name)
	if name == "" {
		name = strings.Split(email, "@")[0]
	}

	// Optional check: if GOOGLE_CLIENT_ID is set in env, ensure audience matches
	expectedAud := os.Getenv("GOOGLE_CLIENT_ID")
	if expectedAud != "" && tokenInfo.Audience != expectedAud {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Google token audience mismatch",
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	usersCol := config.UsersCollection()

	// Check if user exists by email or google_id
	var user models.User
	err = usersCol.FindOne(ctx, bson.M{
		"$or": []bson.M{
			{"email": email},
			{"google_id": tokenInfo.Sub},
		},
	}).Decode(&user)

	if err == nil {
		// User exists - update GoogleID or Avatar if missing
		updateFields := bson.M{}
		if user.GoogleID == "" && tokenInfo.Sub != "" {
			updateFields["google_id"] = tokenInfo.Sub
			user.GoogleID = tokenInfo.Sub
		}
		if user.Avatar == "" && tokenInfo.Picture != "" {
			updateFields["avatar"] = tokenInfo.Picture
			user.Avatar = tokenInfo.Picture
		}
		if len(updateFields) > 0 {
			_, _ = usersCol.UpdateOne(ctx, bson.M{"_id": user.ID}, bson.M{"$set": updateFields})
		}
	} else if err == mongo.ErrNoDocuments {
		// Provision new user
		user = models.User{
			ID:        primitive.NewObjectID(),
			Name:      name,
			Email:     email,
			GoogleID:  tokenInfo.Sub,
			Avatar:    tokenInfo.Picture,
			CreatedAt: time.Now().UTC(),
		}
		_, err = usersCol.InsertOne(ctx, user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to create creator account with Google profile",
				"details": err.Error(),
			})
			return
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database query error during Google authentication",
			"details": err.Error(),
		})
		return
	}

	// Generate JWT session token
	token, err := middleware.GenerateToken(user.ID, user.Email, user.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate authorization token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Google authentication successful",
		"token":   token,
		"user":    user.ToResponse(),
	})
}
