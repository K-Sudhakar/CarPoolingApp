Server (Node/Express)

Setup
1) Copy `.env.example` to `.env`
2) Fill in:
   - `MONGODB_URI` (e.g., mongodb://localhost:27017/carpool)
   - `CLIENT_ORIGIN` (default http://localhost:4200)
   - `JWT_SECRET` (any random string)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (from Google Cloud Console)
   - `GOOGLE_CALLBACK_PATH` (default /auth/google/callback)

Google OAuth
- In Google Cloud Console → Credentials → Create OAuth 2.0 Client ID (Web application)
- Authorized redirect URIs:
  - http://localhost:4000/auth/google/callback

Run
- `npm run dev` (nodemon) or `npm start`
- Health check: GET http://localhost:4000/health

Endpoints
- `GET /auth/google` → begins OAuth
- `GET /auth/google/callback` → completes OAuth, redirects to frontend with `?token=`
- `GET /api/rides` → list/search
- `POST /api/rides` → create (requires Bearer token)

