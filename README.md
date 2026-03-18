# Campus Issue & Transparency System

Multi-tenant issue tracking platform for colleges.

## Backend

- node + express
- MongoDB + mongoose
- JWT auth + bcrypt

## Setup

1. `npm install`
2. Add `.env` with `MONGO_URI`, `JWT_SECRET`, `PORT`
3. `npm run dev`

## API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/colleges` (superadmin)
- `GET /api/colleges`
- `POST /api/groups` (admin/superadmin)
- `POST /api/issues` (authenticated)
- `GET /api/issues`
- `GET /api/issues/:id`
- `POST /api/comments`
- `GET /api/comments?issueId=...`
- `GET /api/reports/weekly`
