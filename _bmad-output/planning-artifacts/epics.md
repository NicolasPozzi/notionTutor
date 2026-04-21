---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epic-list
  - step-03-create-stories
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design.md
projectName: NotionTutor
---

# NotionTutor - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for NotionTutor, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

| ID | Domaine | Exigence |
|----|---------|----------|
| **FR1** | Gestion Utilisateur | L'utilisateur peut créer un compte via OAuth Notion |
| **FR2** | Gestion Utilisateur | L'utilisateur peut se connecter à son compte |
| **FR3** | Gestion Utilisateur | L'utilisateur peut réinitialiser son accès (re-auth Notion) |
| **FR4** | Gestion Utilisateur | L'utilisateur peut supprimer son compte et toutes ses données (RGPD) |
| **FR5** | Gestion Utilisateur | L'utilisateur peut consulter et exporter ses données personnelles (RGPD) |
| **FR6** | Intégration Notion | L'utilisateur peut connecter son espace Notion via OAuth 2.0 |
| **FR7** | Intégration Notion | L'utilisateur peut sélectionner quels workspaces partager |
| **FR8** | Intégration Notion | L'utilisateur peut voir la liste de ses pages Notion accessibles |
| **FR9** | Intégration Notion | L'utilisateur peut déconnecter son espace Notion |
| **FR10** | Intégration Notion | L'utilisateur peut reconnecter son Notion si l'autorisation expire |
| **FR11** | Intégration Notion | Le système accède aux pages Notion en lecture seule uniquement |
| **FR12** | Navigation | L'utilisateur peut parcourir ses pages Notion dans une interface de navigation |
| **FR13** | Navigation | L'utilisateur peut rechercher parmi ses pages Notion |
| **FR14** | Navigation | L'utilisateur peut sélectionner une page pour la réviser |
| **FR15** | Navigation | L'utilisateur peut voir un aperçu du contenu d'une page |
| **FR16** | Session Révision | L'utilisateur peut démarrer une session de révision immédiate |
| **FR17** | Session Révision | Le système génère des questions pertinentes via IA |
| **FR18** | Session Révision | L'utilisateur peut répondre aux questions générées |
| **FR19** | Session Révision | Le système affiche la "bonne réponse" extraite des notes |
| **FR20** | Session Révision | L'utilisateur peut marquer sa réponse comme correcte ou incorrecte |
| **FR21** | Session Révision | L'utilisateur peut terminer une session à tout moment |
| **FR22** | Session Révision | Le système indique si une question a déjà été mal répondue |
| **FR23** | Digest Email | L'utilisateur peut activer/désactiver les digest emails pour une page |
| **FR24** | Digest Email | L'utilisateur peut configurer la fréquence du digest (daily/weekly) |
| **FR25** | Digest Email | L'utilisateur peut configurer la durée du digest |
| **FR26** | Digest Email | Le système envoie un email avec extraits + micro-question |
| **FR27** | Digest Email | L'utilisateur peut répondre à la micro-question depuis l'email |
| **FR28** | Digest Email | L'utilisateur peut se désabonner des digest emails |
| **FR29** | Historique | Le système enregistre les questions posées |
| **FR30** | Historique | Le système enregistre si l'utilisateur a bien répondu ou non |
| **FR31** | Historique | L'utilisateur peut consulter son historique de sessions |
| **FR32** | Historique | Le système évite de reposer une question déjà maîtrisée |
| **FR33** | Historique | Le système repriorise les questions mal répondues |
| **FR34** | Confiance | L'utilisateur peut consulter comment ses données sont traitées |
| **FR35** | Confiance | L'utilisateur peut voir les permissions demandées à Notion |
| **FR36** | Confiance | Le système ne stocke pas le contenu des notes Notion |

### Non-Functional Requirements

