package ws

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Upgrader handles upgrading standard HTTP connections to WebSocket protocol with CORS allowance.
var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all frontend origins in development
		return true
	},
}

// Hub maintains the set of active client connections and broadcasts messages.
// Thread safety is guaranteed via sync.Mutex.
type Hub struct {
	clients map[*websocket.Conn]bool
	mu      sync.Mutex
}

// GlobalHub is the singleton instance of the WebSocket Hub.
var GlobalHub = NewHub()

// NewHub creates a new thread-safe WebSocket Hub.
func NewHub() *Hub {
	return &Hub{
		clients: make(map[*websocket.Conn]bool),
	}
}

// Register adds a new client connection to the hub safely.
func (h *Hub) Register(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[conn] = true
	log.Printf("🔌 WebSocket Client Connected. Total Active Clients: %d", len(h.clients))
}

// Unregister safely removes a client connection from the hub and closes it.
// Prevents resource and memory leaks.
func (h *Hub) Unregister(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.clients[conn]; exists {
		delete(h.clients, conn)
		conn.Close()
		log.Printf("🔌 WebSocket Client Disconnected. Total Active Clients: %d", len(h.clients))
	}
}

// Broadcast sends a message to all connected clients.
// Automatically unregisters and cleans up any client whose write operation fails.
func (h *Hub) Broadcast(message []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()

	var deadClients []*websocket.Conn

	for conn := range h.clients {
		// Set write deadline to prevent hanging on slow/stale connections
		_ = conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
		err := conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("⚠️ Failed to write to WebSocket client (%v), marking for cleanup", err)
			deadClients = append(deadClients, conn)
		}
	}

	// Clean up any failed connections
	for _, conn := range deadClients {
		delete(h.clients, conn)
		conn.Close()
	}

	if len(deadClients) > 0 {
		log.Printf("🧹 Cleaned up %d disconnected client(s). Active Clients: %d", len(deadClients), len(h.clients))
	}
}

// ClientCount returns the current number of active connections safely.
func (h *Hub) ClientCount() int {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.clients)
}
