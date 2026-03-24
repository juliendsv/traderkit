# Design System: TraderKit
**Project ID:** `15959099264635802806`

---

## 1. Visual Theme & Atmosphere

**Vibe:** Dark, professional, data-dense. The aesthetic is "crypto-native terminal meets polished SaaS" — deep navy backgrounds with precisely calibrated elevation layers, cool blue primary actions, and a deliberate use of green/red for profit/loss signaling. The mood is confident and analytical without being aggressive. Glassmorphism effects are used sparingly on navigation and floating cards to add depth without clutter.

- **Color mode:** Dark only (`class="dark"` on `<html>`)
- **Platform:** Mobile-first (780px design width), with responsive desktop layout (sidebar + max-w-7xl content)
- **Personality keywords:** Professional, data-forward, secure, precise

---

## 2. Color Palette & Roles

All colors are from a Material Design 3 dark scheme with custom crypto-flavored overrides.

### Surfaces (deep navy elevation stack)
| Role | Semantic Name | Hex |
|------|--------------|-----|
| Body background | Deep Void | `#0a0e1a` (`surface-container-lowest`) |
| Base surface | Dark Slate | `#0f131f` (`surface` / `surface-dim` / `background`) |
| Low elevation | Navy Card Low | `#171b28` (`surface-container-low`) |
| Card / Panel | Navy Card | `#1b1f2c` (`surface-container`) |
| High elevation | Navy Card High | `#262a37` (`surface-container-high`) |
| Highest elevation | Navy Card Top | `#313442` (`surface-container-highest` / `surface-variant`) |
| Accent surface | Surface Bright | `#353946` (`surface-bright`) |

### Text
| Role | Semantic Name | Hex |
|------|--------------|-----|
| Primary text | Ice White | `#dfe2f3` (`on-surface` / `on-background`) |
| Secondary text | Muted Slate | `#c2c6d6` (`on-surface-variant`) |
| Subdued / placeholder | Cool Gray | `#8c909f` (`outline`) |
| Subtle border text | Dim Blue-Gray | `#424754` (`outline-variant`) |

### Brand / Action (Blue)
| Role | Semantic Name | Hex |
|------|--------------|-----|
| Primary brand (light) | Periwinkle Blue | `#adc6ff` (`primary`) |
| Primary action / CTA | Vivid Blue | `#4d8eff` (`primary-container`) |
| Logo icon accent | Electric Blue | `#3B82F6` (inline, candlestick icon) |
| Gradient start | Gradient Periwinkle | `#adc6ff` |
| Gradient end | Gradient Vivid Blue | `#4d8eff` |
| On-primary (dark text) | Deep Navy | `#002e6a` (`on-primary`) |
| On-primary-container | Ink Navy | `#00285d` (`on-primary-container`) |

> **CTA Gradient:** `linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%)` — used on primary buttons and progress bars. Called `kinetic-gradient`.

### Profit Signal (Green)
| Role | Semantic Name | Hex |
|------|--------------|-----|
| Profit / success | Mint Green | `#4edea3` (`secondary`) |
| Profit background | Deep Teal | `#00a572` (`secondary-container`) |
| Checkmark / confirm | Mint Green | `#4edea3` (`secondary`) |

### Loss Signal (Red)
| Role | Semantic Name | Hex |
|------|--------------|-----|
| Loss / danger | Coral Red | `#ffb3ad` (`tertiary`) |
| Loss container / badge | Vivid Red | `#ff5451` (`tertiary-container`) |
| Error | Salmon Error | `#ffb4ab` (`error`) |

### Borders
| Role | Hex |
|------|-----|
| Subtle card border | `#424754` (`outline-variant`) — typically at 10–30% opacity |
| Chart grid lines | `#1A2340` |

---

## 3. Typography Rules

**Font family:** Inter — used for all text (headline, body, label). No secondary typeface.

```css
font-family: 'Inter', sans-serif;
-webkit-font-smoothing: antialiased;
```

| Category | Weight | Usage |
|----------|--------|-------|
| Display / Hero headline | 800 (extrabold) | Page titles, large metrics, stat numbers |
| Section heading | 700 (bold) | Section h2/h3, card titles |
| UI labels / nav | 600 (semibold) | Buttons, active nav items, badge text |
| Body copy | 500 (medium) | Descriptive paragraph text, feature descriptions |
| Supporting | 400 (regular) | Secondary metadata, timestamps |

**Letter spacing:**
- Headlines: `tracking-tight` / `tracking-tighter` (tight, ≈ -0.025em)
- Section labels / eyebrows: `tracking-[0.2em]` + `uppercase` (wide-spaced, small caps aesthetic)
- Stat micro-labels: `tracking-widest` + `uppercase` on `text-[11px]` — key pattern for dashboard KPIs