| ID | Catégorie | Exigence | Cible |
|----|-----------|----------|-------|
| **NFR1** | Performance | Chargement pages Notion | < 1 seconde |
| **NFR2** | Performance | Génération 1ère question IA | < 3 secondes |
| **NFR3** | Performance | Temps réponse interface | < 200ms |
| **NFR4** | Performance | Envoi digest email | Dans les 5 minutes |
| **NFR5** | Sécurité | Tokens OAuth chiffrés au repos | AES-256 |
| **NFR6** | Sécurité | Communications HTTPS | TLS 1.3 |
| **NFR7** | Sécurité | Aucun contenu de note stocké | Traitement éphémère |
| **NFR8** | Sécurité | Sessions expirées | 30 jours inactivité |
| **NFR9** | Sécurité | Logs d'accès | 90 jours (RGPD) |
| **NFR10** | Scalabilité | Utilisateurs MVP | 1 000 MAU |
| **NFR11** | Scalabilité | Requêtes/seconde MVP | 10 req/sec |
| **NFR12** | Scalabilité | Architecture | Monolithique acceptable |
| **NFR13** | Intégration | Rate limits Notion | Respect 3 req/sec + backoff |
| **NFR14** | Intégration | Fallback API Notion | Message utilisateur clair |
| **NFR15** | Intégration | Abstraction LLM | Changement provider possible |
| **NFR16** | Intégration | Monitoring APIs | Latence + taux erreur |
| **NFR17** | Fiabilité | Disponibilité | ≥ 99.5% |
| **NFR18** | Fiabilité | Récupération incident | < 4 heures |
| **NFR19** | Fiabilité | Backup DB | Quotidien |
| **NFR20** | Fiabilité | Notification panne | Automatique |

### Additional Requirements (Architecture)

| ID | Exigence |
|----|----------|
| **ARCH-1** | Stack Next.js 14 (App Router) + Supabase PostgreSQL |
| **ARCH-2** | Auth = Login with Notion OAuth uniquement (pas de compte séparé) |
| **ARCH-3** | ORM Prisma pour type-safety et migrations |
| **ARCH-4** | LLM = OpenAI GPT-4o-mini |
| **ARCH-5** | Email = Resend |
| **ARCH-6** | Hébergement Vercel (région EU: Paris/Frankfurt) |
| **ARCH-7** | Scheduler = Vercel Cron pour digests |
| **ARCH-8** | Connection pooling mode `transaction` (PgBouncer) |
| **ARCH-9** | Adapter pattern pour Notion API et LLM (abstraction) |
| **ARCH-10** | Circuit breaker sur toutes les intégrations externes |

### UX Design Requirements

| ID | Exigence |
|----|----------|
| **UX-DR1** | Mobile-first design (zones tap 44x44px minimum) |
| **UX-DR2** | Bottom navigation à 4 items (Home, Pages, Digests, Profile) |
| **UX-DR3** | Design System Notion-inspired (noir/blanc + accents couleur feedback) |
| **UX-DR4** | 7 UI Patterns à implémenter (Card Action, Progress Bar, Feedback Toast, Bottom Sheet, Empty State, Streaks, Question/Réponse) |
| **UX-DR5** | 3 breakpoints responsive (mobile < 640px, tablet 640-1024px, desktop ≥ 1024px) |
| **UX-DR6** | États de feedback visuels : Correct (vert), À revoir (orange), animations |
| **UX-DR7** | Email digest template avec structure définie |
| **UX-DR8** | Wireframes 4 écrans clés (Home, Question, Feedback, Config Digest) |
| **UX-DR9** | Accessibilité basique MVP (contraste, labels, focus visible) |

## FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| — | Epic 0 | Project setup technique (pas de FR, infrastructure) |
| FR1-FR7 | Epic 1 | Auth Notion + gestion compte |
| FR34-FR36 | Epic 1 | Confiance & sécurité (onboarding) |
| FR8-FR15 | Epic 2 | Navigation pages + preview |
| FR16-FR22 | Epic 3 | Session révision + IA |
| FR23-FR28 | Epic 4 | Digest emails |
| FR29-FR33 | Epic 5 | Historique + spaced repetition |

