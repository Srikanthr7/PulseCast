package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/pulsecast/backend/config"
	"github.com/pulsecast/backend/handlers"
	"github.com/pulsecast/backend/middleware"
	"github.com/pulsecast/backend/ws"
)

func main() {
	// 1. Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("ℹ️ No .env file found, using system environment variables")
	}

	// 2. Connect to MongoDB (Phase 2)
	config.ConnectDB()
	defer config.CloseDB()

	// 3. Connect to Redis (Phase 3)
	config.InitRedis()
	defer config.CloseRedis()

	// 4. Start Redis Subscriber Goroutine
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	ws.StartRedisSubscriber(ctx)

	// 5. Initialize Gin Engine
	r := gin.Default()
	_ = r.SetTrustedProxies(nil) // Quiet proxy trust warning

	// Apply CORS
	r.Use(middleware.CORSMiddleware())

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":          "healthy",
			"service":         "pulsecast-backend",
			"redis_connected": config.RedisConnected,
			"active_ws":       ws.GlobalHub.ClientCount(),
		})
	})

	// API Routes Group
	api := r.Group("/api")
	{
		// Phase 5: Creator Authentication (Public)
		auth := api.Group("/auth")
		{
			auth.POST("/signup", handlers.Signup)
			auth.POST("/login", handlers.Login)
			auth.POST("/google", handlers.GoogleLogin)
		}

		// Protected Creator Endpoints (Guarded by JWT AuthMiddleware)
		api.POST("/polls", middleware.AuthMiddleware(), handlers.CreatePoll)
		api.POST("/polls/bulk", middleware.AuthMiddleware(), handlers.BulkCreatePolls)
		api.GET("/polls/my", middleware.AuthMiddleware(), handlers.GetMyPolls)

		// Public Audience & Presentation Endpoints
		api.GET("/polls/:id", handlers.GetPoll)
		api.GET("/network-ip", handlers.GetNetworkIP)
		api.POST("/polls/:id/status", handlers.UpdatePollStatus)
		api.POST("/polls/:id/complete", handlers.CompletePoll)
		api.DELETE("/polls/:id", handlers.DeletePoll)
		api.POST("/vote/:id", handlers.VoteOnPoll)
		api.GET("/ws", handlers.HandleWebSocket)
	}

	// Root /ws for WebSocket convenience
	r.GET("/ws", handlers.HandleWebSocket)

	// Determine port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 PulseCast Backend (Auth + MongoDB + Redis + WebSockets) running on port :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
