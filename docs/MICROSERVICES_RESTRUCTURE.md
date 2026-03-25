# Microservices Restructure Baseline

## Objective

The project runtime is now fully aligned to microservices architecture. All active API traffic must go through the gateway and bounded services.

## Active Runtime Surface

- Gateway: `services/gateway/server.js`
- User Service: `services/user-service/server.js`
- Section Service: `services/section-service/server.js`
- Issue Service: `services/issue-service/server.js`
- Interaction Service: `services/interaction-service/server.js`
- Evidence Service: `services/evidence-service/server.js`
- Escalation Service: `services/escalation-service/server.js`
- Status Service: `services/status-service/server.js`
- Analytics Service: `services/analytics-service/server.js`
- Frontend: `frontend/`

## Route Ownership

- `/api/auth/*` and `/api/users/*` -> user-service
- `/api/sections/*` -> section-service
- `/api/issues/*` -> issue-service
- `/api/issues/:id/escalate` -> escalation-service
- `/api/issues/:id/status` -> status-service
- `/api/interactions/*` -> interaction-service
- `/api/evidence/*` -> evidence-service
- `/api/analytics/*` -> analytics-service

## Data and Persistence

- Shared data keys: `services/data/*.json`
- Storage mode switch:
  - `STORE_MODE=file` for local JSON mode
  - `STORE_MODE=mongo` (or `MONGO_URI` set) for Mongo mode
- Service logic reads and writes through `services/common/store.js`

## Legacy Monolith Status

- Legacy monolith code removed from repository after cutover.
- Legacy monolith seed script removed from repository after cutover.
- Active runtime now exposes only microservice paths.

## Service Deployability

- Each backend service now includes its own `package.json`.
- Each service supports independent run commands via:
  - `npm --prefix services/<service-name> run dev`
  - `npm --prefix services/<service-name> run start`

## Seeding and Bootstrapping

- `npm run seed:demo` resets microservice JSON snapshots.
- `npm run seed:mongo` loads JSON snapshots into Mongo store.
- `npm run seed:user` inserts a single user into active store mode.

## Verification Checklist

1. Start stack with `npm run dev`.
2. Confirm gateway health at `/health`.
3. Login from frontend through gateway.
4. Create issue, support, comment, evidence, status update, escalation.
5. Fetch analytics weekly summary.
6. Confirm no active runtime scripts depend on monolith-only files.
