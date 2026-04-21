---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-stack
  - step-04-system-architecture
  - step-05-data-model
  - step-06-api-design
  - step-07-integrations
  - step-08-infrastructure
  - step-09-security
  - step-10-validation
inputDocuments:
  - prd.md
  - ux-design.md
workflowType: 'architecture'
project_name: NotionTutor
user_name: Nicolas.pozzi
date: 2026-04-03
---

# Architecture Decision Document - NotionTutor

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (36 FRs en 7 domaines)**

Le PRD définit une application SaaS EdTech avec les capacités suivantes :
- **Gestion utilisateur** : Auth email/social, RGPD complet (suppression, export)
- **Intégration Notion** : OAuth 2.0, lecture seule, sélection granulaire workspaces
- **Révision IA** : Génération questions LLM, feedback contextuel, auto-évaluation
- **Proactivité** : Digest emails quotidiens/hebdomadaires avec micro-questions
- **Progression** : Historique, spaced repetition, évitement des répétitions

**Non-Functional Requirements critiques**
- Performance : < 1s synchro Notion, < 3s génération IA
- Sécurité : AES-256, TLS 1.3, traitement éphémère du contenu des notes
- Disponibilité : ≥ 99.5%
- Scalabilité : Architecture supportant 1K → 10K MAU

### Scale & Complexity

| Attribut | Valeur |
|----------|--------|
| **Domaine technique** | Full-stack Web (SPA + API + Integrations) |
| **Niveau de complexité** | Moyenne-haute |
| **Composants principaux** | ~8 (Auth, Notion, LLM, Email, API, DB, Frontend, Scheduler) |
| **Intégrations externes** | 3 critiques (Notion API, LLM Provider, Email Service) |

### Technical Constraints & Dependencies

**Contraintes Notion API**
- Rate limit : 3 req/sec par intégration
- OAuth scopes : Lecture seule requise
- Pagination : 100 items max par requête

**Contraintes LLM**
- Latence cible : < 3 secondes pour première question
- Abstraction requise pour changement de provider sans refonte

**Contraintes Données (RGPD)**
- Contenu notes Notion : traitement éphémère uniquement
- Tokens OAuth : chiffrement AES-256 obligatoire
- Droit à l'oubli : suppression complète sous 30 jours

### Cross-Cutting Concerns

| Concern | Impact |
|---------|--------|
| **Sécurité** | Chiffrement, auth, audit logs |
| **Observabilité** | Monitoring API externes, alertes |
| **Évolutivité** | Abstraction pour futurs connecteurs (OneNote, Keep) |
| **Internationalisation** | Structure pour i18n (différée mais prévue) |

## Technology Stack

### Stack Selection Rationale

**Philosophie :** Stack "tout-en-un" optimisée pour MVP rapide avec un seul développeur. Simplicité > Architecture parfaite.

### Stack Retenue

| Couche | Technologie | Version | Justification |
|--------|-------------|---------|---------------|
| **Frontend** | Next.js (App Router) | 14.x | SPA + SSR landing, même codebase |
| **Backend** | Next.js API Routes | 14.x | Pas de serveur séparé, simplicité |
| **Auth** | Notion OAuth | — | Login with Notion uniquement (MVP) |
| **Database** | Supabase PostgreSQL | — | Gratuit MVP, row-level security |
| **ORM** | Prisma | 5.x | Type-safe, migrations faciles |
| **LLM** | OpenAI GPT-4o-mini | — | Bon ratio qualité/prix/vitesse |
| **Email** | Resend | — | Simple, 3K/mois gratuit |
| **Hébergement** | Vercel | — | Deploy auto, preview PRs |
| **Scheduler** | Vercel Cron | — | Intégré, triggers digests |
| **Monitoring** | Vercel Analytics + Sentry | — | Observabilité de base |

### Architecture Decision Record: Authentication

**ADR-001: Login with Notion uniquement**

| Attribut | Valeur |
|----------|--------|
| **Statut** | Accepté |
| **Contexte** | NotionTutor cible exclusivement les utilisateurs Notion pour le MVP |
| **Décision** | Utiliser Notion OAuth comme seule source d'identité |
| **Conséquences positives** | Zéro friction (1 clic), pas de double système auth, simplicité |
| **Conséquences négatives** | Bloque futurs connecteurs non-Notion sans refonte auth |
| **Migration future** | Ajouter auth email/social si expansion vers OneNote/Keep (~2-3 jours) |

### Coût Estimé MVP

