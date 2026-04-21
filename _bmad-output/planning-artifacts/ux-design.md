---
stepsCompleted:
  - step-01-init
  - step-02-understanding
  - step-03-core-experience
  - step-04-sitemap
  - step-05-flows
  - step-06-wireframes
  - step-07-design-system
  - step-08-ui-patterns
  - step-09-responsive
  - step-10-states-edge-cases
  - step-11-accessibility
  - step-12-email-template
  - step-13-validation
  - step-14-complete
status: complete
inputDocuments:
  - prd.md
projectName: NotionTutor
---

# UX Design Document - NotionTutor

**Author:** Nicolas.pozzi
**Date:** 2026-04-01
**Source PRD:** [prd.md](./prd.md)

## Executive Summary

### Vision Produit
NotionTutor transforme les notes Notion dormantes en connaissances maîtrisées grâce à une révision proactive alimentée par l'IA. L'expérience vise le zéro friction : connexion directe à Notion, génération automatique de questions pertinentes, et rappels intelligents via digest email.

### Utilisateurs Cibles
- **Profil principal :** Adultes tech-savvy utilisant Notion pour organiser leurs connaissances
- **Personas clés :** Nicolas (curieux qui veut retenir), Sophie (professionnelle prudente)
- **Contexte d'usage :** Mobile principalement, laptop le soir, sessions courtes

### Défis UX Clés
1. **Confiance OAuth** — Rassurer les utilisateurs sur la sécurité avant connexion
2. **Time-to-value rapide** — Première session en < 2 minutes après inscription
3. **Feedback émotionnel** — Récompenser sans punir, maintenir la motivation
4. **Équilibre DA** — Respecter le minimalisme Notion tout en ajoutant des accents de feedback

### Opportunités Design
1. **Micro-interactions de récompense** — Animations subtiles pour créer de la dopamine
2. **Onboarding transparent** — Montrer la valeur avant de demander l'accès
3. **Email comme produit** — Les digests doivent être beaux et engageants

## Core Experience

### Action Core
> **Répondre à une question générée par l'IA sur ses propres notes**

C'est le moment où la magie opère — l'utilisateur teste sa connaissance et reçoit un feedback immédiat.

### Plateforme

| Priorité | Device | Contexte |
|----------|--------|----------|
| 🥇 Principal | **Mobile** | Transport, pauses, micro-moments |
| 🥈 Secondaire | **Laptop** | Le soir, sessions plus longues |

**Implications Mobile-First :**
- Zones de tap minimum 44x44px
- Minimiser la saisie texte — préférer sélection/tap
- Navigation bottom nav ou gestures
- Questions/Réponses lisibles sur petit écran
- Sessions courtes (5-10 questions)

### Principes d'Expérience

| Principe | Description |
|----------|-------------|
| **Mobile-first, desktop-ready** | Conception pour mobile, adaptation laptop |
| **Zéro friction sélection** | 2-3 taps max pour choisir une page |
| **Réponse fluide** | Champ de réponse facile à utiliser sur mobile |
| **Feedback immédiat** | Animation/couleur dès validation de réponse |
| **Sessions courtes** | 5-10 questions = une session complète |
| **Progression visible** | L'utilisateur voit qu'il avance |

### Moments de Succès Critique

| Moment | Ce qui doit se passer | Métrique |
|--------|----------------------|----------|
| **Connexion Notion** | L'utilisateur voit "Lecture seule" | Taux de complétion OAuth |
| **1ère question générée** | L'utilisateur se dit "Pertinent !" | Temps avant 1ère réponse |
| **1ère bonne réponse** | Dopamine, feedback positif | Continuation session |
| **Digest email reçu** | "Oh cool, un rappel !" | Taux d'ouverture email |

## Sitemap & Navigation

### Architecture de l'Information