## Epic List

### Epic 0: Project Foundation
**Goal:** Mettre en place l'infrastructure technique nécessaire pour le développement.

Cette epic technique établit les fondations du projet : Next.js 14, Supabase, Prisma, Vercel, et la configuration CI/CD. Aucune valeur utilisateur directe, mais bloque tout le reste.

**Éléments couverts:**
- ARCH-1 à ARCH-10 (stack technique)
- UX-DR1, UX-DR2, UX-DR3 (design system foundations)
- NFR6, NFR17, NFR19 (sécurité, disponibilité, backups)

**Estimation:** 2-3 jours

#### Stories

##### Story 0.1: Project Bootstrap & Development Environment

**As a** developer,  
**I want** a preconfigured Next.js 14 project with TypeScript, Tailwind CSS, and ESLint,  
**So that** I can start implementing features with consistent tooling.

**Acceptance Criteria:**

- **Given** a new machine with Node.js 20+
- **When** I run `npm install && npm run dev`
- **Then** the app starts on localhost:3000
- **And** TypeScript strict mode is enabled
- **And** Tailwind CSS compiles without errors
- **And** ESLint catches code issues on save

---

##### Story 0.2: Database Setup with Supabase & Prisma

**As a** developer,  
**I want** Prisma connected to Supabase PostgreSQL with migration support,  
**So that** I can define and evolve the database schema safely.

**Acceptance Criteria:**

- **Given** environment variables configured (.env)
- **When** I run `npx prisma migrate dev`
- **Then** migrations apply to Supabase
- **And** Prisma Client is generated with types
- **And** connection uses pooler mode `transaction`

---

##### Story 0.3: CI/CD Pipeline & Vercel Deployment

**As a** developer,  
**I want** automatic deployments on push to `main`,  
**So that** every merged PR is deployed to production.

**Acceptance Criteria:**

- **Given** code pushed to `main` branch
- **When** Vercel detects the push
- **Then** build runs and deploys to EU region (Paris/Frankfurt)
- **And** preview deployments work on PRs
- **And** environment variables are securely stored

---

##### Story 0.4: Design System Foundations

**As a** developer,  
**I want** base UI components configured (fonts, colors, spacing),  
**So that** all features use consistent styling automatically.

**Acceptance Criteria:**

- **Given** the Tailwind config
- **When** I use utility classes
- **Then** Inter font is applied globally
- **And** color tokens match design system (white, gray-100, black, success-green, warning-orange)
- **And** spacing uses 8px base grid

---

##### Story 0.5: LLM Integration Foundation with Mock Testing

**As a** developer,  
**I want** an OpenAI adapter with mock support for tests,  
**So that** I can develop and test AI features without API costs or rate limits.

**Acceptance Criteria:**

- **Given** `MOCK_LLM=true` in environment
- **When** code calls the LLM adapter
- **Then** mock responses are returned (deterministic test data)
- **And** real OpenAI calls work when `MOCK_LLM=false`
- **And** adapter follows the QuestionGenerator interface pattern
- **And** error handling covers timeouts and rate limits

---

### Epic 1: Authentification Notion & Confiance
**Goal:** L'utilisateur peut se connecter à NotionTutor via son compte Notion et comprendre comment ses données sont protégées.

Cette epic établit la confiance dès l'onboarding : connexion OAuth Notion fluide, page de sécurité/confidentialité visible, et gestion du compte utilisateur.

**FRs couvertes:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR34, FR35, FR36

**User Stories clés:**
- "En tant qu'utilisateur Notion, je peux me connecter en 1 clic"
- "En tant qu'utilisateur, je peux voir comment mes données sont traitées AVANT de me connecter"
- "En tant qu'utilisateur, je peux supprimer mon compte et mes données"

**Estimation:** 4-5 jours

#### Stories

##### Story 1.1: Landing Page avec Login Notion

