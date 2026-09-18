# Implementation Plan: Google OAuth Login for PulseCast

Integrate Google OAuth 2.0 authentication into PulseCast so poll creators can securely sign in with their Google accounts in addition to the existing email/password authentication.

## User Review Required

> [!IMPORTANT]
> To enable Google Sign-In in production, you will need a **Google OAuth Client ID** from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
> 1. Create an OAuth 2.0 Client ID (Application type: **Web application**).
> 2. Add authorized JavaScript origins (e.g. `http://localhost:5173`, `https://pulse-cast-zeta.vercel.app`).
> 3. Provide `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` and `GOOGLE_CLIENT_ID` in `backend/.env`.
>
> If the environment variables are not yet provided, the UI will gracefully show a setup guide when the button is clicked.

---

## Proposed Changes

### 1. Backend (Go Gin)

#### [MODIFY] [backend/models/user.go](file:///d:/PulseCast/backend/models/user.go)
- Add `GoogleID` (string, omitempty) and `Avatar` (string, omitempty) to `models.User`.
- Make `PasswordHash` omitempty in BSON serialization (Google users don't need a local password).
- Update `models.UserResponse` and `ToResponse()` to include `Avatar`.
- Add `GoogleAuthInput` struct `{ Credential string json:"credential" }`.

#### [MODIFY] [backend/handlers/auth_handler.go](file:///d:/PulseCast/backend/handlers/auth_handler.go)
- Add `GoogleLogin(c *gin.Context)` handler.
- Verify the ID token via Google's tokeninfo API (`https://oauth2.googleapis.com/tokeninfo?id_token=...`).
- Verify audience (`aud`) against `GOOGLE_CLIENT_ID` if configured in environment.
- Extract `email`, `name`, `sub` (Google user ID), and `picture`.
- Look up user in MongoDB:
  - If existing user matches email, link `google_id` and `avatar` if missing.
  - If new user, create a user record with `Name`, `Email`, `GoogleID`, `Avatar`.
- Generate PulseCast JWT session token and return `{ message, token, user }`.

#### [MODIFY] [backend/main.go](file:///d:/PulseCast/backend/main.go)
- Register `auth.POST("/google", handlers.GoogleLogin)` in the `/api/auth` group.

---

### 2. Frontend (React Vite)

#### [MODIFY] [frontend/src/api.js](file:///d:/PulseCast/frontend/src/api.js)
- Add `googleAuth(credential)` helper function that calls `POST /api/auth/google` and sets `pulsecast_token` and `pulsecast_user`.

#### [MODIFY] [frontend/index.html](file:///d:/PulseCast/frontend/index.html)
- Load the Google Identity Services client script `<script src="https://accounts.google.com/gsi/client" async defer></script>`.

#### [MODIFY] [frontend/src/pages/CreatorDashboard.jsx](file:///d:/PulseCast/frontend/src/pages/CreatorDashboard.jsx)
- In the authentication card:
  - Add a styled **"Continue with Google"** button with the official Google multi-colored icon.
  - Integrate Google Identity Services (`window.google.accounts.id`).
  - Wire up credential response callback to `googleAuth(credential)`.
  - Handle loading, errors, and fallback messaging if `VITE_GOOGLE_CLIENT_ID` is missing.

#### [MODIFY] [frontend/.env.example](file:///d:/PulseCast/frontend/.env.example) & [backend/.env.example](file:///d:/PulseCast/backend/.env.example)
- Add `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` documentation with setup instructions.

---

## Verification Plan

### Automated / Manual Verification
1. Verify `CreatorDashboard.jsx`, `api.js`, and `index.html` have clean syntax.
2. Verify Go models, handlers, and route definitions.
3. Test Google Sign-In flow and verify fallback behavior when client ID is unset.
4. Verify existing email/password authentication continues to work normally.