| Service | Tier | Coût/mois |
|---------|------|-----------|
| Vercel | Hobby → Pro | $0 → $20 |
| Supabase | Free | $0 |
| OpenAI | Pay-as-you-go | ~$20-40 |
| Resend | Free (3K emails) | $0 |
| Domaine | — | ~$12/an |
| **Total MVP** | | **~$20-50/mois** |

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           UTILISATEUR                                │
│                              📱 💻                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Application                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │   │
│  │  │   Pages/     │  │   API/       │  │   Middleware     │  │   │
│  │  │   Components │  │   Routes     │  │   (Auth check)   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────┐                                                │
│  │  Vercel Cron    │ ← Triggers quotidiens (digests)                │
│  └─────────────────┘                                                │
└──────────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   SUPABASE       │  │   NOTION API     │  │   OPENAI API     │
│  ┌────────────┐  │  │                  │  │                  │
│  │ PostgreSQL │  │  │  OAuth 2.0       │  │  GPT-4o-mini     │
│  │            │  │  │  Read pages      │  │  Génération Q    │
│  │ - Users    │  │  │  Search          │  │                  │
│  │ - Sessions │  │  │                  │  │                  │
│  │ - Questions│  │  │                  │  │                  │
│  │ - Digests  │  │  │                  │  │                  │
│  └────────────┘  │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │   RESEND         │
                                            │                  │
                                            │  Digest emails   │
                                            │  Transactional   │
                                            │                  │
                                            └──────────────────┘
```

### Components

| Composant | Responsabilité | Technologie |
|-----------|----------------|-------------|
| **Web App** | UI, routing, state client | Next.js + React |
| **API Layer** | Business logic, orchestration | Next.js API Routes |
| **Auth Service** | OAuth Notion, sessions | Notion OAuth + JWT |
| **Notion Adapter** | Abstraction API Notion | Custom module |
| **LLM Adapter** | Abstraction génération questions | Custom module |
| **Email Service** | Envoi digests et transactionnels | Resend SDK |
| **Scheduler** | Triggers cron pour digests | Vercel Cron |
| **Database** | Persistance données | Supabase PostgreSQL + Prisma |

### Security Architecture

| Aspect | Implémentation |
|--------|----------------|
| **Transport** | HTTPS only (Vercel enforce) |
| **Auth** | Notion OAuth + session cookie HttpOnly |
| **Tokens Notion** | Chiffrés AES-256 en DB |
| **Questions stockées** | Chiffrées AES-256 |
| **Rate limiting** | Vercel Edge + custom middleware |
| **CORS** | Strict, domaine uniquement |

## Data Model

### Database Schema

```sql
-- USERS
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_user_id  VARCHAR(255) UNIQUE NOT NULL,
  email           VARCHAR(255),
  name            VARCHAR(255),
  avatar_url      TEXT,
  notion_token    TEXT NOT NULL,  -- encrypted AES-256
  notion_workspace_id VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  last_login_at   TIMESTAMP,
  deleted_at      TIMESTAMP       -- soft delete RGPD
);

-- REVISION_SESSIONS
CREATE TABLE revision_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  notion_page_id  VARCHAR(255) NOT NULL,
  notion_page_title VARCHAR(500),
  status          VARCHAR(20) DEFAULT 'in_progress',  -- in_progress, completed, abandoned
  questions_total INT DEFAULT 0,
  questions_answered INT DEFAULT 0,
  correct_count   INT DEFAULT 0,
  started_at      TIMESTAMP DEFAULT NOW(),
  completed_at    TIMESTAMP
);

-- QUESTIONS
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id      UUID REFERENCES revision_sessions(id),
  notion_page_id  VARCHAR(255) NOT NULL,
  question_text   TEXT NOT NULL,  -- encrypted AES-256
  answer_excerpt  TEXT,           -- encrypted AES-256
  question_hash   VARCHAR(64),    -- pour éviter doublons
  times_asked     INT DEFAULT 1,
  times_correct   INT DEFAULT 0,
  last_asked_at   TIMESTAMP,
  next_review_at  TIMESTAMP,      -- spaced repetition
  created_at      TIMESTAMP DEFAULT NOW()
);

-- QUESTION_ATTEMPTS
CREATE TABLE question_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     UUID REFERENCES questions(id) ON DELETE CASCADE,
  session_id      UUID REFERENCES revision_sessions(id),
  is_correct      BOOLEAN NOT NULL,
  attempted_at    TIMESTAMP DEFAULT NOW()
);

