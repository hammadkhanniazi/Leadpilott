---
name: Ledger & Pipeline
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006243'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d57'
  on-tertiary-container: '#bdffdc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  metric-num:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for accounting, bookkeeping, and advisory professionals who manage high-stakes financial engagements. The personality is authoritative, calm, and frictionless, favoring functional density over decorative distraction. 

The aesthetic is Modern Corporate with deliberate minimalist restraint:
- High typographic contrast for rapid data scanning.
- Precise tabular alignments and clear visual affordances for lead progression and financial metrics.
- Subdued backgrounds paired with intentional micro-interactions to minimize visual fatigue during intensive daily workflows.

## Colors

The palette leverages a crisp, clinical baseline with purposeful semantic highlights:

- **Canvas & Surfaces:**
  - Base canvas: `#F8FAFC` (Slate 50) for macro workspaces, dashboards, and sidebars.
  - Card & Input surfaces: `#FFFFFF` (White) to elevate interactive zones.
  - Secondary containers: `#F1F5F9` (Slate 100) for nested groups, table headers, and read-only states.
  - Borders & Dividers: `#E2E8F0` (Slate 200).

- **Typography & Content Hierarchy:**
  - Primary text: `#0F172A` (Dark Navy / Slate 900) providing crisp accessibility for small figures and dense ledgers.
  - Secondary text: `#475569` (Slate 600) for column labels, secondary metadata, and helper text.
  - Muted text: `#94A3B8` (Slate 400) for watermarks, empty-state cues, and disabled elements.

- **Brand & Action:**
  - Primary interactive: `#2563EB` (Blue 600) for primary CTAs and active state indicators.
  - Primary hover: `#1D4ED8` (Blue 700).
  - Primary subtle tint: `#EFF6FF` (Blue 50) for selection fills, active row backgrounds, and focused controls.

- **Status & Pipeline Tokens:**
  - `Status / New`: Text `#1D4ED8`, Background `#EFF6FF`, Border `#BFDBFE`.
  - `Status / Contacted`: Text `#6D28D9`, Background `#F5F3FF`, Border `#DDD6FE`.
  - `Status / In Review`: Text `#B45309`, Background `#FFFBEB`, Border `#FDE68A`.
  - `Status / Converted`: Text `#047857`, Background `#ECFDF5`, Border `#A7F3D0`.
  - `Status / Lost`: Text `#B91C1C`, Background `#FEF2F2`, Border `#FECACA`.

## Typography

The typography is built around high legibility, strict vertical alignment, and structured data consumption.

- **Monospace & Numerical Data:** All monetary values, balance sheets, invoice tallies, and conversion rates utilize tabular figures (`font-feature-settings: 'tnum' on, 'zero' on`) to ensure absolute vertical column alignment in CRM tables and pipeline summaries.
- **Micro-Copy & Badges:** `label-sm` utilizes an all-caps or title-case pattern with deliberate `0.02em` tracking for status pills, preventing blurriness at 11px.
- **Hierarchy Enforcement:** Section subheadings strictly use `headline-sm` with `secondary_color_hex` to maintain a distinct separation between metric summaries and lead detail lists.

## Layout & Spacing

The structural layout uses an adaptive 12-column grid system paired with an interior sidebar framework:

- **Desktop (1024px+):** Fixed collapsible navigation sidebar (260px expanded, 72px collapsed). The main workspace operates as an adaptive 12-column grid with a `1.5rem` gutter and `2rem` exterior margin.
- **Tablet (768px - 1023px):** Collapsed icon-only navigation rail (72px). Two-column metric grids collapse into stacked full-width segments. External margin transitions to `1.5rem`.
- **Mobile (< 768px):** Navigation moves to a fixed top header and slide-over drawer. External canvas margin compresses to `1rem`. All multi-column cards, Kanban stages, and data tables stack vertically or offer frictionless horizontal swipe pagination.
- **Spacing Rhythm:** Data density is prioritized; vertical margins between form rows and table cells rely on `space-sm` (8px) and `space-md` (12px), avoiding oversized whitespace that forces excessive vertical scrolling.

