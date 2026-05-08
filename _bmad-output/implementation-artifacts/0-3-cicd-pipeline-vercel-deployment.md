# Story 0.3: CI/CD Pipeline & Vercel Deployment

Status: ready-for-dev

## Story

As a **developer**,
I want **automatic deployments on push to `main`**,
so that **every merged PR is deployed to production automatically**.

## Acceptance Criteria

### AC1: Production Deployment
- **Given** code pushed to `main` branch
- **When** Vercel detects the push
- **Then** build runs and deploys to EU region (Paris `cdg1` ou Frankfurt `fra1`)

### AC2: Preview Deployments
- **Given** a PR is opened against `main`
- **When** Vercel detects the PR
- **Then** a preview deployment is created at `pr-{number}.notiontutor.vercel.app`

### AC3: Environment Variables
- **Given** the app needs runtime secrets
- **When** deploying to any environment
- **Then** all environment variables from architecture spec are securely stored in Vercel dashboard (Production + Preview scopes)

### AC4: Health Endpoint
- **Given** the app is deployed
- **When** `GET /api/health` is called
- **Then** it returns HTTP 200 with status, timestamp and environment info
- **And** can be used for uptime monitoring (NFR17: ≥ 99.5%)

### AC5: Cron Jobs Configuration
- **Given** Vercel cron configuration exists
- **When** the scheduled time arrives
- **Then** `/api/cron/send-digests` runs every hour
- **And** `/api/cron/cleanup` runs daily at 03:00 UTC
- **And** both endpoints are protected by `CRON_SECRET` header validation

### AC6: CI Checks
- **Given** a PR or push triggers CI
- **When** the build pipeline runs
- **Then** TypeScript compilation, ESLint, and Prettier checks all pass
- **And** the build fails if any check fails

## Tasks / Subtasks

- [ ] **Task 1: Create `vercel.json` configuration** (AC: #1, #2, #5)
  - [ ] Configure EU region (`cdg1` ou `fra1`)
  - [ ] Define cron jobs: `/api/cron/send-digests` (every hour), `/api/cron/cleanup` (daily 03:00 UTC)
  - [ ] Configure build settings (framework: Next.js, output directory)

- [ ] **Task 2: Create `/api/health` endpoint** (AC: #4)
  - [ ] Create `src/app/api/health/route.ts`
  - [ ] Return JSON: `{ status: "ok", timestamp, environment, version }`
  - [ ] Public endpoint, no auth required

- [ ] **Task 3: Create cron endpoint stubs** (AC: #5)
  - [ ] Create `src/app/api/cron/send-digests/route.ts` (stub, returns 200)
  - [ ] Create `src/app/api/cron/cleanup/route.ts` (stub, returns 200)
  - [ ] Validate `Authorization: Bearer <CRON_SECRET>` header on both
  - [ ] Return 401 if secret missing/invalid

- [ ] **Task 4: Add CI check script** (AC: #6)
  - [ ] Add `"ci"` script in `package.json`: `"npm run typecheck && npm run lint && npm run format:check"`
  - [ ] Verify `npm run ci` passes locally

- [ ] **Task 5: Update `.env.example`** (AC: #3)
  - [ ] Add `ADMIN_SECRET` (missing from current .env.example)
  - [ ] Verify all architecture-mandated variables are documented

- [ ] **Task 6: Vercel project setup (manual)** (AC: #1, #2, #3)
  - [ ] Connect GitHub repo to Vercel
  - [ ] Set region to EU (cdg1 Paris)
  - [ ] Configure all environment variables in Vercel dashboard
  - [ ] Trigger first deployment and verify it succeeds

- [ ] **Task 7: Verify end-to-end** (AC: #1, #2, #4, #5, #6)
  - [ ] Confirm `GET /api/health` returns 200 on deployed URL
  - [ ] Confirm preview deployment works on a test PR
  - [ ] Run `npm run ci` locally to validate all checks pass

## Dev Notes

### Previous Story Intelligence (Story 0.2)
- Project uses `src/` directory with `@/*` path alias via `tsconfig.json`
- TypeScript strict mode + `noUncheckedIndexedAccess` enabled
- `.env.example` exists and was updated in Story 0.2
- `package.json` scripts: dev, build, start, lint, lint:fix, format, format:check, typecheck, db:*
- Next.js 14.2.35 with App Router
- `next.config.mjs` (not .ts — Next.js 14 doesn't support .ts config)
- Prisma 7.7.0 with `prisma.config.ts` using `dotenv/config` import
- Corporate proxy requires `NODE_TLS_REJECT_UNAUTHORIZED="0"` for external connections

### Architecture Requirements
- **ARCH-6**: Hébergement Vercel, région EU (Paris `cdg1` ou Frankfurt `fra1`) — compliance RGPD
- **ARCH-7**: Scheduler = Vercel Cron pour digests horaires et cleanup quotidien
- **NFR6**: HTTPS only (TLS 1.3) — Vercel enforced automatiquement
- **NFR17**: Disponibilité ≥ 99.5% — health endpoint pour monitoring
- **NFR20**: Notification panne automatique — via health check

### Vercel Configuration Reference

```json
// vercel.json
{
  "regions": ["cdg1"],
  "crons": [
    { "path": "/api/cron/send-digests", "schedule": "0 * * * *" },
    { "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }
  ]
}
```

### API Route Patterns (Next.js App Router)

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version ?? "unknown",
  });
}
```

### Cron Protection Pattern

```typescript
// Shared cron auth validation
function validateCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}
```

### Environment Variables (Architecture Spec Complète)

| Variable | Scope | Required Story |
|----------|-------|----------------|
| `DATABASE_URL` | Production + Preview | 0.2 ✅ |
| `NOTION_CLIENT_ID` | Production + Preview | 1.2 |
| `NOTION_CLIENT_SECRET` | Production + Preview | 1.2 |
| `NOTION_REDIRECT_URI` | Production + Preview | 1.2 |
| `OPENAI_API_KEY` | Production + Preview | 0.5 |
| `RESEND_API_KEY` | Production only | 4.x |
| `ENCRYPTION_KEY` | Production + Preview | 1.2 |
| `SESSION_SECRET` | Production + Preview | 1.2 |
| `CRON_SECRET` | Production only | **0.3** |
| `ADMIN_SECRET` | Production only | **0.3** |
| `NEXT_PUBLIC_APP_URL` | Production + Preview | **0.3** |
| `MOCK_LLM` | Preview only | 0.5 |
| `NODE_ENV` | Auto-set by Vercel | — |

### File Structure

```
src/app/api/
├── health/
│   └── route.ts          ← NEW
└── cron/
    ├── send-digests/
    │   └── route.ts      ← NEW (stub)
    └── cleanup/
        └── route.ts      ← NEW (stub)
vercel.json               ← NEW (project root)
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Déploiement]
- [Source: _bmad-output/planning-artifacts/architecture.md#Variables d'environnement]
- [Source: _bmad-output/planning-artifacts/architecture.md#Monitoring MVP]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR6, NFR17, NFR20]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 0, Story 0.3]

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
