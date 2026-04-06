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

(or `npm run docker:db` from the repo root)

This matches the default JDBC URL in `backend/src/main/resources/application-dev.yml` (`localhost:5432`, db `chatsphere`, user/password `postgres`).

**Option A2 — Entire app in Docker (UI + API + Postgres)**

Use this when you want one command with no local JDK/Node, or the same setup on any machine:

```bash
docker compose --profile stack up --build -d
```

(or `npm run docker:stack`)

Then open **http://localhost:3000** (nginx serves the built React app and proxies `/api`, `/ws`, and `/uploads` to the backend). The API is also on **http://localhost:8080** if you need it directly.

By default the stack uses Spring **`dev`** (schema `update`, seeded users **admin** / **user1** / **user2**, password `password`). For a **production-like** stack, create a **`.env`** file in the repo root (it is gitignored) or export variables before `docker compose up`. The backend service loads `.env` when present (optional).

- `SPRING_PROFILES_ACTIVE=prod`
- `JWT_SECRET` — required for `prod` (same rules as [Configuration & secrets](#configuration--secrets))
- `SPRING_JPA_HIBERNATE_DDL_AUTO=update` on the **first** run against an empty database (then switch to `validate` when you rely on migrations)

Example `.env` entries:

```env
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=<your-base64-secret>
SPRING_JPA_HIBERNATE_DDL_AUTO=update
CORS_ALLOWED_ORIGIN_PATTERNS=https://your-domain.com
```

If your Docker Compose version does not support `required: false` for `env_file`, create an empty `.env` file or remove the `required: false` line from `docker-compose.yml` after copying `env.example` to `.env`.

Adjust `CORS_ALLOWED_ORIGIN_PATTERNS` for your real browser origin(s). See `env.example`.

**Option B — Your own Postgres**

Create database `chatsphere` and set `DB_URL`, `DB_USER`, `DB_PASSWORD` (see `env.example`).

### 2. Backend

You need **JDK 21** on your PATH (`java -version`) or set **`JAVA_HOME`** to the JDK install folder (not `bin`).

From the repo:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The wrapper downloads Maven on first run (no global `mvn` install required). If you already have Maven: `mvn spring-boot:run` also works.

Keep this terminal open; the API must be on **http://localhost:8080** or the Vite dev proxy will show `ECONNREFUSED` on `/api/...`.

Default profile is `dev` (see `application.yml`). Dev profile seeds users **admin**, **user1**, **user2** (password `password`) if they do not exist.

### 3. Frontend

From the **repository root** (or `cd frontend`):

```bash
npm install --prefix frontend
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/ws` to `http://localhost:8080`.

**Order:** start the **backend first**, then the frontend—otherwise login calls fail with `http proxy error: ECONNREFUSED`.

### Deploy: Vercel (frontend) + Java backend (Railway, Render, Fly.io, VPS, …)

**What is already in this repo**

- Root **`vercel.json`** — installs/builds from `./frontend`, outputs `frontend/dist`, and **SPA rewrites** so React Router works.
- **`frontend/vercel.json`** — same rewrites if you set the Vercel project **Root Directory** to `frontend` instead of the repo root.

**What you do**

1. **Backend + Postgres** on a host that keeps the API **running continuously** (e.g. [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io), or a VPS with your `Dockerfile` / JAR).  
   - Set **`SPRING_PROFILES_ACTIVE=prod`**, **`DB_URL`**, **`DB_USER`**, **`DB_PASSWORD`**, **`JWT_SECRET`** (see [Configuration & secrets](#configuration--secrets)).  
   - On first deploy against an **empty** database, set **`SPRING_JPA_HIBERNATE_DDL_AUTO=update`** once, then prefer **`validate`** when you have real migrations.  
   - Set **`CORS_ALLOWED_ORIGIN_PATTERNS`** to your Vercel origin, e.g. `https://your-app.vercel.app` (and your custom domain if you add one).  
   - Note the public **HTTPS** base URL of the API (no trailing slash path fragment beyond what your app uses), e.g. `https://chatsphere-api.up.railway.app`.

2. **Vercel** — import this Git repo.  
   - If the Vercel **root** is the **repository root**, the root `vercel.json` is used (nothing extra to configure for build output).  
   - If the Vercel **root** is **`frontend`**, Framework Preset can be Vite; `frontend/vercel.json` handles SPA routing.

3. **Vercel → Settings → Environment Variables** (Production and Preview as you prefer):

   | Name | Example value |
   |------|----------------|
   | `VITE_API_BASE_URL` | `https://your-api-host.example.com/api` |
   | `VITE_WS_URL` | `wss://your-api-host.example.com/ws` |

   Use **`wss://`** (not `ws://`) when the page is served over HTTPS. Hostname and path must match how your backend is exposed (same host as REST is typical).

4. **Redeploy** the Vercel project after changing env vars (Vite bakes them in at build time).

**Local build check (same as Vercel)**

```bash
set VITE_API_BASE_URL=https://your-api/api
set VITE_WS_URL=wss://your-api/ws
npm run build --prefix frontend
```

(PowerShell: `$env:VITE_API_BASE_URL = "..."` etc.)

If those variables are **unset**, the app uses **`/api`** and browser **`/ws`** (same origin — fine behind nginx/Docker, not fine for Vercel-only static hosting without a rewrite to your API).

### Production API on another host (any static host)

Same as the Vercel table: set **`VITE_API_BASE_URL`** and **`VITE_WS_URL`** when the UI and API are on different origins.

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
- `docker-compose.yml` — Postgres only by default; add `--profile stack` for backend + frontend images
- `backend/Dockerfile`, `frontend/Dockerfile` — production-style JAR and nginx static + reverse proxy
- `vercel.json` (root) — Vercel build for the monorepo; `frontend/vercel.json` if Root Directory is `frontend`
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
