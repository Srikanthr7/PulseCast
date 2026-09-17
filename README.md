# PulseCast — Real-Time Live Polling Engine

A live polling application where a presenter creates an interactive poll, displays a projector view with an auto-updating live bar chart and QR code, and audience members cast votes from their mobile phones in real time.

---

## Complete Tech Stack Overview

| Layer | Technology | Status | Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | **React 18 + Vite** | **Complete** | Modern responsive SPA connected live to Go API |
| **Creator Auth** | **JWT + Bcrypt** | **Complete** | Secure poll creation with 24-hr signed tokens |
| **Audience Capture** | **Name Gate + MongoDB**| **Complete** | Audience name entry gate before voting & MongoDB attribution |
| **Animations** | **Framer Motion** | **Complete** | Spring-physics animated chart bars & tactile button press |
| **QR Code** | **qrcode.react** | **Complete** | Dynamic high-contrast QR code for mobile joining |
| **Backend** | **Go (Gin)** | **Complete** | High-performance REST API with strict validation |
| **Database** | **MongoDB (Atlas)** | **Complete** | Single-read embedded schemas & atomic `$inc` updates |
| **Realtime** | **Redis (Upstash)** | **Complete** | Pub/Sub messaging driving live vote updates |
| **WebSockets** | **Gorilla WebSocket** | **Complete** | Thread-safe connection hub (`sync.Mutex`) & live broadcasting |

---

## Live Real-Time Architecture

```
[Mobile Phone Audience] 
          │
          │ 1. Name Capture ("Sarah")
          │ 2. HTTP POST /api/vote/:id
          ▼
      [Go Gin API]
          │
          ├─► 1. MongoDB Atlas: Atomic $inc + $push voter record
          │
          └─► 2. Upstash Redis: Publish to channel 'live_poll_updates'
                         │
                         ▼
             [Redis Subscriber Goroutine]
                         │
                         ▼
             [Thread-Safe WebSocket Hub]
                         │ (WebSocket Live Stream)
                         ▼
          [Laptop / Projector Screen & Live Charts]
```

---

## Automated Verification Scripts

- **Test Phase 2 (CRUD & Atomic increments)**:
  ```powershell
  .\test_api.ps1
  ```
- **Test Phase 3 (Redis Pub/Sub & WebSockets)**:
  ```powershell
  .\test_realtime.ps1
  ```
- **Test Phase 5 (Creator Auth & Voter Name Capture)**:
  ```powershell
  .\test_phase5.ps1
  ```
