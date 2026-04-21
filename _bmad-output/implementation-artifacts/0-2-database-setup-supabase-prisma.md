# Story 0.2: Database Setup with Supabase & Prisma

Status: ready-for-dev

## Story

**As a** developer,  
**I want** Prisma connected to Supabase PostgreSQL with migration support,  
**So that** I can define and evolve the database schema safely.

## Acceptance Criteria

1. **AC1: Prisma configuration**
   - **Given** Prisma is installed
   - **When** I inspect `prisma/schema.prisma`
   - **Then** it defines all 6 tables from architecture spec
   - **And** uses PostgreSQL provider with Supabase

2. **AC2: Database connection**
   - **Given** environment variables are set in `.env`
   - **When** I run `npx prisma db push` or `npx prisma migrate dev`
   - **Then** schema is applied to Supabase PostgreSQL
   - **And** connection uses pooler mode `transaction` (PgBouncer)

3. **AC3: Prisma Client generation**
   - **Given** schema is defined
   - **When** I run `npx prisma generate`
   - **Then** typed Prisma Client is generated
   - **And** types match our TypeScript definitions in `src/types/`

4. **AC4: Database utility module**
   - **Given** Prisma Client is generated
   - **When** I import from `@/lib/db`
   - **Then** I get a singleton Prisma instance
   - **And** connection pooling is handled correctly for serverless

5. **AC5: Seed script (optional)**
   - **Given** database is empty
   - **When** I run `npx prisma db seed`
   - **Then** test data is inserted for development

## Tasks / Subtasks

- [ ] **Task 1: Install Prisma** (AC: #1)
  - [ ] Run `npm install prisma @prisma/client`
  - [ ] Run `npx prisma init --datasource-provider postgresql`
  - [ ] Verify `prisma/schema.prisma` is created

- [ ] **Task 2: Configure Supabase connection** (AC: #2)
  - [ ] Get connection strings from Supabase dashboard
  - [ ] Configure `DATABASE_URL` with pooler (port 6543, `?pgbouncer=true`)
  - [ ] Configure `DIRECT_URL` for migrations (port 5432)
  - [ ] Update `.env.example` with correct format

- [ ] **Task 3: Define database schema** (AC: #1, #3)
  - [ ] Create User model with all fields from architecture
  - [ ] Create RevisionSession model
  - [ ] Create Question model
  - [ ] Create QuestionAttempt model
  - [ ] Create Digest model
  - [ ] Create UserStreak model
  - [ ] Define all relations (CASCADE deletes)
  - [ ] Add indexes for performance

- [ ] **Task 4: Create Prisma Client singleton** (AC: #4)
  - [ ] Create `src/lib/db/prisma.ts` with singleton pattern
  - [ ] Handle development hot-reload (global instance)
  - [ ] Export from `src/lib/db/index.ts`

- [ ] **Task 5: Run initial migration** (AC: #2)
  - [ ] Run `npx prisma migrate dev --name init`
  - [ ] Verify tables created in Supabase
  - [ ] Commit migration files to git

- [ ] **Task 6: Add npm scripts** (AC: #2)
  - [ ] Add `db:push` script
  - [ ] Add `db:migrate` script
  - [ ] Add `db:studio` script
  - [ ] Add `db:generate` script

- [ ] **Task 7: Create seed script (optional)** (AC: #5)
  - [ ] Create `prisma/seed.ts`
  - [ ] Configure seed in package.json
  - [ ] Add test user for development

## Dev Notes

### Previous Story Intelligence (Story 0.1)

- Project structure uses `src/` directory with `@/*` path alias
- TypeScript strict mode is enabled
- `.env.example` already exists with DATABASE_URL placeholder
- `src/lib/db/.gitkeep` placeholder exists — replace with actual module
- `src/types/index.ts` has User, RevisionSession, Question types defined

### Architecture Requirements

**From architecture.md:**
- ARCH-1: Stack includes Supabase PostgreSQL
- ARCH-3: ORM = Prisma for type-safety and migrations
- ARCH-8: Connection pooling mode `transaction` (PgBouncer)

**Database Schema (6 tables):**
1. `users` — Notion OAuth users
2. `revision_sessions` — Learning sessions
3. `questions` — AI-generated questions
4. `question_attempts` — Answer tracking
5. `digests` — Email digest configs
6. `user_streaks` — Gamification streaks

### Supabase Configuration

**Connection Strings Format:**

```bash
# For application (pooled via PgBouncer)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# For Prisma migrations (direct connection)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**Why two URLs?**
- `DATABASE_URL` with `pgbouncer=true` for runtime (connection pooling)
- `DIRECT_URL` for migrations (Prisma needs direct connection for DDL)

### Prisma Schema Structure

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id                String    @id @default(uuid())
  notionUserId      String    @unique @map("notion_user_id")
  email             String?
  name              String?
  avatarUrl         String?   @map("avatar_url")
  notionToken       String    @map("notion_token")  // encrypted
  notionWorkspaceId String?   @map("notion_workspace_id")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  lastLoginAt       DateTime? @map("last_login_at")
  deletedAt         DateTime? @map("deleted_at")

  sessions  RevisionSession[]
  questions Question[]
  digests   Digest[]
  streak    UserStreak?

  @@map("users")
}

// ... see full schema below
```

### Prisma Client Singleton Pattern

```typescript
// src/lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Why singleton?**
- Next.js hot-reload creates new connections on each save
- Without singleton, connections exhaust pool quickly
- Global instance persists across hot-reloads

### Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### NFRs Covered

- **NFR17** (Disponibilité ≥99.5%): Supabase managed infrastructure
- **NFR19** (Backup DB quotidien): Supabase auto-backups

### Data Types Mapping

| SQL Type | Prisma Type | Notes |
|----------|-------------|-------|
| `UUID` | `String @id @default(uuid())` | Auto-generated |
| `VARCHAR(255)` | `String` | Default length |
| `TEXT` | `String` | No max length |
| `TIMESTAMP` | `DateTime` | Prisma handles TZ |
| `INT` | `Int` | |
| `BOOLEAN` | `Boolean` | |
| `DATE` | `DateTime @db.Date` | Date only |
| `TIME` | `String` | Store as "HH:MM" |

### CRITICAL: Encryption Note

The `notion_token`, `question_text`, and `answer_excerpt` fields should be encrypted at the application layer (Story 0.5 / Epic 1). For now, store them as plain text in development. Add `// TODO: encrypt` comments.

### References

- [Source: architecture.md#Data Model] - Complete database schema
- [Source: architecture.md#ARCH-3, ARCH-8] - Prisma and connection pooling
- [Source: epics.md#Story 0.2] - Story definition
- [Prisma with Supabase docs](https://www.prisma.io/docs/guides/database/supabase)

### Testing Notes

Validation:
1. `npx prisma validate` — schema is valid
2. `npx prisma generate` — client generates without errors
3. `npx prisma db push` — schema applies to Supabase
4. `npx prisma studio` — can browse tables in GUI
5. Import `prisma` and query — returns typed results

### Completion Criteria

Story is DONE when:
- [ ] Prisma schema defines all 6 tables with relations
- [ ] Migrations run successfully against Supabase
- [ ] Prisma Client generates typed queries
- [ ] Singleton pattern prevents connection leaks
- [ ] npm scripts work (`db:push`, `db:migrate`, `db:studio`)
- [ ] `.env.example` has correct connection string format

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### Change Log

| Date | Change | Files |
|------|--------|-------|
| | | |

### File List

_To be filled by dev agent after implementation_