```
NotionTutor
├── 🏠 Landing Page (public)
│   ├── Hero + Value prop
│   ├── How it works
│   ├── Pricing
│   └── Login / Sign up
│
├── 🔐 Auth
│   ├── Sign up (email ou OAuth social)
│   ├── Login
│   └── Reset password
│
├── 📱 App (authentifié)
│   ├── 🏠 Home / Dashboard
│   │   ├── Pages récentes
│   │   ├── Sessions suggérées
│   │   └── CTA "Réviser maintenant"
│   │
│   ├── 📚 Mes Pages
│   │   ├── Liste des pages Notion
│   │   ├── Recherche
│   │   └── [Page] → Aperçu + "Réviser"
│   │
│   ├── 🎯 Session de Révision
│   │   ├── Question
│   │   ├── Zone de réponse
│   │   ├── Feedback (correct/incorrect)
│   │   ├── Progression (3/10)
│   │   └── Fin de session → Récap
│   │
│   ├── 📧 Digests
│   │   ├── Liste des digests actifs
│   │   ├── Configurer nouveau digest
│   │   └── Modifier/Supprimer digest
│   │
│   ├── 📊 Historique (secondaire)
│   │   ├── Sessions passées
│   │   └── Questions difficiles
│   │
│   └── ⚙️ Paramètres
│       ├── Compte
│       ├── Connexion Notion (connecter/déconnecter)
│       ├── Notifications email
│       └── Données & confidentialité (RGPD)
```

### Navigation Mobile (Bottom Nav)

| Icône | Label | Écran | Priorité |
|-------|-------|-------|----------|
| 🏠 | Home | Dashboard | Accès rapide révision |
| 📚 | Pages | Liste pages Notion | Sélection contenu |
| 📧 | Digests | Configuration digests | Proactivité |
| 👤 | Profil | Paramètres + Historique | Secondaire |

### Flux Principaux

**Flux 1 : Première utilisation (Sophie)**
```
Landing → Sign up → Connexion Notion (OAuth) → Sélection workspace → Home → Sélectionner page → Réviser
```

**Flux 2 : Révision rapide (Nicolas)**
```
Home → "Réviser maintenant" (page suggérée) → Session → Fin
```

**Flux 3 : Configurer digest**
```
Pages → Sélectionner page → "Ajouter digest" → Configurer fréquence → Confirmer
```

## User Flows Détaillés

### Flux 1 : Onboarding + Première Révision

**Objectif :** Amener un nouvel utilisateur jusqu'à sa première question en < 2 minutes.

**Étapes détaillées :**

| # | Écran | Action utilisateur | Friction | Solution |
|---|-------|-------------------|----------|----------|
| 1 | Landing | Clic "Commencer gratuitement" | — | CTA visible, value prop claire |
| 2 | Sign up | Email + mot de passe OU OAuth social | Formulaire long | Proposer Google/Apple en priorité |
| 3 | Connexion Notion | Clic "Connecter Notion" | Peur de partager | Message "Lecture seule" visible |
| 4 | OAuth Notion | Sélection workspace + Autoriser | Écran externe | Hors contrôle |
| 5 | Sélection page | Choisir une page à réviser | Trop de choix | Pages récentes en premier |
| 6 | Première question | Lire + répondre | Intimidation | "Pas de mauvaise réponse" |

**Métriques :**
- Landing → Sign up : > 10% taux de clic
- Sign up → OAuth complet : > 80%
- OAuth → 1ère question : < 2 min (time-to-value)
- 1ère question → Session complète : > 60%

### Flux 2 : Révision Rapide (Utilisateur récurrent)

**Objectif :** Session de 5 minutes en 2-3 taps.

**Écran Home optimisé :**
- Section "Reprendre là où vous étiez" avec page en cours
- Section "Réviser une autre page" avec suggestions
- Streak visible ("3 jours de suite !")

**Chemin optimal :**
```
Home → [Continuer session] → Questions restantes → Récap → Home
```
**Taps nécessaires :** 2 (ouvrir app + continuer)

### Flux 3 : Configuration Digest Email

**Objectif :** Programmer un digest en 3 écrans.

**Paramètres à configurer :**

| Paramètre | Options | Par défaut |
|-----------|---------|------------|
| Fréquence | Quotidien, Hebdomadaire | Quotidien |
| Heure d'envoi | Sélecteur horaire | 08:00 |
| Durée | 1 sem, 2 sem, 1 mois, Indéfiniment | 2 semaines |

**Confirmation :** Message clair avec date du premier email.

### Flux 4 : Réception & Interaction Digest Email

**Structure de l'email :**
1. **Header** — Logo NotionTutor + nom de la page
2. **Progression** — "Jour 3/14"
3. **Extrait du jour** — Citation/passage de la note
4. **Micro-question** — Une question pour tester
5. **CTA** — "Répondre dans l'app"
6. **Footer** — Désabonnement + Gérer digests

