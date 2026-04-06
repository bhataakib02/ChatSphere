# ChatSphere — Real-Time Chat

Full-stack chat with Spring Boot (REST + STOMP/WebSocket) and React (Vite + TypeScript). JWT authentication, RBAC, and a Super Admin dashboard.

## Features

- Real-time messaging (STOMP over WebSocket; JWT required on the STOMP `CONNECT` frame)
- React UI (Tailwind, Framer Motion)
- JWT + RBAC (`ROLE_USER`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- Admin analytics and user lock/unlock
- One-to-one and group chats, typing indicators, message status, uploads (validated)
- **Contact requests**: users cannot message everyone; they search by username/email, send a request, and chat is allowed only after acceptance (see [Contacts](#contacts--requests))

## Prerequisites

- JDK 21+
- Node.js 20+ (for CI; 18+ usually works locally)
- Maven 3.9+
- PostgreSQL 15+ (or Docker — see below)

### Windows: `JAVA_HOME` and Maven

If `mvn` fails with **JAVA_HOME** not set or pointing to a JRE:

1. Install **Temurin 21** (or another full JDK 21) from [Adoptium](https://adoptium.net/).
2. **System Properties → Environment Variables** → under *User* or *System*, add:
   - `JAVA_HOME` = `C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot` (your actual JDK folder, not `bin`).
3. Add `%JAVA_HOME%\bin` to **Path** if the installer did not.
4. Open a **new** terminal and run `java -version` and `mvn -version`.

## Quick start (local)

### 1. Database

**Option A — Docker (recommended)**

```bash
docker compose up -d postgres
```

This matches the default JDBC URL in `backend/src/main/resources/application-dev.yml` (`localhost:5432`, db `chatsphere`, user/password `postgres`).

**Option B — Your own Postgres**

Create database `chatsphere` and set `DB_URL`, `DB_USER`, `DB_PASSWORD` (see `env.example`).

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Default profile is `dev` (see `application.yml`). Dev profile seeds users **admin**, **user1**, **user2** (password `password`) if they do not exist.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/ws` to `http://localhost:8080`.

### Production API on another host

Build the frontend with:

- `VITE_API_BASE_URL` — e.g. `https://api.example.com/api`
- `VITE_WS_URL` — e.g. `wss://api.example.com/ws`

If unset, the client uses `/api` and same-origin `/ws` (typical behind one reverse proxy).

## Configuration & secrets

| Variable | Purpose |
|----------|---------|
| `SPRING_PROFILES_ACTIVE` | `dev` (default) or `prod` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | PostgreSQL (`prod` **requires** these) |
| `JWT_SECRET` | Base64-encoded key for HS256; **`prod` requires** (no default) |
| `CORS_ALLOWED_ORIGIN_PATTERNS` | Comma-separated origin patterns (no spaces), e.g. `https://app.example.com` |
| `JWT_EXPIRATION_MS` | Optional token lifetime (default `86400000`) |

Copy `env.example` as a checklist. For local Spring overrides without committing secrets, use `backend/src/main/resources/application-local.yml` (gitignored).

**Never commit** real database hosts, passwords, or JWT secrets. Rotate any credentials that were ever committed.

## Sample users (dev seed)

| Username | Password | Role |
|----------|----------|------|
| admin | password | `ROLE_SUPER_ADMIN` |
| user1 | password | `ROLE_USER` |
| user2 | password | `ROLE_USER` |

## Project layout

- `backend/` — Spring Boot, JPA, security, WebSocket
- `frontend/` — React + Vite
- `docker-compose.yml` — Postgres for local dev
- `.github/workflows/ci.yml` — Maven tests + frontend lint/build

## Contacts & requests

1. **Add contact** — search (min. 2 characters) matches username or email. You cannot see the full user directory; only matching rows that are not already contacts, not blocked, and without a pending request.
2. **Send request** — creates a pending request. The other user sees it under **Requests → Incoming**.
3. **Accept** — creates a mutual **contact** row and a **1:1 chat** (or reuses an existing DM). Both users can message in that chat and include each other in **groups**.
4. **Reject** — request ends; no chat.
5. **Cancel** (sender) — removes a pending outgoing request.
6. **Block** — `POST /api/contacts/block/{userId}` (optional); blocks pending requests in both directions. **Unblock:** `DELETE /api/contacts/block/{userId}`.

**API (authenticated):**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/contacts` | Your accepted contacts |
| GET | `/api/contacts/search?q=` | Search to send a request |
| POST | `/api/contacts/requests` | Body `{ "receiverId": number }` |
| GET | `/api/contacts/requests/incoming` | Pending received |
| GET | `/api/contacts/requests/outgoing` | Pending sent |
| POST | `/api/contacts/requests/{id}/accept` | Accept (returns chat) |
| POST | `/api/contacts/requests/{id}/reject` | Reject |
| DELETE | `/api/contacts/requests/{id}` | Cancel (sender only) |

`GET /api/users` is **admin-only**. Regular clients use `/api/contacts` and search.

**Dev profile:** `user1` ↔ `user2` and `admin` ↔ `user1` are auto-linked as contacts with DMs so sample logins still work without manual accepts.

## Scripts

**Frontend:** `npm run dev`, `npm run build`, `npm run lint`  
**Backend:** `mvn test`, `mvn spring-boot:run`

## Security notes (implemented)

- STOMP `CONNECT` must send `Authorization: Bearer <jwt>`; chat actions use the authenticated user (no spoofing `senderId`).
- REST: chat messages and chat listing are restricted to participants (or admins where noted).
- File uploads: extension allow-list and size limits (`spring.servlet.multipart`).
- CORS uses explicit origin patterns instead of `*` with credentials.

## License

Use and modify per your project policy.