-- DIGESTS
CREATE TABLE digests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  notion_page_id  VARCHAR(255) NOT NULL,
  notion_page_title VARCHAR(500),
  frequency       VARCHAR(10) DEFAULT 'daily',  -- daily, weekly
  send_time       TIME DEFAULT '08:00',
  timezone        VARCHAR(50) DEFAULT 'Europe/Paris',
  duration_days   INT,            -- NULL = indéfini
  started_at      TIMESTAMP DEFAULT NOW(),
  ends_at         TIMESTAMP,
  last_sent_at    TIMESTAMP,
  unsubscribe_token VARCHAR(64) UNIQUE,  -- pour unsubscribe sans auth
  status          VARCHAR(20) DEFAULT 'active',  -- active, paused, completed
  created_at      TIMESTAMP DEFAULT NOW()
);

-- USER_STREAKS
CREATE TABLE user_streaks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak  INT DEFAULT 0,
  longest_streak  INT DEFAULT 0,
  last_activity_date DATE,
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_sessions_user_status ON revision_sessions(user_id, status);
CREATE INDEX idx_questions_user_page ON questions(user_id, notion_page_id);
CREATE INDEX idx_questions_next_review ON questions(user_id, next_review_at);
CREATE INDEX idx_digests_send_time ON digests(status, send_time) WHERE status = 'active';
CREATE INDEX idx_digests_unsubscribe ON digests(unsubscribe_token);
CREATE INDEX idx_streaks_user ON user_streaks(user_id);
```

### Data Encryption

| Table | Colonne | Chiffrement |
|-------|---------|-------------|
| `users` | `notion_token` | AES-256-GCM |
| `questions` | `question_text` | AES-256-GCM |
| `questions` | `answer_excerpt` | AES-256-GCM |

**Clé de chiffrement :** Variable d'environnement `ENCRYPTION_KEY` (32 bytes)

### GDPR Compliance

```sql
-- Soft delete immédiat
UPDATE users SET deleted_at = NOW() WHERE id = :user_id;