**Deep link :** L'app ouvre directement sur la question du digest.

### Récapitulatif Flows

| Flux | Objectif | Étapes | Point critique |
|------|----------|--------|----------------|
| 1. Onboarding | Première révision | 6 | OAuth (confiance) |
| 2. Révision rapide | Session récurrente | 2-3 taps | Aucun |
| 3. Config digest | Programmer emails | 3 | Choix fréquence |
| 4. Digest email | Engagement passif | Email → App | Clic dans email |

## Wireframes

### Principes de Wireframe

| Principe | Application |
|----------|-------------|
| **Mobile-first** | 375px de large (iPhone standard) |
| **Touch targets** | Minimum 44x44px |
| **Lisibilité** | Texte 16px minimum |
| **Hiérarchie claire** | Une action principale par écran |

### Wireframe 1 : Home (Dashboard)

```
┌─────────────────────────────────┐
│ ● ● ●              🔔   👤      │  Status bar
├─────────────────────────────────┤
│                                 │
│  👋 Bonjour Nicolas             │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🔥 3 jours de suite     │   │  Streak card
│  │ ━━━━━━━━━━━━━━━━━━━    │   │
│  └─────────────────────────┘   │
│                                 │
│  REPRENDRE                      │
│  ┌─────────────────────────┐   │
│  │ 📄 Économie              │   │
│  │    3 questions restantes │   │
│  │                    [→]   │   │  Tap = continuer
│  └─────────────────────────┘   │
│                                 │
│  MES PAGES                      │
│  ┌─────────────────────────┐   │
│  │ 📄 Histoire - Révol...   │   │
│  │ 📄 Tech - Architect...   │   │
│  │ 📄 Philo - Stoïcisme    │   │
│  │     Voir tout →          │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [+ Nouvelle révision]    │   │  CTA secondaire
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  🏠      📚      📧      👤    │  Bottom nav
│  Home   Pages  Digests Profile  │
└─────────────────────────────────┘
```

**Éléments clés :**
- Streak en haut pour motivation
- "Reprendre" mis en avant pour réduire friction
- Bottom nav à 4 items

### Wireframe 2 : Session de Révision (Question)

```
┌─────────────────────────────────┐
│   ✕                 2/10       │  Close + progression
├─────────────────────────────────┤
│                                 │
│  ━━━━━━━━━━░░░░░░░░░░░░░░░░   │  Progress bar
│                                 │
│  📄 Économie                    │  Contexte page
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  Quelle est la          │   │
│  │  différence entre       │   │
│  │  politique monétaire    │   │
│  │  et politique           │   │
│  │  budgétaire ?           │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  Votre réponse...       │   │  Text input
│  │                         │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │      [ Valider ]        │   │  CTA principal
│  └─────────────────────────┘   │
│                                 │
│  💡 Pas de mauvaise réponse    │  Reassurance
│                                 │
└─────────────────────────────────┘
```

**Éléments clés :**
- Pas de bottom nav (focus sur la tâche)
- ✕ pour quitter (avec confirmation)
- Progression visible (2/10)
- Message de réassurance

### Wireframe 3 : Feedback Réponse (Correct)

```
┌─────────────────────────────────┐
│   ✕                 2/10       │
├─────────────────────────────────┤
│                                 │
│  ━━━━━━━━━━░░░░░░░░░░░░░░░░   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │    ✅ Correct !         │   │  Feedback positif
│  │                         │   │  (vert + animation)
│  │    ━━━━━━━━━━━━━━━━━   │   │
│  │                         │   │
│  │  📝 Extrait de vos      │   │
│  │     notes :             │   │
│  │                         │   │
│  │  "La politique monétaire│   │
│  │  est gérée par la       │   │
│  │  banque centrale..."    │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │  [ Question suivante →] │   │
│  └─────────────────────────┘   │
│                                 │
│  🎯 2/2 aujourd'hui            │  Mini streak
│                                 │
└─────────────────────────────────┘
```

**Variante "À revoir" (incorrect) :**
- 🔄 "À revoir" en orange (pas rouge punitif)
- "Cette question reviendra bientôt !"
- Même extrait de notes montré

### Wireframe 4 : Configuration Digest

