# Story 0.1: Project Bootstrap & Development Environment

Status: done

## Story

**As a** developer,  
**I want** a preconfigured Next.js 14 project with TypeScript, Tailwind CSS, and ESLint,  
**So that** I can start implementing features with consistent tooling.

## Acceptance Criteria

1. **AC1: Project runs on fresh clone**
   - **Given** a new machine with Node.js 20+
   - **When** I run `npm install && npm run dev`
   - **Then** the app starts on localhost:3000 without errors

2. **AC2: TypeScript strict mode**
   - **Given** the project configuration
   - **When** TypeScript compiles
   - **Then** strict mode is enabled (tsconfig.json: `"strict": true`)
   - **And** no implicit any types are allowed

3. **AC3: Tailwind CSS integration**
   - **Given** a React component using Tailwind classes
   - **When** the dev server runs
   - **Then** Tailwind CSS compiles without errors
   - **And** utility classes apply correctly in browser

4. **AC4: ESLint code quality**
   - **Given** code with issues (unused vars, missing deps)
   - **When** I run `npm run lint`
   - **Then** ESLint catches the issues
   - **And** errors are shown in VS Code on save

5. **AC5: Prettier formatting**
   - **Given** unformatted code
   - **When** I save a file (with Prettier enabled)
   - **Then** code is auto-formatted consistently

## Tasks / Subtasks

