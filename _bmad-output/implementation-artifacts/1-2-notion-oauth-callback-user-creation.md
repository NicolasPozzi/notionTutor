# Story 1.2: Notion OAuth Callback & User Creation

Status: ready-for-dev

## Story

As a **visitor completing Notion login**,
I want **my account to be created automatically from my Notion profile**,
so that **I don't have to fill any forms**.

## Acceptance Criteria

### AC1: OAuth Callback
- **Given** I complete Notion OAuth consent
- **When** callback is received at `/api/auth/notion/callback`
- **Then** authorization code is exchanged for access_token via Notion API
- **And** PKCE code_verifier and state are validated from cookies

### AC2: User Creation / Matching
- **Given** a valid access_token from Notion
- **When** the callback processes
- **Then** user record is created (or matched) by `notion_user_id`
- **And** user name, email, avatar, workspace_id are populated from Notion

### AC3: Token Encryption
- **Given** the Notion access_token
- **When** stored in database
- **Then** it is encrypted with AES-256-GCM using `ENCRYPTION_KEY`

### AC4: Session Creation
- **Given** user record exists
- **When** authentication succeeds
- **Then** a JWT (HS256) session is created
- **And** stored in `notiontutor_session` cookie (HttpOnly, Secure, SameSite=Lax, 30 days)
- **And** user is redirected to app home (`/dashboard`)

### AC5: Auth API Endpoints
- **Given** a valid session
- **When** `GET /api/auth/me` is called
- **Then** current user info is returned
- **And** `POST /api/auth/logout` clears the session cookie

## Tasks / Subtasks

- [ ] **Task 1: Create encryption utility** (AC: #3)
  - [ ] `src/lib/auth/encryption.ts` — encrypt/decrypt AES-256-GCM
  - [ ] Uses ENCRYPTION_KEY env var (32 bytes, base64)

- [ ] **Task 2: Create JWT session utility** (AC: #4)
  - [ ] `src/lib/auth/session.ts` — createSession, verifySession, clearSession
  - [ ] JWT payload: { userId, notionUserId, exp }
  - [ ] Cookie: notiontutor_session, HttpOnly, Secure, SameSite=Lax, 30 days

- [ ] **Task 3: Create OAuth callback** (AC: #1, #2, #3, #4)
  - [ ] `src/app/api/auth/notion/callback/route.ts`
  - [ ] Validate state cookie matches query param
  - [ ] Exchange code + code_verifier for access_token (POST /oauth/token)
  - [ ] Fetch user info (GET /users/me with access_token)
  - [ ] Upsert user in DB (match by notion_user_id)
  - [ ] Encrypt and store access_token
  - [ ] Create JWT session → set cookie → redirect to /dashboard

- [ ] **Task 4: Create /api/auth/me** (AC: #5)
  - [ ] Return current user from session JWT

- [ ] **Task 5: Create /api/auth/logout** (AC: #5)
  - [ ] Clear session cookie → redirect to /

## Dev Notes

### Notion Token Exchange
```
POST https://api.notion.com/v1/oauth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "{code}",
  "redirect_uri": "{redirect_uri}",
  "code_verifier": "{code_verifier}"
}
```

### File Structure
```
src/lib/auth/
├── encryption.ts     ← NEW (AES-256-GCM)
├── session.ts        ← NEW (JWT + cookie)
└── index.ts          ← NEW (re-exports)
src/app/api/auth/
├── notion/
│   ├── route.ts      ← EXISTS (Story 1.1)
│   └── callback/
│       └── route.ts  ← NEW
├── me/
│   └── route.ts      ← NEW
└── logout/
    └── route.ts      ← NEW
src/app/dashboard/
└── page.tsx          ← NEW (placeholder)
```

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