**As a** visitor,  
**I want** to see a clear landing page explaining NotionTutor and login with one click,  
**So that** I understand the value and can start using the app quickly.

**Acceptance Criteria:**

- **Given** I'm on the landing page (unauthenticated)
- **When** I click "Se connecter avec Notion"
- **Then** I'm redirected to Notion OAuth consent screen
- **And** the landing page explains the product value proposition
- **And** a link to "Comment vos données sont protégées" is visible

---

##### Story 1.2: Notion OAuth Callback & User Creation

**As a** visitor completing Notion login,  
**I want** my account to be created automatically from my Notion profile,  
**So that** I don't have to fill any forms.

**Acceptance Criteria:**

- **Given** I complete Notion OAuth consent
- **When** callback is received
- **Then** user record is created (or matched) with Notion user_id
- **And** OAuth access_token is encrypted (AES-256) and stored
- **And** I'm redirected to the app home
- **And** workspace permissions are stored

---

##### Story 1.3: Session Management & Re-login

**As a** returning user,  
**I want** to stay logged in for 30 days and re-authenticate seamlessly if needed,  
**So that** I don't have to login every time.

**Acceptance Criteria:**

- **Given** a valid session cookie
- **When** I access the app within 30 days
- **Then** I'm automatically authenticated
- **And** session expires after 30 days of inactivity
- **And** if token expires, I see "Veuillez vous reconnecter" with 1-click re-auth

---

##### Story 1.4: Security & Privacy Page

**As a** user (or visitor),  
**I want** to see exactly how my data is handled,  
**So that** I can trust the app with my Notion content.

**Acceptance Criteria:**

- **Given** I navigate to /security (accessible without login)
- **When** the page loads
- **Then** I see clear explanations of:
  - Permissions demandées à Notion (read-only)
  - Traitement éphémère (notes jamais stockées)
  - Chiffrement des tokens (AES-256)
  - Suppression des données possible
- **And** language is plain French, not legal jargon

---

##### Story 1.5: RGPD Data Export

**As a** user,  
**I want** to export all my personal data,  
**So that** I comply with my RGPD rights.

**Acceptance Criteria:**

- **Given** I'm logged in on /profile
- **When** I click "Exporter mes données"
- **Then** a JSON file downloads with:
  - Account info (email, name, created_at)
  - Session history (dates, page IDs)
  - Question attempts (question text, result, date)
- **And** no Notion content is included (not stored)

---

##### Story 1.6: Account Deletion (RGPD)

**As a** user,  
**I want** to delete my account and all my data,  
**So that** I can exercise my RGPD right to be forgotten.

**Acceptance Criteria:**

- **Given** I'm on /profile
- **When** I click "Supprimer mon compte"
- **Then** I see a confirmation modal explaining what will be deleted
- **And** after confirmation, all my data is permanently deleted
- **And** Notion OAuth token is revoked
- **And** I'm logged out and redirected to landing page

---

##### Story 1.7: Workspace Selection (OAuth Scope)

**As a** user connecting Notion,  
**I want** to choose which workspaces to share,  
**So that** I control what NotionTutor can access.

**Acceptance Criteria:**

- **Given** I complete Notion OAuth
- **When** I have access to multiple workspaces
- **Then** only the pages from authorized workspaces are visible
- **And** I can update workspace permissions from /profile
- **And** workspace selection uses Notion's native consent UI

---

### Epic 2: Navigation & Exploration des Pages
**Goal:** L'utilisateur peut parcourir ses pages Notion, rechercher, et voir un aperçu avant de réviser.

Cette epic permet à l'utilisateur d'explorer son contenu Notion dans l'interface NotionTutor : liste des pages, recherche, preview du contenu.

**FRs couvertes:** FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15

**User Stories clés:**
- "En tant qu'utilisateur, je peux voir la liste de mes pages Notion"
- "En tant qu'utilisateur, je peux rechercher parmi mes pages"
- "En tant qu'utilisateur, je peux voir un aperçu d'une page avant de la réviser"