-- Hard delete après 30 jours (cron job)
DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';
-- CASCADE supprime sessions, questions, digests, streaks
```

## API Design

### Error Response Format (Standardisé)

Toutes les erreurs suivent ce format :

```typescript
{
  error: {
    code: string,        // ex: "NOTION_RATE_LIMITED", "VALIDATION_ERROR"
    message: string,     // Message human-readable
    details?: object,    // Détails additionnels (validation errors, etc.)
    retryAfter?: number  // Secondes avant retry (si rate limited)
  }
}
```

### Rate Limiting

| Endpoint Pattern | Limite | Justification |
|------------------|--------|---------------|
| `/api/auth/*` | 10 req/min | Protection brute force |
| `/api/revision/start` | 10 req/min | Génération LLM coûteuse |
| `/api/pages/*` | 30 req/min | Appels Notion |
| `/api/*` (autres) | 100 req/min | Usage normal |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/notion` | Initie OAuth Notion (redirect) |
| `GET` | `/api/auth/notion/callback` | Callback OAuth, crée session |
| `POST` | `/api/auth/logout` | Déconnexion, supprime session |
| `GET` | `/api/auth/me` | Retourne user courant |

### Pages Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pages` | Liste pages Notion (paginé) |
| `GET` | `/api/pages/:pageId` | Détail d'une page |

### Revision Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/revision/start` | Démarre session (idempotent*) |
| `GET` | `/api/revision/current` | Session en cours |
| `GET` | `/api/revision/:sessionId` | Détail session |
| `POST` | `/api/revision/:sessionId/answer` | Soumettre réponse |
| `POST` | `/api/revision/:sessionId/complete` | Terminer session |
| `POST` | `/api/revision/:sessionId/abandon` | Abandonner session |

**\*Idempotence :** Si une session `in_progress` existe déjà pour cette page, elle est retournée au lieu d'en créer une nouvelle.

### Digest Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/digests` | Liste digests (paginé) |
| `POST` | `/api/digests` | Créer digest |
| `POST` | `/api/digests/preview` | Preview question email |
| `GET` | `/api/digests/:digestId` | Détail digest |
| `PATCH` | `/api/digests/:digestId` | Modifier digest |
| `DELETE` | `/api/digests/:digestId` | Supprimer digest |
| `POST` | `/api/digests/:digestId/pause` | Mettre en pause |
| `POST` | `/api/digests/:digestId/resume` | Reprendre |
| `GET` | `/api/digests/unsubscribe/:token` | Unsubscribe sans auth (email) |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/stats` | Statistiques utilisateur |
| `GET` | `/api/user/streak` | Streak actuel |
| `DELETE` | `/api/user/account` | Demande suppression (RGPD) |
| `GET` | `/api/user/export` | Export données (RGPD) |

### System Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Health check (monitoring) | Public |
| `POST` | `/api/cron/send-digests` | Envoie digests | CRON_SECRET |
| `POST` | `/api/cron/cleanup` | Nettoyage données | CRON_SECRET |
| `GET` | `/api/admin/stats` | Stats globales (founder) | ADMIN_SECRET |

### Deep Link Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/digest-link/:token` | Redirect vers question depuis email |

### Response Codes

| Code | Usage |
|------|-------|
| `200` | Succès |
| `201` | Création réussie |
| `400` | Erreur de validation |
| `401` | Non authentifié |
| `403` | Non autorisé |
| `404` | Ressource non trouvée |
| `429` | Rate limit dépassé |
| `500` | Erreur serveur |
| `503` | Service externe indisponible |

## External Integrations

### Notion API

| Aspect | Spécification |
|--------|---------------|
| **Documentation** | [developers.notion.com](https://developers.notion.com) |
| **Auth** | OAuth 2.0 (Authorization Code Flow) |
| **Scopes** | `read_user`, `read_content` |
| **Base URL** | `https://api.notion.com/v1/` |
| **Rate Limit** | 3 requêtes/seconde |
| **Retry Strategy** | Exponential backoff (1s, 2s, 4s, max 3 retries) |

**Endpoints utilisés :**

| Endpoint | Usage |
|----------|-------|
| `POST /oauth/token` | Exchange code → access_token |
| `GET /users/me` | Info utilisateur Notion |
| `POST /search` | Lister pages accessibles |
| `GET /blocks/:id/children` | Contenu d'une page |
| `GET /pages/:id` | Métadonnées page |

### OpenAI API

| Aspect | Spécification |
|--------|---------------|
| **Documentation** | [platform.openai.com](https://platform.openai.com/docs) |
| **Model** | `gpt-4o-mini` |
| **Auth** | API Key (Bearer token) |
| **Base URL** | `https://api.openai.com/v1/` |
| **Timeout** | 30 secondes |
| **Max tokens** | 1000 (réponse) |

**Prompt système pour génération de questions :**
```
Tu es un tuteur expert. À partir du contenu suivant, génère {count} questions 
de révision pertinentes et variées. Les questions doivent :
- Tester la compréhension, pas juste la mémorisation
- Être formulées clairement
- Avoir des réponses trouvables dans le contenu

Format JSON: [{"question": "...", "answerExcerpt": "..."}]
```

### Resend Email

| Aspect | Spécification |
|--------|---------------|
| **Documentation** | [resend.com/docs](https://resend.com/docs) |
| **Auth** | API Key |
| **From** | `digest@notiontutor.com` |
| **Templates** | React Email (JSX) |

### Adapter Pattern & Circuit Breaker

Chaque intégration est abstraite via un adapter pour faciliter les changements futurs et implémente un circuit breaker :

```typescript
// Ouvre le circuit après 5 échecs consécutifs
// Reset après 60 secondes
const circuitBreaker = {
  notion: { failures: 0, lastFailure: null, state: 'closed' },
  openai: { failures: 0, lastFailure: null, state: 'closed' },
  resend: { failures: 0, lastFailure: null, state: 'closed' }
}
```

## Infrastructure & Deployment

### Régions (RGPD Compliance)

| Service | Région | Justification |
|---------|--------|---------------|
| **Vercel** | `cdg1` (Paris) ou `fra1` (Frankfurt) | Latence EU + compliance RGPD |
| **Supabase** | EU (Frankfurt) | Données utilisateurs en Europe |

**⚠️ Important :** Configurer explicitement les régions lors de la création des projets.

### Architecture Cloud

```
┌─────────────────────────────────────────────────────────────────────┐
│                          VERCEL (EU)                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    PRODUCTION                                │   │
│  │  notiontutor.com                                            │   │
│  │  ├── Edge Network (CDN global)                              │   │
│  │  ├── Serverless Functions (API Routes)                      │   │
│  │  └── Static Assets (Next.js build)                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    PREVIEW                                   │   │
│  │  pr-{number}.notiontutor.vercel.app                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    CRON JOBS                                 │   │
│  │  ├── send-digests    (every hour)                           │   │
│  │  └── cleanup         (daily at 3:00 UTC)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SUPABASE (EU)                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                         │   │
│  │  ├── Connection pooling: PgBouncer (mode: TRANSACTION)      │   │
│  │  └── Daily backups (7 days retention)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Connection Pooling

**⚠️ Configuration Critique :**

Supabase utilise PgBouncer pour le connection pooling. Pour les serverless functions, utiliser le mode `transaction` (pas `session`) :

```
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1
```

### Environnements

| Environnement | URL | Database | Usage |
|---------------|-----|----------|-------|
| **Production** | `notiontutor.com` | Supabase prod | Users réels |
| **Preview** | `pr-*.vercel.app` | Supabase staging | Test PR |
| **Local** | `localhost:3000` | Docker local | Dev |

### Variables d'Environnement

```bash
# Database
DATABASE_URL=postgresql://...@db.xxx.supabase.co:5432/postgres?pgbouncer=true

# Notion OAuth
NOTION_CLIENT_ID=xxx
NOTION_CLIENT_SECRET=xxx
NOTION_REDIRECT_URI=https://notiontutor.com/api/auth/notion/callback

# OpenAI
OPENAI_API_KEY=sk-xxx

# Resend
RESEND_API_KEY=re_xxx

# Security
ENCRYPTION_KEY=xxx  # 32 bytes, base64 encoded
SESSION_SECRET=xxx  # Pour JWT sessions
CRON_SECRET=xxx     # Pour endpoints cron
ADMIN_SECRET=xxx    # Pour /api/admin/*

# App
NEXT_PUBLIC_APP_URL=https://notiontutor.com
```

### CI/CD Pipeline

```yaml
# Workflow automatique Vercel

main branch:
  push → Build → Tests → Deploy Production

feature branches:
  push → Build → Tests → Deploy Preview
```

**Checks obligatoires avant merge :**
- ✅ Build réussi
- ✅ Tests passent
- ✅ TypeScript sans erreurs
- ✅ ESLint sans erreurs

### Monitoring (MVP Simplifié)

Pour le MVP, monitoring minimal sans services externes :

| Aspect | Solution MVP |
|--------|--------------|
| **Logs** | Vercel Logs (inclus) |
| **Performance** | Vercel Analytics (inclus) |
| **Uptime** | Cron `/api/health` + alerte email si fail |
| **Errors** | Logs Vercel + review manuelle |

**Growth (post-MVP) :** Ajouter Sentry pour error tracking.

### Coûts Estimés Détaillés

**OpenAI - Calcul précis :**

| Paramètre | Valeur |
|-----------|--------|
| Tokens/question générée | ~150 output |
| Tokens input (page content) | ~500 moyenne |
| Questions/session | 5 |
| Sessions/jour (100 MAU) | ~50 |
| Coût GPT-4o-mini | $0.15/1M input, $0.60/1M output |

```
Coût/session = (500 * 0.15 + 750 * 0.60) / 1,000,000 = ~$0.0005
Coût/jour (50 sessions) = $0.025
Coût/mois = ~$0.75
```

**Avec 1000 MAU et 500 sessions/jour :** ~$7.50/mois

| Service | Tier | Coût/mois (100 MAU) | Coût/mois (1K MAU) |
|---------|------|---------------------|---------------------|
| Vercel | Free → Pro | $0 | $20 |
| Supabase | Free | $0 | $0 (ou $25 si > 500MB) |
| OpenAI | Pay-as-you-go | ~$1 | ~$8 |
| Resend | Free | $0 | $0 |
| Domaine | — | ~$1 | ~$1 |
| **Total** | | **~$2/mois** | **~$30/mois** |

### Migrations Database

**Procédure de migration production :**

```bash
# 1. Backup avant migration
npx supabase db dump -f backup.sql

# 2. Test migration sur staging
npx prisma migrate deploy --preview-feature

# 3. Si OK, appliquer en prod
npx prisma migrate deploy

# 4. Vérifier santé
curl https://notiontutor.com/api/health
```

**⚠️ Documenter cette procédure AVANT le premier besoin urgent.**

### Scripts de Développement

```bash
# Setup complet pour nouveau dev
npm install
cp .env.example .env.local
npm run db:setup    # Lance Supabase Docker local
npm run db:seed     # Crée données de test
npm run dev         # Lance l'app

# Commandes utiles
npm run db:migrate  # Applique migrations Prisma
npm run db:studio   # Ouvre Prisma Studio
npm run test        # Tests unitaires
npm run test:e2e    # Tests E2E
```

## Security Architecture

### Threat Model

| Menace | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Vol de token Notion** | Accès aux notes utilisateur | Moyenne | Chiffrement AES-256, rotation |
| **Injection SQL** | Exfiltration données | Faible | Prisma ORM (paramétré) |
| **XSS** | Vol de session | Faible | React escape, CSP headers |
| **CSRF** | Actions non autorisées | Faible | SameSite cookies |
| **Brute force OAuth** | Compte compromis | Moyenne | Rate limiting strict |
| **Fuite clé API OpenAI** | Coûts non contrôlés | Moyenne | Server-side only, monitoring |

### Authentication & Sessions

| Aspect | Implémentation |
|--------|----------------|
| **Méthode** | Notion OAuth 2.0 (PKCE) |
| **Session** | JWT signé (HS256) |
| **Stockage** | Cookie HttpOnly, Secure, SameSite=Lax |
| **Durée** | 30 jours (refresh automatique) |
| **Invalidation** | Logout + blacklist si compromis |

```typescript
// Configuration cookie de session
{
  name: 'notiontutor_session',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60  // 30 jours
}
```

### Data Encryption

| Donnée | Algorithme | Clé |
|--------|------------|-----|
| **Tokens Notion** | AES-256-GCM | `ENCRYPTION_KEY` |
| **Questions générées** | AES-256-GCM | `ENCRYPTION_KEY` |
| **Answer excerpts** | AES-256-GCM | `ENCRYPTION_KEY` |

### Security Headers

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  }
];
```

### Endpoint Protection

| Type | Protection |
|------|------------|
| **API Routes** | Middleware auth (vérifie session cookie) |
| **Cron endpoints** | Header `Authorization: Bearer CRON_SECRET` |
| **Admin endpoints** | Header `Authorization: Bearer ADMIN_SECRET` |
| **Public** | `/api/auth/*`, `/api/health`, `/api/digests/unsubscribe/:token` |

### GDPR Compliance

| Exigence | Implémentation |
|----------|----------------|
| **Consentement** | Checkbox CGU au premier login |
| **Droit d'accès** | `GET /api/user/export` |
| **Droit à l'oubli** | `DELETE /api/user/account` |
| **Portabilité** | Export JSON complet |
| **Minimisation** | Pas de stockage contenu notes |
| **Chiffrement** | AES-256 données sensibles |

## Architecture Validation

### Requirements Coverage

| Domaine FR | Couverture Architecture |
|------------|-------------------------|
| Gestion Utilisateur (FR1-5) | ✅ Auth Notion OAuth + endpoints RGPD |
| Intégration Notion (FR6-11) | ✅ Notion Adapter + OAuth flow |
| Navigation (FR12-15) | ✅ Pages API + pagination |
| Session Révision (FR16-22) | ✅ Revision API + LLM Adapter |
| Digest Email (FR23-28) | ✅ Digest API + Resend + Cron |
| Historique (FR29-33) | ✅ Data model + spaced repetition |
| Confiance/Sécurité (FR34-36) | ✅ Security headers + encryption |

### NFR Coverage

| NFR | Cible | Solution Architecture |
|-----|-------|----------------------|
| Synchro Notion < 1s | ✅ | Cache + Notion pagination |
| Génération IA < 3s | ✅ | GPT-4o-mini + timeout |
| Disponibilité 99.5% | ✅ | Vercel Edge + health check |
| Scalabilité 10K MAU | ✅ | Serverless + connection pooling |
| Chiffrement AES-256 | ✅ | Encryption module |

### Technical Debt Accepted (MVP)

| Élément | Impact | Remédiation Growth |
|---------|--------|-------------------|
| Pas de Sentry | Debug plus lent | Ajouter Sentry |
| Monitoring minimal | Alertes limitées | Better Uptime |
| Login Notion only | Bloque multi-connectors | Ajouter auth email |
| Cold starts | Latence 1er appel | Warm-up cron |

## Summary

**Architecture NotionTutor MVP**

| Aspect | Décision |
|--------|----------|
| **Stack** | Next.js 14 + Supabase + Vercel |
| **Auth** | Notion OAuth uniquement |
| **LLM** | OpenAI GPT-4o-mini |
| **Email** | Resend |
| **Région** | EU (RGPD compliance) |
| **Coût estimé** | ~$30/mois à 1K MAU |

**Prêt pour l'implémentation !**
