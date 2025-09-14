Carpool App (Angular + Node + MongoDB + Google OAuth)

Overview
- Frontend: Angular (standalone, routing, HttpClient)
- Backend: Node.js (Express, Mongoose, Passport Google OAuth 2.0, JWT)
- DB: MongoDB
- Auth: Google OAuth → backend issues JWT → Angular stores token

Project Structure
- client: Angular SPA
- server: Node/Express API

Getting Started
1) Prereqs
   - Node.js LTS installed
   - MongoDB running locally or a connection string (Atlas)
   - Google OAuth credentials (OAuth 2.0 Client ID)

2) Configure backend
   - Copy `server/.env.example` to `server/.env`
   - Set `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - Optionally adjust `CLIENT_ORIGIN`, `PORT`, `JWT_SECRET`

3) Run backend
   - In `server/`: `npm run dev`
   - API: http://localhost:4000

4) Run frontend
   - In `client/`: `npm start`
   - App: http://localhost:4200

Auth Flow
- Angular calls `GET /auth/google` (backend) → Google consent → backend callback
- Backend finds/creates user, signs JWT, redirects to `http://localhost:4200/auth/callback?token=...`
- Angular stores token and uses it for API requests

Key Endpoints
- GET `/api/rides?from=&to=&date=`: Search rides
- POST `/api/rides`: Create ride (requires Authorization: Bearer <JWT>)

Notes
- For local dev over HTTP, the JWT is passed via URL query and stored in localStorage (simple for demo). For production, switch to secure httpOnly cookies over HTTPS.
- Update CORS origins as needed in `server/src/index.js`.