- [x] **Task 1: Initialize Next.js 14 project** (AC: #1)
  - [x] Run `npx create-next-app@14` with App Router
  - [x] Configure for TypeScript, Tailwind, ESLint, src/ directory
  - [x] Verify dev server starts on port 3000

- [x] **Task 2: Configure TypeScript strict mode** (AC: #2)
  - [x] Enable `strict: true` in tsconfig.json
  - [x] Enable `noUncheckedIndexedAccess: true`
  - [x] Verify compilation catches type errors

- [x] **Task 3: Configure Tailwind CSS** (AC: #3)
  - [x] Set up tailwind.config.ts with design tokens (see Design System section)
  - [x] Configure Inter font via `next/font/google`
  - [x] Add color tokens: white, gray-100, black, success-green, warning-orange
  - [x] Set 8px base spacing in config

- [x] **Task 4: Configure ESLint** (AC: #4)
  - [x] Extend `next/core-web-vitals` and `next/typescript`
  - [x] Add React Hooks rules
  - [x] Configure import order rules
  - [x] Verify lint catches issues

- [x] **Task 5: Add Prettier** (AC: #5)
  - [x] Install prettier and eslint-config-prettier
  - [x] Create .prettierrc with project standards
  - [x] Add format script to package.json
  - [x] Configure VS Code settings (workspace)

- [x] **Task 6: Create project structure** (AC: #1)
  - [x] Create folder structure per architecture
  - [x] Add placeholder files for key directories
  - [x] Create README.md with setup instructions

- [x] **Task 7: Add environment variables template** (AC: #1)
  - [x] Create .env.example with all required vars
  - [x] Add .env to .gitignore
  - [x] Document each env var purpose

## Dev Notes

### Architecture Compliance

**Stack Requirements (from architecture.md):**
- Next.js 14 with App Router (NOT Pages Router)
- TypeScript 5.x with strict mode
- Tailwind CSS 3.x
- Deployed to Vercel (EU region)

**Project Structure (target):**
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-required routes group
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Design system atoms
│   └── features/         # Feature-specific components
├── lib/                   # Shared utilities
│   ├── adapters/         # External service adapters
│   │   ├── notion/       # Notion API adapter
│   │   └── llm/          # LLM adapter (OpenAI)
│   ├── db/               # Database utilities (Prisma)
│   └── utils/            # Helper functions
├── styles/               # Global styles
└── types/                # TypeScript types
```

### Design System Tokens (from UX Design)

**Colors:**
```javascript
// tailwind.config.ts
colors: {
  background: '#FFFFFF',
  surface: '#F7F7F7',      // gray-100
  text: {
    primary: '#000000',
    secondary: '#6B7280'   // gray-500
  },
  feedback: {
    success: '#22C55E',    // green-500
    warning: '#F97316',    // orange-500
    error: '#EF4444'       // red-500
  }
}
```

**Typography:**
- Font: Inter (via next/font/google)
- Base size: 16px
- Scale: 12, 14, 16, 18, 24, 32px

**Spacing:**
- Base: 8px grid
- Common: 8, 16, 24, 32, 48px

### Environment Variables (.env.example)

```bash
# Database (Supabase - configured in Story 0.2)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth (Notion OAuth - configured in Epic 1)
NOTION_CLIENT_ID=""
NOTION_CLIENT_SECRET=""
NOTION_REDIRECT_URI="http://localhost:3000/api/auth/notion/callback"

# LLM (OpenAI - configured in Story 0.5)
OPENAI_API_KEY=""
MOCK_LLM="true"  # Use mock responses in dev

# Email (Resend - configured in Epic 4)
RESEND_API_KEY=""

# Security
ENCRYPTION_KEY=""  # 32 bytes, base64 encoded
SESSION_SECRET=""  # Random string for cookies

# Cron Jobs (Vercel)
CRON_SECRET=""

# Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Project Structure Notes

This is the foundation story - no existing code to align with.

**Critical Decisions:**
1. Use `src/` directory (cleaner imports, Next.js recommended)
2. Use App Router exclusively (no pages/ directory)
3. Mobile-first Tailwind config (UX-DR1)
4. Inter font preloaded (UX-DR3)

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit"
  }
}
```

### VS Code Workspace Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### References

- [Source: architecture.md#Technology Stack] - Stack selection rationale
- [Source: architecture.md#System Architecture] - Project structure
- [Source: ux-design.md#Design System] - Color tokens, typography, spacing
- [Source: epics.md#Story 0.1] - Story definition and AC

### Testing Notes

This story is primarily configuration. Validation:
1. `npm run dev` — server starts without errors
2. `npm run build` — production build succeeds
3. `npm run lint` — no lint errors
4. `npm run typecheck` — no type errors
5. Visit localhost:3000 — see default Next.js page with Tailwind styling

### Completion Criteria

Story is DONE when:
- [x] Fresh `git clone && npm install && npm run dev` works
- [x] TypeScript strict mode enabled and enforced
- [x] Tailwind with design tokens compiles
- [x] ESLint runs without errors
- [x] Prettier formats code on save
- [x] All env vars documented in .env.example
- [x] README has clear setup instructions

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (GitHub Copilot)

### Completion Notes List

1. Created Next.js 14 project manually due to existing files in workspace
2. Configured TypeScript with strict mode and `noUncheckedIndexedAccess`
3. Set up Tailwind CSS with NotionTutor design tokens (colors, typography, spacing)
4. Configured ESLint with next/core-web-vitals, prettier integration
5. Added Prettier with tailwindcss plugin
6. Created full project structure with placeholder files
7. Created comprehensive .env.example with all required variables
8. Added VS Code workspace settings and extension recommendations
9. Created landing page with design system colors applied
10. All validation checks pass: typecheck, lint, build, dev server

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-04-07 | Initial project setup | All files created |
| 2026-04-07 | Code review fixes: .gitkeep.ts → .gitkeep, added TODO comments | utils/index.ts, types/index.ts |

### File List

**Configuration Files:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode)
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind with design tokens
- `postcss.config.mjs` - PostCSS for Tailwind
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Prettier ignore patterns
- `.gitignore` - Git ignore patterns
- `.env.example` - Environment variables template
- `next-env.d.ts` - Next.js TypeScript definitions
- `README.md` - Project documentation

**VS Code:**
- `.vscode/settings.json` - Workspace settings
- `.vscode/extensions.json` - Recommended extensions

**Source Code:**
- `src/app/globals.css` - Global styles
- `src/app/layout.tsx` - Root layout with Inter font
- `src/app/page.tsx` - Landing page
- `src/components/ui/.gitkeep` - UI components placeholder
- `src/components/features/.gitkeep` - Feature components placeholder
- `src/lib/adapters/notion/.gitkeep` - Notion adapter placeholder
- `src/lib/adapters/llm/.gitkeep` - LLM adapter placeholder
- `src/lib/db/.gitkeep` - Database utilities placeholder
- `src/lib/utils/index.ts` - Utility functions
- `src/types/index.ts` - TypeScript types
