# Design System

## Design Philosophy

AI CTO should feel like the product equivalent of a senior advisor's office: precise, confident, premium, and calm. No noise. No decorative elements that don't earn their place. Every pixel should feel considered.

**Design references:** Linear, Vercel, Raycast, Stripe, Notion
**Design anti-references:** generic SaaS dashboards, template UIs, excessive gradients, rainbow color schemes

**Core traits:**

- Dark-first (light mode secondary)
- Dense but breathable
- Typography-led (text is the primary UI element)
- Monochromatic with purposeful accent use
- Motion that informs, never distracts

---

## Color System

### Dark Theme (Primary)

```css
/* Background layers */
--bg-base: #0a0a0a; /* page background */
--bg-surface: #111111; /* cards, panels */
--bg-elevated: #1a1a1a; /* modals, dropdowns */
--bg-overlay: #222222; /* hover states */

/* Borders */
--border-subtle: #1f1f1f; /* very subtle dividers */
--border-default: #2a2a2a; /* standard borders */
--border-strong: #404040; /* emphasized borders */

/* Text */
--text-primary: #f0f0f0; /* headings, primary content */
--text-secondary: #a0a0a0; /* labels, descriptions */
--text-tertiary: #606060; /* placeholders, disabled */
--text-inverse: #0a0a0a; /* text on light backgrounds */

/* Accent — Electric Blue */
--accent-default: #3b82f6; /* primary interactive */
--accent-hover: #2563eb;
--accent-subtle: #1e3a5f; /* backgrounds with accent meaning */
--accent-fg: #ffffff; /* text on accent */

/* Semantic */
--success: #22c55e;
--success-subtle: #14532d;
--warning: #f59e0b;
--warning-subtle: #451a03;
--error: #ef4444;
--error-subtle: #450a0a;
--info: #3b82f6;
--info-subtle: #1e3a5f;

/* Severity (for findings) */
--severity-critical: #ef4444;
--severity-high: #f97316;
--severity-medium: #f59e0b;
--severity-low: #3b82f6;
--severity-info: #71717a;
```

### Light Theme (Secondary)

```css
--bg-base: #fafafa;
--bg-surface: #ffffff;
--bg-elevated: #f4f4f5;
--bg-overlay: #e4e4e7;

--border-subtle: #f4f4f5;
--border-default: #e4e4e7;
--border-strong: #a1a1aa;

--text-primary: #09090b;
--text-secondary: #52525b;
--text-tertiary: #a1a1aa;
```

---

## Typography

### Font Families

```css
--font-sans: "Geist", "Inter", system-ui, sans-serif;
--font-mono: "Geist Mono", "JetBrains Mono", "Fira Code", monospace;
```

### Type Scale

```css
/* Display — for landing page heroes only */
--text-5xl: 3rem / 1.1 / -0.04em; /* 48px */
--text-4xl: 2.25rem / 1.15 / -0.03em; /* 36px */

/* Headings */
--text-3xl: 1.875rem / 1.2 / -0.02em; /* 30px */
--text-2xl: 1.5rem / 1.25 / -0.02em; /* 24px */
--text-xl: 1.25rem / 1.3 / -0.01em; /* 20px */
--text-lg: 1.125rem / 1.4; /* 18px */

/* Body */
--text-base: 0.9375rem / 1.6; /* 15px — tighter than 16px */
--text-sm: 0.875rem / 1.5; /* 14px */
--text-xs: 0.75rem / 1.5; /* 12px */

/* Labels (uppercase + tracking) */
--text-label: 0.6875rem / 1.5 / 0.06em; /* 11px uppercase */
```

### Type Rules

- Body text: `--text-base` (15px), `--text-secondary` color for descriptions
- Headings: Always `--text-primary`, semibold (600)
- Labels: `--text-label` (11px), uppercase, letter-spacing, `--text-tertiary`
- Code: Always `--font-mono`, `--text-sm`
- Never exceed 65 characters per line for body text (readability)
- Use tabular numbers (`font-variant-numeric: tabular-nums`) for all metrics

---

## Spacing System

Based on a 4px base unit:

```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
```

**Usage rules:**

- Padding within components: 12–24px
- Gap between components: 8–16px
- Section spacing: 48–80px
- Page gutters: 24px (mobile), 40px (desktop)

---

## Elevation and Shadows

```css
/* Avoid heavy shadows — prefer borders */
--shadow-none: none;
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.25);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.2);

/* Glow effects for interactive elements */
--glow-accent: 0 0 0 1px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.15);
```

---

## Border Radius

```css
--radius-sm: 4px; /* tags, badges */
--radius-md: 8px; /* buttons, inputs, small cards */
--radius-lg: 12px; /* cards, panels */
--radius-xl: 16px; /* large cards */
--radius-full: 9999px; /* pills, avatars */
```

---

## Component Patterns

### Cards

Cards are the primary content container. Three variants:

**Default Card:** Surface background, subtle border, no shadow

```css
background: var(--bg-surface);
border: 1px solid var(--border-default);
border-radius: var(--radius-lg);
padding: 24px;
```