**Estimation:** 4-5 jours

#### Stories

##### Story 2.1: Pages List with Notion API Integration

**As a** logged-in user,  
**I want** to see a list of my accessible Notion pages,  
**So that** I can choose which content to revise.

**Acceptance Criteria:**

- **Given** I'm authenticated with valid Notion token
- **When** I navigate to /pages
- **Then** I see a list of pages from my authorized workspaces
- **And** each page shows: title, icon (if any), last edited date
- **And** pages load in < 1 second (cached if possible)
- **And** read-only access is enforced (FR11)

---

##### Story 2.2: Notion API Adapter with Rate Limiting

**As a** developer,  
**I want** a Notion API adapter that handles rate limits gracefully,  
**So that** the app doesn't get blocked by Notion.

**Acceptance Criteria:**

- **Given** multiple API calls in short succession
- **When** rate limit (3 req/sec) is approached
- **Then** adapter implements exponential backoff
- **And** circuit breaker opens after repeated failures
- **And** user sees friendly message "Notion est momentanément indisponible"

---

##### Story 2.3: Page Search

**As a** user with many pages,  
**I want** to search for a specific page by title,  
**So that** I can quickly find what I want to revise.

**Acceptance Criteria:**

- **Given** I'm on /pages
- **When** I type in the search bar
- **Then** pages are filtered in real-time (client-side)
- **And** search is case-insensitive
- **And** empty results show "Aucune page trouvée"

---

##### Story 2.4: Page Preview (Bottom Sheet)

**As a** user,  
**I want** to preview a page's content before starting a revision,  
**So that** I can confirm it's the right page.

**Acceptance Criteria:**

- **Given** I'm viewing the pages list
- **When** I tap on a page card
- **Then** a bottom sheet slides up with page preview
- **And** preview shows first ~500 characters of content
- **And** I see buttons: "Réviser" and "Configurer Digest"
- **And** content is fetched from Notion API (not stored)

---

##### Story 2.5: Disconnect & Reconnect Notion

**As a** user,  
**I want** to disconnect my Notion workspace and reconnect later,  
**So that** I can troubleshoot access issues or change workspaces.

**Acceptance Criteria:**

- **Given** I'm on /profile
- **When** I click "Déconnecter Notion"
- **Then** OAuth token is revoked
- **And** pages list shows empty state with reconnect button
- **When** I click "Reconnecter"
- **Then** I go through Notion OAuth flow again

---

##### Story 2.6: Empty State & Onboarding

**As a** new user with no pages yet visible,  
**I want** to see helpful guidance,  
**So that** I understand why the list is empty and what to do.

**Acceptance Criteria:**

- **Given** I just connected Notion but shared no pages
- **When** /pages loads
- **Then** I see empty state: "Aucune page partagée"
- **And** explanation: "Partagez des pages avec NotionTutor depuis Notion"
- **And** link to help documentation

---

### Epic 3: Session de Révision Core
**Goal:** L'utilisateur peut démarrer une révision, répondre aux questions générées par l'IA, et recevoir un feedback immédiat.

Cette epic est le cœur du produit : génération de questions via LLM, interface de révision mobile-first, feedback visuel (correct/à revoir), et auto-évaluation.

**FRs couvertes:** FR16, FR17, FR18, FR19, FR20, FR21, FR22

**NFRs critiques:** NFR1, NFR2, NFR3, NFR13, NFR14, NFR15

**UX couvertes:** UX-DR4 (Progress Bar, Question/Réponse, Feedback Toast), UX-DR6 (micro-interactions feedback)

**User Stories clés:**
- "En tant qu'utilisateur, je peux démarrer une session de révision sur une page"
- "En tant qu'utilisateur, je reçois des questions pertinentes générées par l'IA"
- "En tant qu'utilisateur, je vois un feedback immédiat après chaque réponse"

