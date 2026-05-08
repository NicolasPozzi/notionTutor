# Story 1.1: Landing Page avec Login Notion

Status: ready-for-dev

## Story

As a **visitor**,
I want **to see a clear landing page explaining NotionTutor and login with one click**,
so that **I understand the value and can start using the app quickly**.

## Acceptance Criteria

### AC1: Landing Page Content
- **Given** I'm on the landing page (unauthenticated)
- **When** the page loads
- **Then** I see the product value proposition
- **And** a "How it works" section
- **And** the page is mobile-first and responsive

### AC2: Login Button
- **Given** I'm on the landing page
- **When** I click "Se connecter avec Notion"
- **Then** I'm redirected to Notion OAuth consent screen
- **And** the button uses the design system (btn-primary)

### AC3: Privacy Link
- **Given** I'm on the landing page
- **When** I look below the login button
- **Then** a link to "Comment vos données sont protégées" is visible
- **And** it links to `/security` (to be built in Story 1.4)

### AC4: OAuth Redirect Endpoint
- **Given** `NOTION_CLIENT_ID` and `NOTION_REDIRECT_URI` are configured
- **When** the login button is clicked
- **Then** `GET /api/auth/notion` redirects to Notion OAuth with correct params
- **And** includes PKCE code_challenge for security

## Tasks / Subtasks

- [ ] **Task 1: Redesign landing page** (AC: #1, #2, #3)
  - [ ] Hero section with NotionTutor branding + tagline
  - [ ] Value proposition (3 benefits with icons)
  - [ ] "How it works" section (3 steps)
  - [ ] Trust/security section with privacy link
  - [ ] Active login button redirecting to `/api/auth/notion`
  - [ ] Mobile-first, responsive layout

- [ ] **Task 2: Create OAuth redirect endpoint** (AC: #4)
  - [ ] Create `src/app/api/auth/notion/route.ts`
  - [ ] Build Notion OAuth authorization URL with params
  - [ ] Generate PKCE code_verifier + code_challenge
  - [ ] Store code_verifier in cookie for callback validation
  - [ ] Redirect to Notion OAuth consent screen

- [ ] **Task 3: Add security placeholder page** (AC: #3)
  - [ ] Create `src/app/security/page.tsx` (placeholder)
  - [ ] Basic content about data protection (to be expanded in Story 1.4)

## Dev Notes

### Architecture Requirements
- **ADR-001**: Notion OAuth as sole identity source
- Auth endpoints: `/api/auth/notion` (initiate), `/api/auth/notion/callback` (Story 1.2)
- Notion OAuth 2.0 with PKCE (Authorization Code Flow)
- Scopes: read user info + read content

### Notion OAuth URL Format
```
https://api.notion.com/v1/oauth/authorize?
  client_id={NOTION_CLIENT_ID}
  &redirect_uri={NOTION_REDIRECT_URI}
  &response_type=code
  &owner=user
  &state={random_state}
```

### UX Requirements
- "Lecture seule" message visible near login button (trust building)
- CTA clear and prominent
- Mobile-first: content readable on 320px+
- Onboarding flow: Landing → Click Login → Notion OAuth → (Story 1.2 handles callback)

### File Structure
```
src/app/
├── page.tsx                          ← MODIFY (landing page redesign)
├── security/
│   └── page.tsx                      ← NEW (placeholder)
└── api/auth/notion/
    └── route.ts                      ← NEW (OAuth redirect)
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-001]
- [Source: _bmad-output/planning-artifacts/architecture.md#Auth Endpoints]
- [Source: _bmad-output/planning-artifacts/ux-design.md#Onboarding Flow]
- [Source: _bmad-output/planning-artifacts/prd.md#FR1, FR6, FR34, FR35]

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