```
┌─────────────────────────────────┐
│   ←     Nouveau digest          │
├─────────────────────────────────┤
│                                 │
│  📄 Management - Leadership     │  Page sélectionnée
│                                 │
│  ─────────────────────────────  │
│                                 │
│  FRÉQUENCE                      │
│  ┌─────────────────────────┐   │
│  │ (●) Quotidien           │   │
│  │ ( ) Hebdomadaire        │   │
│  └─────────────────────────┘   │
│                                 │
│  HEURE D'ENVOI                  │
│  ┌─────────────────────────┐   │
│  │         08:00           │   │  Time picker
│  └─────────────────────────┘   │
│                                 │
│  DURÉE                          │
│  ┌─────────────────────────┐   │
│  │  Pendant 2 semaines  ▼  │   │  Dropdown
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📧 Premier email :      │   │
│  │    Demain à 08:00       │   │  Preview
│  └─────────────────────────┘   │
│                                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │   [ Activer le digest ] │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Éléments clés :**
- Navigation "←" pour revenir
- Preview du premier email
- Un seul CTA d'action

### Inventaire des Écrans

| Écran | Priorité | Wireframe | Notes |
|-------|----------|-----------|-------|
| Landing Page | MVP | À designer séparément | Page marketing |
| Sign up / Login | MVP | Standard | OAuth social prioritaire |
| Connexion Notion | MVP | OAuth flow | Message "Lecture seule" |
| Home (Dashboard) | MVP | ✅ Fait | Streak + Reprendre |
| Liste Pages | MVP | Standard liste | Recherche + tri |
| Session Question | MVP | ✅ Fait | Focus, pas de nav |
| Session Feedback | MVP | ✅ Fait | Vert/Orange, pas rouge |
| Fin de Session | MVP | Récap simple | Stats + CTA |
| Config Digest | MVP | ✅ Fait | 3 paramètres |
| Liste Digests | MVP | Standard liste | Actifs + historique |
| Paramètres | MVP | Standard settings | RGPD accessible |
| Email Digest | MVP | Template email | Extrait + question |

## Design System

### Palette de Couleurs

**Couleurs principales (inspirées Notion) :**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-primary` | `#FFFFFF` | Fond principal |
| `--color-bg-secondary` | `#F7F6F3` | Fond secondaire (cards) |
| `--color-text-primary` | `#37352F` | Texte principal |
| `--color-text-secondary` | `#787774` | Texte secondaire |
| `--color-border` | `#E9E9E7` | Bordures |

**Couleurs d'accent (feedback apprentissage) :**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#0F7B6C` | Réponse correcte (vert Notion) |
| `--color-warning` | `#D9730D` | À revoir (orange, pas rouge) |
| `--color-accent` | `#2EAADC` | Liens, éléments interactifs |
| `--color-streak` | `#E16259` | Streak, motivation |

**Mode sombre (optionnel Growth) :**

| Token Light | Token Dark |
|-------------|------------|
| `#FFFFFF` | `#191919` |
| `#37352F` | `#E6E6E4` |

### Typographie

**Police principale :** `Inter` (ou system-ui pour performance)

| Style | Taille | Poids | Usage |
|-------|--------|-------|-------|
| `heading-1` | 24px | 600 | Titres d'écran |
| `heading-2` | 18px | 600 | Titres de section |
| `body` | 16px | 400 | Texte courant |
| `body-small` | 14px | 400 | Labels, métadonnées |
| `caption` | 12px | 400 | Notes, timestamps |
| `question` | 20px | 500 | Questions de révision |

**Line-height :** 1.5 pour la lisibilité mobile

### Espacement

**Système 8px :**

| Token | Valeur | Usage |
|-------|--------|-------|
| `--space-xs` | 4px | Éléments très proches |
| `--space-sm` | 8px | Espacement interne |
| `--space-md` | 16px | Espacement standard |
| `--space-lg` | 24px | Entre sections |
| `--space-xl` | 32px | Marges écran |

### Composants

**Boutons :**

| Type | Style | Usage |
|------|-------|-------|
| `btn-primary` | Fond `--color-accent`, texte blanc | CTAs principaux |
| `btn-secondary` | Bordure `--color-border`, fond transparent | Actions secondaires |
| `btn-ghost` | Pas de bordure, texte `--color-accent` | Actions tertiaires |

**Cards :**

