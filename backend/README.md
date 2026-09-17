# PulseCast Backend API (Go + Gin + MongoDB + Redis + WebSockets)

High-performance Go backend service for the PulseCast live polling system.

---

## Complete Tech Stack Architecture

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **Routing / Engine** | **Gin** (`github.com/gin-gonic/gin`) | High-speed HTTP routing, CORS middleware & JSON binding |
| **Database** | **MongoDB** (`go.mongodb.org/mongo-driver`) | Single-read document schemas & atomic `$inc` updates |
| **Real-time Bus** | **Redis** (`github.com/redis/go-redis/v9`) | Pub/Sub messaging on channel `live_poll_updates` |
| **Live Streaming** | **Gorilla WebSocket** (`github.com/gorilla/websocket`) | Thread-safe connection hub (`sync.Mutex`) & live broadcasting |

---

## Real-Time Architecture Flow

```
[Audience Member] 
      │ (POST /api/vote/:id)
      ▼
  [Gin API]
      │
      ├─► 1. Atomic $inc in MongoDB (Return updated poll)
      │
      └─► 2. Publish event to Redis channel: 'live_poll_updates'
                     │
                     ▼
             [Redis Pub/Sub]
                     │
                     ▼
         [Redis Subscriber Goroutine]
                     │
                     ▼
          [Thread-Safe WebSocket Hub]
                     │ (Fan-out)
                     ▼
      [All Connected Projector Screens & Mobile Clients]
```

---

## How to Run the Backend

1. **Navigate to the backend directory**:
   ```bash
   cd d:\PulseCast\backend
   ```

2. **Download all Go modules**:
   ```bash
   go mod tidy
   ```

3. **Start the Go backend**:
   ```bash
   go run main.go
   ```

---

## Endpoints

### 1. HTTP API
- `GET /health` &ndash; Service health, Redis status & active WebSocket count
- `POST /api/polls` &ndash; Create poll with server validation
- `GET /api/polls/:id` &ndash; Single-query fetch of poll & options
- `POST /api/vote/:id` &ndash; Concurrency-safe atomic vote + Redis publish

### 2. WebSocket Endpoint
- `GET /api/ws` (or `GET /ws`) &ndash; Upgrades HTTP to WebSocket connection for live event streaming

---

## Testing Real-Time Live Streaming

Run the provided PowerShell test script:
```powershell
cd d:\PulseCast
.\test_realtime.ps1
```
This script will:
1. Check `/health`.
2. Create a test poll in MongoDB.
3. Open a live WebSocket connection to `ws://localhost:8080/api/ws`.
4. Cast a vote via `POST /api/vote/:id`.
5. Capture and print the broadcasted vote payload received over the WebSocket in real time!