**Estimation:** 6-8 jours

#### Stories

##### Story 3.1: Start Revision Session

**As a** user viewing a page preview,  
**I want** to start a revision session with one tap,  
**So that** I can begin learning immediately.

**Acceptance Criteria:**

- **Given** I'm on the page preview bottom sheet
- **When** I tap "Réviser"
- **Then** a new revision_session is created in DB
- **And** I'm navigated to /revision/[sessionId]
- **And** page content is fetched from Notion (not stored)
- **And** loading state shows while preparing questions

---

##### Story 3.2: AI Question Generation

**As a** user in a revision session,  
**I want** to receive relevant questions generated from my notes,  
**So that** I can test my understanding.

**Acceptance Criteria:**

- **Given** page content is loaded
- **When** the LLM processes the content
- **Then** 5-10 questions are generated based on key concepts
- **And** first question appears in < 3 seconds
- **And** questions include the expected answer (extracted from notes)
- **And** questions are saved to DB (text only, no note content)

---

##### Story 3.3: Question Display UI

**As a** user,  
**I want** to see one question at a time with space to think,  
**So that** I can focus on each question.

**Acceptance Criteria:**

- **Given** I'm in a revision session
- **When** a question is displayed
- **Then** I see the question text prominently
- **And** progress bar shows current/total questions
- **And** "Voir la réponse" button is accessible
- **And** UI follows mobile-first wireframe (UX-DR8)

---

##### Story 3.4: Reveal Answer & Self-Evaluation

**As a** user,  
**I want** to see the correct answer and mark if I got it right,  
**So that** I can track my learning honestly.

**Acceptance Criteria:**

- **Given** I'm viewing a question
- **When** I tap "Voir la réponse"
- **Then** the expected answer from notes is revealed
- **And** I see two buttons: "✓ Correct" (green) and "✗ À revoir" (orange)
- **When** I tap either button
- **Then** my response is saved to question_attempts table
- **And** feedback toast appears with animation (UX-DR6)

---

##### Story 3.5: Session Progress & Completion

**As a** user,  
**I want** to see my progress and complete the session,  
**So that** I know how much I've reviewed and how I did.

**Acceptance Criteria:**

- **Given** I'm in a revision session
- **When** I answer all questions
- **Then** I see session summary: X correct, Y à revoir
- **And** session is marked complete in DB
- **And** I can "Retour aux pages" or "Refaire les questions à revoir"
- **When** I exit mid-session
- **Then** progress is saved and I can resume later

---

##### Story 3.6: Flag Previously Missed Questions

**As a** user,  
**I want** to know if I've missed this question before,  
**So that** I pay extra attention.

**Acceptance Criteria:**

- **Given** I'm viewing a question
- **When** I previously marked it "À revoir"
- **Then** a subtle indicator shows "Déjà manquée"
- **And** the indicator doesn't distract from the question
- **And** this data comes from question_attempts history

---

##### Story 3.7: Error Handling & LLM Fallback

**As a** user,  
**I want** graceful handling when AI generation fails,  
**So that** I'm not stuck with a broken experience.

**Acceptance Criteria:**

- **Given** LLM API is unavailable or times out
- **When** question generation fails
- **Then** I see friendly error: "Génération impossible, réessayez"
- **And** retry button is available
- **And** error is logged for monitoring (NFR16)
- **And** circuit breaker prevents repeated failures

---

### Epic 4: Digest Email System
**Goal:** L'utilisateur peut configurer des digests email quotidiens/hebdomadaires avec micro-questions style Readwise.

Cette epic implémente le différenciateur clé : emails de rappel avec extraits de notes + micro-question, configuration de fréquence et durée, désabonnement.

**FRs couvertes:** FR23, FR24, FR25, FR26, FR27, FR28

**NFRs critiques:** NFR4

**UX couvertes:** UX-DR7 (email template)

