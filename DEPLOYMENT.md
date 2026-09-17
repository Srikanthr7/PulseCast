# PulseCast — Production Deployment Guide

This guide provides step-by-step instructions to deploy PulseCast to **Render** or **Railway** with full live real-time WebSocket support, MongoDB Atlas persistence, and Upstash Redis Pub/Sub.

---

## 📋 Pre-Deployment Checklist

Ensure you have your cloud credentials ready:
1. **MongoDB Atlas URI**: Cloud MongoDB database connection string (`mongodb+srv://...`).
2. **Upstash Redis URI**: Cloud Redis TLS URL (`rediss://...`).
3. **GitHub Repository**: Push your PulseCast codebase to a GitHub repository (private or public).

---

## 🚀 Option 1: Deploy on Render (Recommended)

Render offers free/low-cost tiers for both Docker web services (Go backend) and Static Sites (React frontend) with native WebSocket support over `wss://`.

### Method A: 1-Click Blueprint (Easiest)

1. Push your code (including the included `render.yaml`) to your GitHub repository.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your `PulseCast` repository.
5. Render will automatically detect `render.yaml` and configure both services:
   - **`pulsecast-backend`** (Docker Web Service)
   - **`pulsecast-frontend`** (Static Site with SPA rewrite rules)
6. When prompted for environment variables, fill in:
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `REDIS_URL`: Your Upstash Redis URI
7. Click **Apply**. Render will automatically build and deploy both services!

---

### Method B: Manual Step-by-Step on Render

#### Step 1: Deploy the Go Backend
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repo.
3. Configure settings:
   - **Name**: `pulsecast-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker` (or `Go` with Build Command: `go build -o server main.go`, Start Command: `./server`)
   - **Instance Type**: Free or Starter
4. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `PORT` | `8080` |
   | `GIN_MODE` | `release` |
   | `DB_NAME` | `pulsecast` |
   | `MONGODB_URI` | `mongodb+srv://...` |
   | `REDIS_URL` | `rediss://...` |
   | `JWT_SECRET` | *(Any secure random 32-character string)* |
5. Click **Deploy Web Service**.
6. Note down your backend URL (e.g., `https://pulsecast-backend.onrender.com`).

#### Step 2: Deploy the React Frontend
1. In Render Dashboard, click **New +** → **Static Site**.
2. Connect the same GitHub repository.
3. Configure settings:
   - **Name**: `pulsecast-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**, add:
   | Key | Value | Example |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://<YOUR-BACKEND-URL>/api` | `https://pulsecast-backend.onrender.com/api` |
   | `VITE_WS_URL` | `wss://<YOUR-BACKEND-URL>/api/ws` | `wss://pulsecast-backend.onrender.com/api/ws` |
5. Under **Redirects/Rewrites**:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
6. Click **Create Static Site**.

---

## 🚆 Option 2: Deploy on Railway

Railway supports full-stack projects with automated Docker detection and persistent WebSocket support.

### Step 1: Deploy the Backend Service
1. Go to [Railway.app](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo** and pick `PulseCast`.
3. In service settings, set **Root Directory** to `backend`.
4. Railway will automatically detect `backend/Dockerfile`.
5. Under **Variables**, add:
   ```env
   PORT=8080
   GIN_MODE=release
   DB_NAME=pulsecast
   MONGODB_URI=mongodb+srv://...
   REDIS_URL=rediss://...
   JWT_SECRET=pulsecast_super_secret_jwt_key_2026
   ```
6. Under **Settings** → **Networking**, click **Generate Domain** (e.g. `pulsecast-backend.up.railway.app`).

### Step 2: Deploy the Frontend Service
1. In the same Railway project, click **New** → **GitHub Repo** → select `PulseCast` again.
2. In service settings, set **Root Directory** to `frontend`.
3. Railway will automatically detect `frontend/Dockerfile` (using Nginx + SPA routing).
4. Under **Variables**, add:
   ```env
   VITE_API_URL=https://pulsecast-backend.up.railway.app/api
   VITE_WS_URL=wss://pulsecast-backend.up.railway.app/api/ws
   ```
5. Under **Settings** → **Networking**, click **Generate Domain** (e.g. `pulsecast.up.railway.app`).

---

## 🐳 Option 3: Deploy with Docker Compose (Any VPS / Cloud VM)

If deploying to a VPS (Ubuntu / Debian / AWS EC2 / DigitalOcean Droplet):

1. Clone your repository:
   ```bash
   git clone <YOUR-REPO-URL>
   cd PulseCast
   ```
2. Create your `.env` file in the root directory:
   ```bash
   MONGODB_URI="mongodb+srv://..."
   REDIS_URL="rediss://..."
   JWT_SECRET="pulsecast_super_secret_jwt_key_2026"
   VITE_API_URL="https://api.yourdomain.com/api"
   VITE_WS_URL="wss://api.yourdomain.com/api/ws"
   ```
3. Start the containers:
   ```bash
   docker compose up -d --build
   ```
4. Check running status:
   ```bash
   docker compose ps
   ```

---

## 🔍 Post-Deployment Verification

Once deployed, verify your live production instance:

1. **Verify Backend Health**:
   ```bash
   curl https://<YOUR-BACKEND-URL>/health
   ```
   Expected response:
   ```json
   {
     "active_ws": 0,
     "redis_connected": true,
     "service": "pulsecast-backend",
     "status": "healthy"
   }
   ```

2. **Verify Creator Portal**:
   - Open your frontend domain in the browser.
   - Create a Creator account or sign in.
   - Design a sample multi-question poll.

3. **Verify Real-Time Mobile Voting**:
   - Open the **Projector View** (`/present/:id`).
   - Scan the QR code with your mobile phone (or open the `/vote/:id` URL).
   - Enter your voter name and submit a vote.
   - Observe the live bar chart and leaderboard instantly animate over WebSockets!
