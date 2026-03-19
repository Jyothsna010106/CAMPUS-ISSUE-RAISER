# Campus Issue & Transparency System

Professional internal issue-resolution platform for colleges, built with microservices + API Gateway.

## Product Scope

- Structured issue reporting by section
- Authority assignment and escalation levels
- Support, comment, and evidence interactions
- Controlled status workflow (resolution accountability)
- Weekly analytics aggregation (prototype AI-style summary)
- Minimal, non-social UX focused on resolution

## Architecture

### Services

1. API Gateway (`5000`)
2. User Service (`5001`)
3. Section Service (`5002`)
4. Issue Service (`5003`)
5. Interaction Service (`5004`)
6. Evidence Service (`5005`)
7. Escalation Service (`5006`)
8. Status Service (`5007`)
9. Analytics Service (`5008`)

### Frontend

- React + Vite (`frontend/`)
- Default dev URL: `http://localhost:5176` (or next available)

## Data Models

```txt
User {
  _id, name, email, password, role, department
}

Section {
  _id, name, subSections[]
}

Issue {
  _id, title, description, sectionId, tags[], createdBy,
  assignedTo, escalationLevel, status, supportCount, createdAt
}

Interaction {
  _id, issueId, userId, type (support/comment), content, createdAt
}

Evidence {
  _id, issueId, userId, fileUrl, text, createdAt
}
```

## Local Run

### 1) Install dependencies

```bash
npm install
npm --prefix frontend install
```

### 2) Run complete system

```bash
npm run dev
```

This starts all backend services + gateway + frontend.

### 2a) Run backend services only

```bash
npm run dev:services
```

Use this when you want to isolate API/service issues without running Vite.

### 2b) Run frontend only

```bash
npm run dev:frontend
```

Use this after backend is already running.

### 3) Seed demo data (optional, recommended for demos)

```bash
npm run seed:demo
```

This resets service JSON storage with a realistic demo dataset (users, sections, issues, interactions, evidence).

## Default Seed Users

- Admin: `admin@campus.local` / `password123`
- Teacher: `teacher@campus.local` / `password123`
- HOD: `hod@campus.local` / `password123`
- Dean: `dean@campus.local` / `password123`
- Management: `management@campus.local` / `password123`
- Student: `asha@student.local` / `password123`
- Student: `rahul@student.local` / `password123`
- Student: `nisha@student.local` / `password123`
- Student: `arjun@student.local` / `password123`

## Access Rules

- Status updates are **admin-only** via `PUT /api/issues/:id/status`.
- Signup (`/api/auth/register`) always creates `student` role accounts.
- Authorities (Teacher, HOD, Dean, Management, Admin) are taggable in issue creation.

## Core APIs (via Gateway)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/taggable`
- `GET /api/users/logs` (admin only)

- `GET /api/sections`

- `POST /api/issues`
- `GET /api/issues`
- `GET /api/issues/:id`
- `PUT /api/issues/:id/status`
- `PUT /api/issues/:id/escalate`

- `POST /api/interactions/support`
- `POST /api/interactions/comment`
- `GET /api/interactions/:issueId`

- `POST /api/evidence`
- `GET /api/evidence/:issueId`

- `GET /api/analytics/weekly`

## Minimum Working Features Covered

- User login/register
- Create issue
- View/filter issue list
- Issue detail tracking
- Support issue
- Add comment
- Add evidence
- Escalate issue
- Change status with authority validation
- Weekly analytics dashboard

## Notes

- Services are independent Express apps with separate ports.
- API Gateway centralizes frontend routing.
- Local persistence uses JSON files in `services/data` for easy demo.
- `npm run dev` and `npm run dev:services` are configured to stay up even if one child process exits unexpectedly, so the rest of the stack remains available while you debug the failing service.
- If needed on Windows, run `npm run dev:services` and `npm run dev:frontend` in separate terminals to isolate the failing process quickly.