**User Stories clés:**
- "En tant qu'utilisateur, je peux activer un digest email sur une page"
- "En tant qu'utilisateur, je reçois un email avec un extrait + une question"
- "En tant qu'utilisateur, je peux me désabonner facilement"

**Estimation:** 5-6 jours

#### Stories

##### Story 4.1: Enable Digest for a Page

**As a** user,  
**I want** to activate a digest email on any page,  
**So that** I receive regular reminders to revise.

**Acceptance Criteria:**

- **Given** I'm on the page preview bottom sheet
- **When** I tap "Configurer Digest"
- **Then** I see toggle to enable/disable digest
- **And** when enabled, a digest record is created in DB
- **And** the page card shows a "📧" badge indicating active digest

---

##### Story 4.2: Configure Digest Frequency

**As a** user,  
**I want** to choose how often I receive digests,  
**So that** I'm not overwhelmed but stay consistent.

**Acceptance Criteria:**

- **Given** digest is enabled for a page
- **When** I configure frequency
- **Then** I can select: Quotidien (daily) or Hebdomadaire (weekly)
- **And** weekly allows selecting preferred day
- **And** I can set preferred time (morning/evening)
- **And** settings are stored in digests table

---

##### Story 4.3: Configure Digest Duration

**As a** user,  
**I want** to set how long I receive digests for a page,  
**So that** I can run time-boxed revision campaigns.

**Acceptance Criteria:**

- **Given** digest is enabled
- **When** I configure duration
- **Then** I can select: 1 semaine, 2 semaines, 1 mois, Illimité
- **And** end_date is calculated and stored
- **And** when duration expires, digest auto-disables with notification

---

##### Story 4.4: Digest Email Generation (Cron Job)

**As a** system,  
**I want** to generate and send digest emails on schedule,  
**So that** users receive their reminders reliably.

**Acceptance Criteria:**

- **Given** active digests in DB
- **When** Vercel Cron runs (daily at 7h and 18h CET)
- **Then** for each due digest:
  - Fetch page content from Notion
  - Generate 1 micro-question via LLM
  - Select 1 highlight excerpt from page
  - Send email via Resend within 5 minutes
- **And** digest_sent_at is logged

---

##### Story 4.5: Digest Email Template (Readwise-style)

**As a** user receiving a digest,  
**I want** a clean, mobile-friendly email with excerpt + question,  
**So that** I can engage quickly from my inbox.

**Acceptance Criteria:**

- **Given** digest email is generated
- **When** I open the email
- **Then** I see:
  - Page title + NotionTutor branding
  - Highlight excerpt from my notes (200-300 chars)
  - Micro-question to test recall
  - CTA button: "Voir la réponse" → opens web app
  - Footer: unsubscribe link
- **And** email renders correctly on mobile (UX-DR7)

---

##### Story 4.6: Answer Question from Email

**As a** user,  
**I want** to answer the digest question in the web app,  
**So that** my response is tracked.

**Acceptance Criteria:**

- **Given** I receive a digest email
- **When** I click "Voir la réponse"
- **Then** I'm taken to /digest/[digestId]/answer
- **And** the question and expected answer are shown
- **And** I can mark "Correct" or "À revoir" (same as revision session)
- **And** response is saved to question_attempts

---

##### Story 4.7: Unsubscribe from Digest

**As a** user,  
**I want** to easily stop receiving digest emails,  
**So that** I'm not spammed if I change my mind.

**Acceptance Criteria:**

- **Given** I receive a digest email
- **When** I click "Se désabonner" in footer
- **Then** I'm taken to /unsubscribe/[token]
- **And** I see confirmation: "Digest désactivé pour [page name]"
- **And** digest is disabled in DB (no re-auth required)
- **And** I can re-enable from /digests page in app

---

### Epic 5: Historique & Progression ⚠️ (Nice-to-have MVP)
**Goal:** L'utilisateur peut voir son historique de révisions et le système optimise les questions via spaced repetition.

