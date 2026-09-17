# PulseCast — Production Deployment Guide (Native / No Docker)

This guide provides step-by-step instructions to deploy PulseCast **without Docker**, using native cloud runtimes:
- **Backend**: Native Go Web Service (Render or Railway)
- **Frontend**: High-speed Static CDN (Render Static Site, Vercel, or Netlify)
- **Database & Pub/Sub**: Cloud MongoDB Atlas & Upstash Redis

---

## 📋 Pre-Deployment Checklist

Ensure you have your cloud credentials ready:
1. **MongoDB Atlas URI**: Cloud MongoDB database connection string (`mongodb+srv://...`).
2. **Upstash Redis URI**: Cloud Redis TLS URL (`rediss://...`).
3. **GitHub Repository**: Push your code to [https://github.com/srikanthr7/PulseCast.git](https://github.com/srikanthr7/PulseCast.git).

---

## 🚀 Option 1: Deploy on Render (Recommended — 100% Free & No Docker)

Render supports native **Go runtimes** (compiles Go directly without containers) and **Static Sites** with global CDN and automated SSL.

### Method A: 1-Click Blueprint (Easiest)

1. Ensure your latest changes to `render.yaml` are pushed to GitHub:
   ```powershell
   git add render.yaml .gitignore
   git commit -m "feat: native go and static site deployment without docker"
   git push origin main
   ```
2. Go to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your **`PulseCast`** repository.
5. Render will detect `render.yaml` and configure:
   - **`pulsecast-backend`**: Native Go web service (`runtime: go`)
   - **`pulsecast-frontend`**: Static Vite application (`runtime: static`)
6. When prompted for environment variables, fill in:
   - `MONGODB_URI`: `mongodb+srv://srikanthprofessional07_db_user:0GPVvXzJBqVAV5MQ@cluster0.zp5oeso.mongodb.net/?retryWrites=true&w=majority`
   - `REDIS_URL`: `rediss://default:gQAAAAAABEk1AAIgcDExYjUzMTQ3NzllNTU0OWZhOTdkZjkwNTliMWFjZTc4ZQ@careful-eft-280885.upstash.io:6379`
7. Click **Apply**. Render will automatically build the Go binary and Vite frontend assets.

---

### Method B: Manual Configuration on Render

#### Step 1: Deploy the Go Backend (Web Service)
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your `PulseCast` GitHub repo.
3. Configure the settings:
   - **Name**: `pulsecast-backend`
   - **Language / Runtime**: `Go`
   - **Root Directory**: `backend`
   - **Build Command**: `go build -o server .`
   - **Start Command**: `./server`
   - **Plan**: Free
4. Under **Environment Variables**, add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `PORT` | `8080` | Render assigns port automatically |
   | `GIN_MODE` | `release` | Production mode |
   | `DB_NAME` | `pulsecast` | Database name |
   | `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection URI |
   | `REDIS_URL` | `rediss://...` | Your Upstash Redis connection URI |
   | `JWT_SECRET` | `pulsecast_super_secret_jwt_key_2026` | Auth signing secret |
5. Click **Deploy Web Service**.
6. Copy your live backend URL (e.g. `https://pulsecast-backend.onrender.com`).
7. Test the health endpoint: `https://pulsecast-backend.onrender.com/health`.

---

#### Step 2: Deploy the React Frontend (Static Site)
1. In Render Dashboard, click **New +** → **Static Site**.
2. Connect your `PulseCast` GitHub repo.
3. Configure the settings:
   - **Name**: `pulsecast-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**, configure the API routes:
   | Key | Value | Example |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://<YOUR-BACKEND-URL>/api` | `https://pulsecast-backend.onrender.com/api` |
   | `VITE_WS_URL` | `wss://<YOUR-BACKEND-URL>/api/ws` | `wss://pulsecast-backend.onrender.com/api/ws` |
5. Under **Redirects / Rewrites**:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite` *(ensures React Router SPA navigation works without 404s)*
6. Click **Create Static Site**.

---

## ⚡ Option 2: Deploy Frontend on Vercel + Backend on Render

Vercel provides ultra-fast CDN edges for Vite React apps.

### 1. Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Import `srikanthr7/PulseCast`.
3. In the setup screen:
   - **Root Directory**: Click `Edit` and select `frontend`.
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://pulsecast-backend.onrender.com/api`
   - `VITE_WS_URL`: `wss://pulsecast-backend.onrender.com/api/ws`
5. Click **Deploy**.

---

## 🔍 Post-Deployment Verification

Once deployed, verify your live system:

1. **Backend Health Check**:
   Visit `https://<YOUR-BACKEND-URL>/health` in your browser:
   ```json
   {
     "active_ws": 0,
     "redis_connected": true,
     "service": "pulsecast-backend",
     "status": "healthy"
   }
   ```

2. **Test Creator Authentication**:
   - Open your frontend domain.
   - Click **Sign Up** to create an account.
   - Verify that your token is saved and the Creator Dashboard loads.

3. **Test Real-Time Mobile Voting & WebSocket**:
   - Create a poll or use a sample poll.
   - Open the **Presentation View** (`/present/:id`).
   - Scan the on-screen QR code from your phone (or visit `/vote/:id`).
   - Submit a vote; verify that the chart updates instantly on the presenter screen via WebSockets.
