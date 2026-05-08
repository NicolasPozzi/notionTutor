# Story 0.4: Design System Foundations

Status: ready-for-dev

## Story

As a **developer**,
I want **base UI components configured (fonts, colors, spacing)**,
so that **all features use consistent styling automatically**.

## Acceptance Criteria

### AC1: Tailwind Color Tokens
- **Given** the Tailwind config
- **When** I use utility classes
- **Then** color tokens match UX design spec exactly:
  - Background: `#FFFFFF`, Surface: `#F7F6F3`
  - Text primary: `#37352F`, Text secondary: `#787774`
  - Border: `#E9E9E7`
  - Success: `#0F7B6C`, Warning: `#C4660A`
  - Accent: `#2EAADC`, Streak: `#E16259`

### AC2: Typography
- **Given** the layout
- **When** the page renders
- **Then** Inter font is applied globally
- **And** font sizes follow UX spec (heading-1: 24px/600, heading-2: 18px/600, body: 16px/400, body-small: 14px/400, caption: 12px/400, question: 20px/500)

### AC3: Spacing Grid
- **Given** the spacing system
- **When** I use spacing utilities
- **Then** spacing uses 8px base grid (xs:4, sm:8, md:16, lg:24, xl:32)

### AC4: Mobile-First & Accessibility
- **Given** interactive elements
- **When** rendered on mobile
- **Then** minimum tap targets are 44x44px
- **And** focus-visible outline is applied
- **And** contrast ratios meet WCAG AA (4.5:1 minimum)

### AC5: Base Component Classes
- **Given** the design system
- **When** building features
- **Then** reusable component classes exist: btn-primary, btn-secondary, btn-ghost, card-default, card-interactive

## Tasks / Subtasks

- [ ] **Task 1: Align Tailwind config to UX spec** (AC: #1, #2, #3)
  - [ ] Update colors to exact UX spec values
  - [ ] Add missing tokens: border, accent, streak
  - [ ] Add `question` font size (20px/500)
  - [ ] Verify spacing grid matches 8px system

- [ ] **Task 2: Update globals.css** (AC: #4, #5)
  - [ ] Update CSS custom properties to match new tokens
  - [ ] Add component layer: btn-primary, btn-secondary, btn-ghost
  - [ ] Add component layer: card-default, card-interactive
  - [ ] Verify focus-visible and tap-target utilities

- [ ] **Task 3: Update landing page** (AC: #1, #2)
  - [ ] Apply new color tokens to existing page
  - [ ] Ensure visual consistency

- [ ] **Task 4: Verify CI passes** (AC: all)
  - [ ] Run `npm run ci`
  - [ ] Visual check of landing page

## Dev Notes

### UX Design Spec — Exact Values
- Colors from: [Source: _bmad-output/planning-artifacts/ux-design.md#Palette de couleurs]
- Typography from: [Source: _bmad-output/planning-artifacts/ux-design.md#Typographie]
- Spacing from: [Source: _bmad-output/planning-artifacts/ux-design.md#Système d'espacement]
- Components from: [Source: _bmad-output/planning-artifacts/ux-design.md#Composants]

### Contrast Ratios (pre-validated)
| Combo | Ratio | Status |
|-------|-------|--------|
| `#37352F` on `#FFFFFF` | 12.6:1 | ✅ |
| `#787774` on `#FFFFFF` | 4.9:1 | ✅ |
| `#0F7B6C` on `#FFFFFF` | 5.2:1 | ✅ |
| `#C4660A` on `#FFFFFF` | 4.5:1 | ✅ |

### Animation Durations
- Fast: 150ms (immediate feedback)
- Standard: 250ms (transitions)
- Slow: 400ms (content entries)

### Icon Library
- Lucide Icons recommended (Notion/Feather style, stroke 1.5px)
- Install when needed in Epic 1+

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