---

## 4. Component Styling

### Buttons

| Variant | Shape | Style | Text |
|---------|-------|-------|------|
| **Primary CTA** | Gently rounded (`rounded-lg`) | `kinetic-gradient` fill, `shadow-xl shadow-primary/10` | `on-primary-container` (#00285d), `font-bold` |
| **Secondary** | Gently rounded (`rounded-lg`) | Outlined, `border-outline-variant`, transparent bg | `on-surface`, `font-bold` |
| **Tertiary / ghost** | `rounded-md` | `border border-primary/20`, `hover:bg-primary/5` | `text-primary`, `font-semibold` |
| **Neutral** | `rounded-md` | `bg-surface-container-highest/50`, `hover:bg-surface-container-highest` | White |

### Cards

| Variant | Shape | Style |
|---------|-------|-------|
| **Feature card** | `rounded-md` | `bg-surface-container`, `border border-outline-variant/10`, hover: `border-primary/30` |
| **Stat / KPI card** | `rounded-md` | `bg-surface-container`, colored 1px top accent bar with glow shadow |
| **Pricing card** | `rounded-md` | `bg-surface-container-high`, `border border-outline-variant/10` |
| **Pricing card (popular)** | `rounded-md` | `border-2 border-secondary`, `shadow-2xl shadow-secondary/10`, `scale-105` |
| **Glassmorphism card** | `rounded-md` | `bg-surface-container/80 backdrop-blur-md border border-outline-variant/20` |

### Navigation

**Desktop sidebar:**
- Width: `w-64` (256px), fixed left, `bg-[#1b1f2c]`
- Nav items: `rounded-lg`, `px-3 py-2.5`
- Active state: `text-blue-400 bg-blue-500/10 border-l-2 border-blue-500` + `inner-glow-primary` (inset shadow)
- Inactive: `text-slate-400 hover:bg-[#262a37]`

**Mobile top bar:**
- Height: `h-16`, `bg-[#0A0E1A]/80 backdrop-blur-xl`
- Logo + icon on left, utility icons right

### Stat Card Top Border (KPI Pattern)
Each stat card has a thin `h-1` accent bar at the top with a matching glow:
```css
/* Profit P&L */
bg-secondary + shadow-[0_0_12px_rgba(78,222,163,0.3)]
/* Win Rate */
bg-primary + shadow-[0_0_12px_rgba(173,198,255,0.3)]
/* Loss streak */
bg-tertiary-container + shadow-[0_0_12px_rgba(255,84,81,0.3)]
```

### Badges & Tags
- Pill badge: `rounded-full`, e.g., `bg-secondary text-on-secondary-container font-black uppercase tracking-widest px-4 py-1.5`
- "Coming soon" tag: `rounded`, `bg-surface-container-highest px-2 py-0.5 text-primary border border-primary/20 text-[10px] font-bold`
- Beta pill: `border border-primary/20 bg-primary/10 text-primary rounded-full`

### Icons
Material Symbols Outlined, `opsz` 24 by default. Feature card icons: `opsz` 40. Active/filled icons use `font-variation-settings: 'FILL' 1`.

---

## 5. Special Effects

### kinetic-gradient (Primary CTA)
```css
background: linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%);
```
Used on: CTA buttons, progress bars, active indicators.

### hero-glow (Landing hero background)
```css
background: radial-gradient(circle at 50% -20%, rgba(77, 142, 255, 0.15) 0%, rgba(10, 14, 26, 0) 70%);
```

### dashboard-glow (Product preview frame)
```css
box-shadow: 0 0 50px -12px rgba(77, 142, 255, 0.3);
```

### glass-nav / glassmorphism
```css
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
```
Used on: top navigation bar, floating data cards over charts.

---

## 6. Layout Principles

- **Max content width:** `max-w-7xl` (1280px) with `mx-auto`
- **Section padding:** `py-32 px-6` for marketing sections, `py-20` for supporting sections
- **Dashboard padding:** `pt-20 pb-24 lg:pt-8 lg:pb-8 lg:pl-72 px-6 lg:px-8`
- **Grid system:**
  - Feature grid: `grid-cols-1 md:grid-cols-3`
  - Stat grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`
  - Two-column panels: `grid-cols-1 lg:grid-cols-2 gap-8`
- **Card gaps:** `gap-6` for stat grids, `gap-8` for feature / two-column grids
- **Whitespace philosophy:** Generous vertical rhythm — `mb-8` between sections, `mb-6` within cards. Labels use `mb-2`, values `mb-4`.
- **Responsive pattern:** Mobile-first. Desktop adds left sidebar (264px), wider content grid columns, hidden→visible toggles via `lg:` prefix.