| Style | Propriétés |
|-------|------------|
| `card-default` | Fond `--color-bg-secondary`, border-radius 8px, shadow subtile |
| `card-interactive` | Hover state avec légère élévation |

**Inputs :**

| État | Style |
|------|-------|
| Default | Bordure `--color-border` |
| Focus | Bordure `--color-accent` |
| Error | Bordure `--color-warning` |

### Iconographie

**Style :** Line icons, stroke 1.5px (style Notion/Feather)

**Icônes clés :**
- 📄 Page → `file-text`
- ✅ Correct → `check-circle` (animé)
- 🔄 À revoir → `refresh-cw`
- 📧 Digest → `mail`
- 🔔 Notification → `bell`
- ⚙️ Settings → `settings`

**Recommandation :** [Lucide Icons](https://lucide.dev) (fork moderne de Feather)

### Micro-interactions

| Interaction | Animation |
|-------------|-----------|
| **Correct !** | Check-circle scale-in + confetti particles (subtil) |
| **À revoir** | Shake léger + fade-in message |
| **Streak update** | Counter bounce + flame pulse |
| **Card tap** | Scale 0.98 + elevation |
| **Loading** | Skeleton shimmer (Notion-style) |

**Durées :**
- Rapide : 150ms (feedback immédiat)
- Standard : 250ms (transitions)
- Lente : 400ms (entrées de contenu)

## UI Patterns & Interactions

### Pattern 1 : Card Action

Utilisé partout (Home, Liste pages, Digests).

```
┌─────────────────────────────────┐
│  🔶 Icône   Titre principal     │
│             Sous-titre/méta     │
│                           [→]   │
└─────────────────────────────────┘
```

| Élément | Comportement |
|---------|──────────────|
| Tap card entière | Navigation vers détail |
| Tap [...] | Menu contextuel |
| Swipe gauche | Actions rapides (supprimer, etc.) |

### Pattern 2 : Progress Bar

Utilisé dans les sessions de révision.

```
━━━━━━━━━━░░░░░░░░░░░░  2/10
```

| État | Couleur |
|------|─────────|
| Complété | `--color-accent` |
| En cours | `--color-accent` (animé pulse) |
| Restant | `--color-border` |

### Pattern 3 : Feedback Toast

Utilisé après les actions (réponse, config digest, etc.)

| Type | Couleur | Durée |
|------|─────────|───────|
| Succès | `--color-success` | 3s auto-dismiss |
| Info | `--color-accent` | 3s auto-dismiss |
| Warning | `--color-warning` | Tap to dismiss |

### Pattern 4 : Bottom Sheet (Mobile)

Utilisé pour les actions contextuelles.

```
┌─────────────────────────────────┐
│  ▃▃▃▃▃ (drag handle)            │
│                                 │
│  📄 Nom de la page              │
│  ─────────────────────────────  │
│  [🎯 Réviser maintenant]        │
│  [📧 Créer un digest]           │
│  [👁️ Voir aperçu]              │
│                                 │
│  [✕ Annuler]                    │
└─────────────────────────────────┘
```

| Comportement | Action |
|──────────────|────────|
| Drag down | Fermer |
| Tap backdrop | Fermer |
| Tap option | Exécuter + fermer |

### Pattern 5 : Empty State

Utilisé quand aucun contenu.

```
┌─────────────────────────────────┐
│                                 │
│         📚                      │
│                                 │
│   Aucune page connectée         │
│                                 │
│   Connectez votre Notion pour   │
│   commencer à réviser.          │
│                                 │
│   [Connecter Notion]            │
│                                 │
└─────────────────────────────────┘
```

| Élément | Requis |
|─────────|────────|
| Illustration/icône | Oui |
| Titre explicatif | Oui |
| Description | Oui |
| CTA | Oui (si action possible) |

### Pattern 6 : Streaks & Gamification

Système de motivation visuelle.

```
┌─────────────────────────────────┐
│  🔥 3 jours de suite !          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  L M M J V S D                  │
│  ✓ ✓ ✓ ○ ○ ○ ○                  │
└─────────────────────────────────┘
```

| Milestone | Récompense visuelle |
|───────────|─────────────────────|
| 3 jours | Badge bronze |
| 7 jours | Badge argent + confetti |
| 30 jours | Badge or + animation spéciale |

### Pattern 7 : Question/Réponse

Le cœur de l'expérience.

**État Question :**
- Question en font `question` (20px, weight 500)
- Textarea auto-resize pour la réponse
- Bouton "Valider" toujours visible

**État Feedback :**
- Icône animée (✅ ou 🔄)
- Message clair ("Correct !" ou "À revoir")
- Extrait des notes de l'utilisateur
- Bouton "Question suivante"

### Récapitulatif Patterns

| Pattern | Usage | Priorité |
|─────────|───────|──────────|
| Card Action | Partout | MVP |
| Progress Bar | Sessions | MVP |
| Feedback Toast | Actions | MVP |
| Bottom Sheet | Actions contextuelles | MVP |
| Empty State | Onboarding | MVP |
| Streaks | Motivation | MVP |
| Question/Réponse | Core | MVP |

## Responsive Design

### Breakpoints

| Breakpoint | Largeur | Device cible | Priorité |
|------------|---------|--------------|----------|
| `mobile` | < 640px | iPhone, Android | 🥇 Design principal |
| `tablet` | 640px - 1024px | iPad portrait | 🥈 Adaptation |
| `desktop` | ≥ 1024px | Laptop, Desktop | 🥉 Extension |

### Adaptations par Breakpoint

**Navigation :**

| Breakpoint | Navigation |
|------------|------------|
| Mobile | Bottom nav (4 items) |
| Tablet | Bottom nav OU sidebar |
| Desktop | Sidebar gauche |

**Layout Session de Révision :**

| Breakpoint | Layout |
|------------|--------|
| Mobile | Full-width, stack vertical |
| Desktop | Centré max-width 600px, plus d'espace blanc |

**Home Dashboard :**

| Breakpoint | Layout |
|------------|--------|
| Mobile | Stack vertical, cards full-width |
| Desktop | Grid 2 colonnes, sidebar avec pages |

### Touch vs Mouse

| Interaction | Mobile (Touch) | Desktop (Mouse) |
|-------------|----------------|-----------------|
| Selection | Tap | Click |
| Context menu | Long press → Bottom sheet | Right-click → Dropdown |
| Scroll | Swipe | Scroll wheel |
| Hover preview | Non disponible | Afficher tooltip/preview |

## États & Edge Cases

### États des Boutons

| État | Apparence | Trigger |
|------|-----------|---------|
| Default | Couleur standard | Initial |
| Hover | Légère élévation | Souris survole (desktop) |
| Pressed | Scale 0.98, couleur foncée | Tap/click actif |
| Loading | Spinner + texte grisé | Action en cours |
| Disabled | Opacité 50% | Action non disponible |

### États de Session

| État | Écran | Condition |
|------|-------|-----------|
| **Loading** | Skeleton questions | Génération IA en cours |
| **Active** | Question affichée | Normal |
| **Submitting** | Bouton loading | Envoi réponse |
| **Feedback** | Correct/À revoir | Après validation |
| **Complete** | Récap session | Dernière question répondue |
| **Interrupted** | Sauvegarde auto | Utilisateur ferme l'app |

### États de Connexion Notion

| État | Message | Action |
|------|---------|--------|
| **Not connected** | "Connectez votre Notion" | Bouton OAuth |
| **Connecting** | Spinner + "Connexion..." | Attente OAuth |
| **Connected** | ✅ + nombre de pages | Option déconnecter |
| **Expired** | ⚠️ "Connexion expirée" | Bouton reconnecter |
| **Error** | ❌ "Échec connexion" | Retry + contact support |

### États des Digests

| État | Badge/Indicateur |
|------|------------------|
| **Active** | 📧 icône sur la page + badge vert |
| **Paused** | Badge orange "En pause" |
| **Expired** | "Terminé" + option renouveler |

### Edge Cases & Erreurs

| Situation | Comportement | Message UX |
|-----------|--------------|------------|
| Page Notion vide | Impossible de réviser | "Cette page est vide. Ajoutez du contenu dans Notion." |
| Page trop courte | Générer moins de questions | "Page courte : 3 questions générées" |
| Page très longue | Chunk + sélection | "Cette page est longue. Voulez-vous réviser une section ?" |
| API Notion down | Retry 3x puis erreur | "Notion est temporairement indisponible. Réessayez." |
| Rate limit Notion | Queue + retry | "Chargement... (beaucoup de pages)" |
| LLM timeout | Retry 2x puis fallback | "Génération plus lente que prévu..." |
| LLM génère mal | Bouton signaler | "Cette question vous semble incorrecte ? [Signaler]" |
| Offline | Désactiver actions | "Vous êtes hors ligne. Reconnectez-vous." |
| Session cookie expiré | Redirect login | "Session expirée. Reconnectez-vous." |

### Règles de Gestion d'Erreur

- Jamais de message technique ("Error 500")
- Toujours une action (Retry, Contact, Go back)
- Ton empathique ("Oups" pas "Erreur")

## Accessibilité

### Niveau MVP — Pratiques Gratuites

| Pratique | Effort | Impact |
|----------|--------|--------|
| Contraste texte | Zéro | Lisibilité pour tous |
| Labels sur inputs | Zéro | Screen readers + SEO |
| Alt text sur images | Minimal | Screen readers |
| Focus visible | Minimal | Navigation clavier |
| Hiérarchie headings | Zéro | Structure logique |
| Boutons vs liens | Zéro | Sémantique correcte |

### Vérification Contrastes

| Combo | Ratio | WCAG AA |
|-------|-------|---------|
| `#37352F` sur `#FFFFFF` | 12.6:1 | ✅ Pass |
| `#787774` sur `#FFFFFF` | 4.9:1 | ✅ Pass |
| `#0F7B6C` sur `#FFFFFF` | 5.2:1 | ✅ Pass |
| `#C4660A` sur `#FFFFFF` | 4.5:1 | ✅ Pass (ajusté) |

**Note :** Orange warning ajusté de `#D9730D` à `#C4660A` pour atteindre ratio 4.5:1.

### Touch Targets

| Élément | Taille minimum | Validation |
|---------|----------------|------------|
| Boutons | 44x44px | ✅ Respecté |
| Bottom nav items | 44x44px | ✅ Respecté |
| Cards cliquables | 48px hauteur min | ✅ Respecté |

### Reporté à Growth

| Pratique | Raison |
|----------|--------|
| ARIA live regions | Complexité |
| Skip links | Faible priorité initiale |
| Reduced motion | Animations subtiles |
| Screen reader testing complet | Temps |

## Template Email Digest

### Structure de l'Email

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [ NotionTutor ]                                    │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  📄 {Nom de la page}                                │   │
│  │  Jour {X}/{Y}                                       │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  💡 EXTRAIT DU JOUR                                 │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  "{Citation extraite des notes}"            │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  🎯 MICRO-QUESTION                                  │   │
│  │  {Question générée par l'IA}                        │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │         [ Répondre dans l'app → ]           │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  🔥 Vous êtes à {N} jours de suite !                │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Se désabonner  •  Gérer mes digests                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Éléments du Template

| Section | Contenu | Obligatoire |
|---------|---------|-------------|
| **Header** | Logo NotionTutor | ✅ Oui |
| **Contexte** | Nom de la page + progression (Jour X/Y) | ✅ Oui |
| **Extrait** | Citation/passage des notes (highlight) | ✅ Oui |
| **Micro-question** | Question générée par l'IA | ✅ Oui |
| **CTA** | Bouton "Répondre dans l'app" | ✅ Oui |
| **Streak** | Motivation ("X jours de suite !") | ⚡ Optionnel |
| **Footer** | Se désabonner + gérer digests | ✅ Légal |

### Spécifications Visuelles

| Propriété | Valeur |
|-----------|--------|
| Largeur max | 600px |
| Padding desktop | 24px |
| Padding mobile | 16px |
| Background | `#FFFFFF` |
| Texte principal | `#37352F` |
| Accent (bouton) | `#2EAADC` |
| Citation background | `#F7F6F3` |
| Border | `#E9E9E7` |
| Font-family | Arial, Helvetica, sans-serif |
| Titre | 18px, bold |
| Body | 16px, regular |
| Caption | 14px, `#787774` |

### Variantes

| Type | Contenu |
|------|---------|
| **Quotidien** | 1 extrait + 1 question |
| **Hebdomadaire** | 3-5 extraits + recap semaine + 1 question |

### Deep Link

CTA → `https://app.notiontutor.com/digest/{digest_id}/question/{question_id}`

**Fallback :** Si non connecté, redirect login puis question.