## Elevation & Depth

Visual hierarchy is maintained through crisp structural outlines combined with subtle ambient shadows, eliminating high-blur dramatic drop-shadows:

- **Flat / Base Layer:** Background `#F8FAFC`, zero elevation.
- **Level 1 (Cards, Tables, Panels):** Solid `#FFFFFF` fill with a `1px` continuous border of `#E2E8F0`, accompanied by an ultra-subtle ambient shadow: `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Hovered Cards, Lead Kanban Tiles in Motion):** Elevated border `#CBD5E1` with `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Dropdowns, Popovers, Date Pickers):** Floating white background with `#CBD5E1` border and `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
- **Level 4 (Modals & Advisory Side Sheets):** Dimmed backdrop (`rgba(15, 23, 42, 0.4)`), panel shadow `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`.

## Shapes

The design system adopts a Soft (`roundedness: 1`) geometric shape profile to preserve an orderly, institutional feel suitable for finance:

- **Controls & Form Inputs:** 0.375rem (6px) border-radius for inputs, standard buttons, and alert strips.
- **Cards & Data Grids:** 0.5rem (8px) border-radius on container perimeters.
- **Status Badges & Avatar Anchors:** Full circular pill styling (`rounded-full` / `9999px`) to visually differentiate metadata chips and status pills from clickable operational cards.

## Components

### Buttons
- **Primary:** Background `#2563EB`, text `#FFFFFF`, hover `#1D4ED8`, active `#1E40AF`. Subtle inner top highlight `inset 0 1px 0 rgba(255, 255, 255, 0.15)`.
- **Secondary / Outline:** Background `#FFFFFF`, border `1px solid #E2E8F0`, text `#0F172A`. Hover background `#F8FAFC`, hover border `#CBD5E1`.
- **Ghost:** Background transparent, text `#475569`. Hover background `#F1F5F9`, hover text `#0F172A`.
- **Destructive:** Background `#FFFFFF`, border `1px solid #FECACA`, text `#DC2626`. Hover background `#FEF2F2`.

### Status Pills & Chips
- Fully rounded pills (`border-radius: 9999px`), padding `2px 10px`, typography `label-sm`.
- Always constructed with a light-tint background, matched border, and deep text for AA contrast compliance.
- Examples:
  - *New Lead:* Background `#EFF6FF`, border `#BFDBFE`, text `#1D4ED8`.
  - *Qualified / Active:* Background `#ECFDF5`, border `#A7F3D0`, text `#047857`.
  - *Follow Up:* Background `#FFFBEB`, border `#FDE68A`, text `#B45309`.
  - *Contacted:* Background `#F5F3FF`, border `#DDD6FE`, text `#6D28D9`.

### Input Fields & Controls
- Height: 36px (compact) or 40px (default).
- Background `#FFFFFF`, border `1px solid #CBD5E1`, text `#0F172A`.
- Focus state: Border `#2563EB`, ring `0 0 0 3px rgba(37, 99, 235, 0.12)`.
- Error state: Border `#EF4444`, ring `0 0 0 3px rgba(239, 68, 68, 0.12)`.

### Cards & Financial Summaries
- Background `#FFFFFF`, border `1px solid #E2E8F0`, padding `space-lg`.
- Top-level metric cards feature a two-row breakdown: muted label (`label-md`) above high-contrast numerical representation (`metric-num`) with an optional delta indicator (`+14.2%`) placed top-right.

### Tables & Lead Registers
- Headers: Background `#F8FAFC`, text `#475569` (`label-sm`), uppercase with `0.05em` letter spacing, border bottom `1px solid #E2E8F0`.
- Rows: Background `#FFFFFF`, hover `#F8FAFC`, border bottom `1px solid #F1F5F9`. Selected row: background `#EFF6FF`, border bottom `1px solid #BFDBFE`.