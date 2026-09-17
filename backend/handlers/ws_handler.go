package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/pulsecast/backend/ws"
)

// HandleWebSocket upgrades incoming HTTP connections to WebSocket and registers them with the Hub.
func HandleWebSocket(c *gin.Context) {
	conn, err := ws.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("❌ Failed to upgrade connection to WebSocket: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upgrade connection"})
		return
	}

	// Register with Hub under mutex lock
	ws.GlobalHub.Register(conn)

	// Ensure cleanup when read loop exits (client disconnects, closes browser tab, network drops)
	defer ws.GlobalHub.Unregister(conn)

	// Send initial connection welcome handshake
	welcomeMsg := `{"type":"CONNECTED","message":"Connected to PulseCast real-time stream"}`
	_ = conn.WriteMessage(websocket.TextMessage, []byte(welcomeMsg))

	// Read loop keeps connection alive and detects disconnections promptly
	for {
		messageType, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket connection closed unexpectedly: %v", err)
			}
			break
		}

		// Handle client ping
		if messageType == websocket.PingMessage {
			_ = conn.WriteMessage(websocket.PongMessage, nil)
		}
	}
}