Cette epic enrichit l'expérience avec le tracking de progression, les streaks, et l'algorithme de spaced repetition. Peut être différée en V1.1 si nécessaire.

**FRs couvertes:** FR29, FR30, FR31, FR32, FR33

**UX couvertes:** UX-DR4 (Streaks pattern)

**User Stories clés:**
- "En tant qu'utilisateur, je vois mon historique de sessions"
- "En tant qu'utilisateur, le système me repose les questions que j'ai ratées"
- "En tant qu'utilisateur, je vois mon streak de révision"

**Estimation:** 4-5 jours

#### Stories

##### Story 5.1: Session History View

**As a** user,  
**I want** to see my past revision sessions,  
**So that** I can track my learning activity.

**Acceptance Criteria:**

- **Given** I'm on /history
- **When** I have completed sessions
- **Then** I see a list of sessions with: date, page name, score (X/Y correct)
- **And** sessions are sorted by most recent first
- **And** I can tap to see session details

---

##### Story 5.2: Question Attempt History

**As a** user,  
**I want** to see which questions I've answered and how,  
**So that** I can identify weak areas.

**Acceptance Criteria:**

- **Given** I'm viewing a session in history
- **When** I expand details
- **Then** I see each question with: question text, my result (✓/✗)
- **And** questions marked "À revoir" are highlighted
- **And** I can tap "Refaire cette question" to practice

---

##### Story 5.3: Spaced Repetition - Prioritize Missed Questions

**As a** user,  
**I want** the system to re-ask questions I got wrong,  
**So that** I reinforce weak areas.

**Acceptance Criteria:**

- **Given** I start a new revision on a page
- **When** I have previous attempts on questions
- **Then** questions marked "À revoir" are prioritized first
- **And** correctly answered questions appear less frequently
- **And** new questions are mixed in after missed ones

---

##### Story 5.4: Skip Mastered Questions

**As a** user,  
**I want** the system to skip questions I've mastered,  
**So that** I don't waste time on what I know.

**Acceptance Criteria:**

- **Given** a question was answered correctly 3+ times
- **When** generating a new session
- **Then** that question is marked as "maîtrisée"
- **And** it's excluded from regular sessions
- **And** user can opt to include mastered questions manually

---

##### Story 5.5: Revision Streaks

**As a** user,  
**I want** to see my daily streak of revisions,  
**So that** I stay motivated to revise regularly.

**Acceptance Criteria:**

- **Given** I'm on /home
- **When** I have completed sessions on consecutive days
- **Then** I see current streak count with 🔥 icon
- **And** streak resets if I miss a day
- **And** best streak is recorded for reference

---

##### Story 5.6: Progress Dashboard

**As a** user,  
**I want** to see an overview of my learning progress,  
**So that** I feel a sense of accomplishment.

**Acceptance Criteria:**

- **Given** I'm on /home
- **When** I have revision activity
- **Then** I see:
  - Total sessions completed
  - Questions answered (correct vs. à revoir)
  - Active streaks
  - Pages with active digests
- **And** progress updates after each session

---

## Summary

| Epic | Titre | Stories | FRs | Priorité | Estimation |
|------|-------|---------|-----|----------|------------|
| 0 | Project Foundation | 5 | — | 🔴 Bloquante | 2-3 jours |
| 1 | Auth Notion & Confiance | 7 | FR1-7, FR34-36 | 🔴 MVP | 4-5 jours |
| 2 | Navigation Pages | 6 | FR8-15 | 🔴 MVP | 4-5 jours |
| 3 | Session Révision | 7 | FR16-22 | 🔴 MVP | 6-8 jours |
| 4 | Digest Email | 7 | FR23-28 | 🔴 MVP (différenciateur) | 5-6 jours |
| 5 | Historique & Progression | 6 | FR29-33 | 🟡 Nice-to-have | 4-5 jours |

**Total stories:** 38
**Total estimé MVP (Epic 0-4):** ~22-27 jours
**Total avec Epic 5:** ~26-32 jours
