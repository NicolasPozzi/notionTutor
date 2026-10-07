# NotionTutor

> Révisez vos notes Notion avec l'IA

NotionTutor transforme vos notes Notion en sessions de révision interactives avec des questions générées par IA, des digests email quotidiens style Readwise, et du spaced repetition pour mémoriser durablement.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm (comes with Node.js)
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd poc

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-required routes (coming in Epic 1)
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout with Inter font
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles + Tailwind
├── components/            # React components
│   ├── ui/               # Design system atoms
│   └── features/         # Feature-specific components
├── lib/                   # Shared utilities
│   ├── adapters/         # External service adapters
│   │   ├── notion/       # Notion API adapter
│   │   └── llm/          # LLM adapter (OpenAI)
│   ├── db/               # Database utilities (Prisma)
│   └── utils/            # Helper functions
└── types/                # TypeScript types
```

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting
npm run typecheck    # Run TypeScript compiler
npm run test         # Unit & API route tests (Vitest)
npm run test:e2e     # Smoke tests on the production build (Playwright, run `npm run build` first)
npm run ci           # typecheck + lint + format:check + test
```

## 🧪 Tests & CI

- `tests/unit/`: Vitest. Pure logic (encryption, digest scheduling) and API routes with
  Prisma, Notion, the LLM and Resend mocked; no network or database needed.
- `tests/e2e/`: Playwright smoke tests against `next start`. They catch client-side crashes
  (e.g. hydration errors) that typecheck and the build don't. First run:
  `npx playwright install chromium`.
- `.github/workflows/ci.yml` runs typecheck, lint, format, unit tests, build and smoke tests
  on every push to `main` and every pull request.

## 🔒 Database security (Supabase)

The app reaches Postgres only through Prisma (`postgres` role, which bypasses RLS).
Supabase's auto-generated Data API is locked down by
`prisma/sql/lock-down-supabase-api.sql`: RLS enabled on every table, and no
privileges for the public `anon` and `authenticated` roles. `prisma db push`
doesn't manage this, so re-run the script after creating tables:

```bash
psql "$DIRECT_URL" -f prisma/sql/lock-down-supabase-api.sql
```

## 🎨 Design System

NotionTutor uses a Notion-inspired design system:

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#FFFFFF` | Main background |
| `surface` | `#F7F7F7` | Cards, sections |
| `text-primary` | `#000000` | Headings, body |
| `text-secondary` | `#6B7280` | Captions, metadata |
| `feedback-success` | `#22C55E` | Correct answers |
| `feedback-warning` | `#F97316` | To review |
| `feedback-error` | `#EF4444` | Errors |

### Typography

- **Font:** Inter (Google Fonts via next/font)
- **Scale:** 12, 14, 16, 18, 24, 32px

### Spacing

- **Base grid:** 8px
- **Common values:** 8, 16, 24, 32, 48px

### Mobile-First

- Minimum tap target: 44x44px
- Breakpoints: 640px (tablet), 1024px (desktop)

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Description | Required for |
|----------|-------------|--------------|
| `DATABASE_URL` | Supabase PostgreSQL connection | Story 0.2+ |
| `NOTION_CLIENT_ID` | Notion OAuth client ID | Epic 1+ |
| `NOTION_CLIENT_SECRET` | Notion OAuth secret | Epic 1+ |
| `OPENAI_API_KEY` | OpenAI API key | Story 0.5+ |
| `MOCK_LLM` | Use mock LLM responses | Development |
| `ENCRYPTION_KEY` | AES-256 encryption key | Epic 1+ |
| `SESSION_SECRET` | Cookie signing secret | Epic 1+ |

### VS Code Setup

Recommended extensions are listed in `.vscode/extensions.json`. Install them for the best DX:

1. ESLint
2. Prettier
3. Tailwind CSS IntelliSense
4. Prisma

## 📚 Documentation

- [PRD](./_bmad-output/planning-artifacts/prd.md) - Product requirements
- [Architecture](./_bmad-output/planning-artifacts/architecture.md) - Technical decisions
- [UX Design](./_bmad-output/planning-artifacts/ux-design.md) - Design specifications
- [Epics](./_bmad-output/planning-artifacts/epics.md) - User stories breakdown

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19 |
| Styling | Tailwind CSS |
| Language | TypeScript (strict mode) |
| Database | Supabase PostgreSQL |
| ORM | Prisma |
| LLM | OpenAI GPT-4o-mini |
| Email | Resend |
| Hosting | Vercel (EU region) |

## 📄 License

Private - All rights reserved.
# NotionTutor