**Elevated Card:** Used for modals, dropdowns

```css
background: var(--bg-elevated);
border: 1px solid var(--border-strong);
box-shadow: var(--shadow-lg);
```

**Interactive Card:** Hover state with border brightening

```css
/* hover */
border-color: var(--border-strong);
background: var(--bg-overlay);
transition:
  border-color 120ms ease,
  background 120ms ease;
```

### Buttons

```
Primary:   accent background, white text
Secondary: transparent, border, primary text
Ghost:     no border, secondary text, hover bg
Danger:    error color background
```

Button rules:

- Always include an icon for destructive actions
- Minimum touch target: 44×44px
- Loading state with spinner, disabled state (not just opacity)
- No rounded pills on desktop; use `--radius-md` for all buttons

### Input Fields

```css
background: var(--bg-base);
border: 1px solid var(--border-default);
border-radius: var(--radius-md);
padding: 8px 12px;
font-size: var(--text-sm);
color: var(--text-primary);

/* Focus */
border-color: var(--accent-default);
outline: 2px solid var(--accent-subtle);
outline-offset: 0;
```

### Finding Cards

Each finding has a severity indicator:

```
┌─────────────────────────────────────────────────────┐
│  ● CRITICAL  ·  Security  ·  High Impact             │
│                                                       │
│  SQL Injection vulnerability in /api/users endpoint   │
│                                                       │
│  Input parameter `userId` is interpolated directly    │
│  into the query string without sanitization...        │
│                                                       │
│  Fix: Use parameterized queries via Prisma's where    │
│  clause syntax instead of raw string interpolation.   │
│                                                       │
│  /api/users/route.ts:42                              │
│                                           ✓ Mark Done │
└─────────────────────────────────────────────────────┘
```

### SaaS Score Display

The SaaS Score is the most prominent visual element in the analysis result:

```
        ┌─────────────────────┐
        │                     │
        │        74           │
        │      ───────        │
        │   Nearly There      │
        │                     │
        │  ████████████░░░░   │
        │                     │
        └─────────────────────┘
```

- Large, centered numeral in display font
- Circular or arc progress indicator
- Color-coded by range (red → orange → yellow → green)
- Descriptive label below score

---

## Motion and Animation

### Principles

1. **Purpose over decoration**: Every animation must serve a function (confirm state change, direct attention, indicate progress)
2. **Speed**: Most transitions: 120–200ms. Longer for complex reveals: 300–400ms.
3. **Easing**: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes
4. **No bounce**: Physics-based animations allowed only in specific contexts
5. **Respect `prefers-reduced-motion`**: All animations disabled or reduced when enabled

### Transition Defaults

```css
--transition-fast: 120ms ease-out;
--transition-default: 200ms ease-out;
--transition-slow: 300ms ease-out;
```

### Key Animation Patterns

**Page transition:** Fade + slight upward translate (20px → 0)
**Card reveal:** Staggered fade-in for lists of cards
**Score counter:** Count-up animation from 0 to final score
**Module progress:** Progress bar fills with ease-out
**Finding expand:** Height animation + fade
**AI Chat stream:** Typewriter-style text reveal
**Tab switching:** Instant (no animation — tabs are fast by nature)

---

## Layout System

### Page Grid

```css
/* Application shell */
.layout {
  display: grid;
  grid-template-columns: 240px 1fr; /* sidebar + main */
  grid-template-rows: 48px 1fr; /* topbar + content */
  min-height: 100vh;
}
```

### Content Width Constraints

```css
--content-max-xl: 1280px; /* full dashboard views */
--content-max-lg: 960px; /* analysis reports */
--content-max-md: 720px; /* settings, forms */
--content-max-sm: 480px; /* confirmation dialogs */
```

### Sidebar

- Width: 240px (fixed)
- Background: `--bg-surface` with subtle right border
- Navigation items: 36px height, 12px horizontal padding
- Active state: `--accent-subtle` background, `--accent-default` text
- Sections labeled with `--text-label` (11px uppercase)

---

## Empty States

Every empty state must include:

1. A relevant illustration or icon (not a generic sad face)
2. A descriptive title
3. A one-line explanation
4. A primary action button

Empty states should feel like helpful suggestions, not failures.

---

## Loading States

**Skeleton screens** over spinners for content areas. Spinners only for:

- Button loading state
- Small inline operations

Skeleton colors: `--bg-overlay` base, animated shimmer with `--bg-elevated`

---

## Accessibility Requirements

- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Focus indicators: visible on all interactive elements (not hidden)
- All interactive elements reachable via keyboard
- All images with meaningful content have alt text
- No color-only information (always pair color with icon or text)
- ARIA labels on icon-only buttons
- Announce dynamic content changes via `aria-live` regions

---

## Icons

**Library:** Lucide React

Rules:

- Default icon size: 16px (inline text), 20px (standalone UI), 24px (hero/feature)
- Never scale icons above 32px; use illustrations instead
- Icons paired with text: 16px, 4px gap
- Maintain consistent stroke width (default: 2px)
