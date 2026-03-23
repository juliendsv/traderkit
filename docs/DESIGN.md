# TraderKit — Design System & Google Stitch Prompts

> **How to use this file**
> Each section under **Screens** is a self-contained prompt ready to paste into [Google Stitch](https://stitch.withgoogle.com/). Always paste the **Design System** block first (or include it inline), then paste the screen prompt. Make one change at a time when refining.

---

## Design System

Copy this block at the top of every Stitch session to lock in brand consistency.

```
TraderKit is a premium crypto trading journal. The aesthetic blends Kraken's serious,
data-dense dark interface with Coinbase's clean hierarchy and approachable layout.
Professional, trustworthy, and fast-feeling.

DESIGN SYSTEM:
- Platform: Web, desktop-first (1280px canvas), responsive to 375px mobile
- Theme: Dark
- Background: Deep navy-black #0A0E1A
- Surface / card background: #0F1629
- Elevated surface (modals, dropdowns): #141E35
- Border: #1A2340
- Primary accent: Electric blue #3B82F6
- Accent hover: #2563EB
- Text primary: #F8FAFC
- Text secondary: #94A3B8
- Text muted: #4B5675
- Positive PnL / success: Emerald #10B981
- Negative PnL / danger: #EF4444
- Warning: #F59E0B
- Font: Inter (weights 400, 500, 600, 700)
- Border radius: 12px cards, 8px inputs and buttons, 6px tags and badges
- Card padding: 24px
- Grid gap: 16px
- Shadows: subtle inner glow on active cards using the primary accent at 10% opacity
```

---

## Screens

### 1. Landing Page

```
Design the TraderKit landing page for a crypto trading journal web app.
Include the TraderKit Design System defined above.

Page structure:

1. Top navigation bar (sticky):
   - Left: Logo — "TraderKit" wordmark in white, with a small candlestick chart icon in electric blue to the left.
   - Center: Nav links — Features, Pricing, About — in muted text that brightens on hover.
   - Right: "Sign in" ghost button and "Get started free" filled blue pill button.
   - Background: transparent on scroll start, transitions to surface color #0F1629 with bottom border on scroll.

2. Hero section (full viewport height, centered):
   - Large badge above headline: pill-shaped tag reading "Free during beta" in electric blue on dark surface.
   - Headline (h1, bold, 64px): "The trading journal built for crypto." — white text, line break after "journal".
   - Sub-headline (20px, muted text): "Auto-import trades from your exchange. Track P&L with FIFO precision. Know exactly where you stand."
   - Two CTA buttons side by side: "Connect Kraken — it's free" (filled blue, large, pill) and "See how it works" (ghost, same size).
   - Below buttons: a row of three small proof points with check icons in emerald: "Read-only API keys", "FIFO cost basis", "No spreadsheets".
   - Background: gradient from #0A0E1A at top to #0D1225 at bottom, subtle radial glow in electric blue at center-top.

3. Dashboard preview section:
   - Section label (small caps, muted): "Your performance at a glance"
   - A large browser-frame mockup centered on the screen showing the TraderKit dashboard overview (dark UI, stat cards, a line chart, a bar chart). The mockup has a subtle blue glow around the outer frame.
   - Background: slightly lighter than hero (#0D1225), full bleed.

4. Features section (three-column grid):
   - Section headline (h2): "Everything a serious trader needs."
   - Three feature cards on surface background, each with: a small icon in electric blue, a bold feature title, and two lines of description text in muted color.
   - Features: "Auto-sync trades" / "FIFO P&L engine" / "Performance calendar"

5. Supported exchanges section:
   - Centered label: "Works with" in muted text
   - Logo row: Kraken logo, Coinbase logo (greyed out with "coming soon" badge), Binance (greyed out), Bybit (greyed out).

6. Pricing section:
   - Single centered card on elevated surface, 480px wide, with a subtle electric blue border.
   - "Free during beta" headline inside the card.
   - Bulleted feature list with emerald checkmarks.
   - Large "Get started free" blue pill button.

7. Footer:
   - Two columns: left has logo and tagline, right has nav links.
   - Bottom bar: muted copyright text.
```

---

### 2. Auth Page (Sign In)

```
Design the TraderKit sign-in page. Include the TraderKit Design System.

Page structure:

1. Full-page centered layout, background #0A0E1A with a faint radial glow in blue at top-center.

2. A single centered card (480px wide, surface color #0F1629, 12px radius, 40px padding) containing:
   - Top: TraderKit logo (candlestick icon + wordmark) centered.
   - Headline (h2, 24px bold): "Sign in to TraderKit"
   - Sub-text (muted, 14px): "We'll send a magic link to your inbox — no password needed."
   - Email input field: full-width, dark background #141E35, border #1A2340, placeholder "you@example.com", 8px radius, 44px height.
   - "Send magic link" button: full-width, filled electric blue, 8px radius, 44px height, bold 15px label.
   - Divider with muted text "or" between email and social options (reserved space, greyed out).
   - Muted fine print at bottom: "By continuing you agree to our Terms and Privacy Policy."

3. No sidebar, no header nav — pure focus mode.
```

---

### 3. Dashboard Overview

```
Design the TraderKit dashboard overview page. Include the TraderKit Design System.

Layout:
- Left sidebar (240px wide, surface #0F1629, full height, fixed):
  - Top: TraderKit logo + wordmark.
  - Nav items with icons (home, list, calendar, plug): Overview (active, highlighted with blue left border and blue icon), Trades, Calendar, Connect Exchange.
  - Bottom of sidebar: user email in muted text and a small sign-out icon.
- Main content area: background #0A0E1A, padding 32px, max-width 960px centered.

Main content structure:

1. Page header row:
   - Left: "Overview" in bold white h1, sub-label "Last 90 days" in muted text below.
   - Right: exchange badge (e.g. "kraken · synced 14:23") in a small pill on surface color, and a "Sync now" ghost button with a refresh icon.

2. Stats cards row (four cards in a horizontal grid):
   - Card 1: "Total P&L" — large number in emerald green (positive) or red (negative), sub-label in muted text.
   - Card 2: "Win Rate" — percentage in white, sub-label "of closed trades".
   - Card 3: "Avg Win / Avg Loss" — two values stacked, green and red respectively.
   - Card 4: "Current Streak" — number + "wins" or "losses" label, colored accordingly.
   - Each card: surface background, 12px radius, 24px padding, subtle top border in the relevant accent color.

3. Cumulative P&L chart (full-width card):
   - Card header: "Cumulative P&L" in small medium-weight label, muted "Last 90 days" on the right.
   - Area line chart: line in electric blue, area fill is a gradient from electric blue at 30% opacity to transparent. X-axis shows dates, Y-axis shows USD. Grid lines are very subtle (#1A2340). No border on the chart itself.
   - Chart height: 220px.

4. Two-column row:
   - Left card "P&L by Day of Week": vertical bar chart, bars colored electric blue for positive days, muted grey for near-zero. X-axis: Mon–Sun.
   - Right card "Token Performance": two sections stacked — "Best performer" (token name + PnL in emerald, small pill badge) and "Worst performer" (token name + PnL in red, small pill badge). Each row has the token symbol in a small dark badge on the left.
```

---

### 4. Trades Table

```
Design the TraderKit trades page. Include the TraderKit Design System.

Layout: Same sidebar as Dashboard Overview. Main content padding 32px.

Main content structure:

1. Page header:
   - "Trades" bold h1, sub-label "All imported trades" in muted text.
   - Right: a search input (dark, ghost style, with a search icon) and a filter dropdown button (ghost, "Filter" label with chevron).

2. Full-width trades table card (surface background, 12px radius):
   - Table header row: background slightly elevated (#141E35), text in muted small-caps. Columns: Date, Pair, Side, Amount, Price, Fee, P&L.
   - Alternating rows: base row on surface color, every other row on #0F1629.
   - "Side" column: "BUY" displayed as a small pill badge in blue tint, "SELL" in a muted grey pill.
   - "P&L" column: positive values in emerald green, negative in red, null (buys) displayed as a muted dash.
   - Row hover state: subtle blue highlight (#1A2340 background, left blue border accent).
   - Row height: 48px for comfortable scanning.
   - Pagination row at the bottom of the card: "Showing 1–50 of 234 trades" in muted text, prev/next ghost buttons.
```

---

### 5. P&L Calendar

```
Design the TraderKit calendar page. Include the TraderKit Design System.

Layout: Same sidebar as Dashboard Overview. Main content padding 32px, max-width 720px.

Main content structure:

1. Page header:
   - "Calendar" bold h1, sub-label "Daily P&L heatmap" in muted text.
   - Right: a year selector (ghost dropdown, e.g. "2026 ▾").

2. Full-width calendar card (surface background, 12px radius, 32px padding):
   - Month grid layout: 12 months arranged in a 3×4 grid (desktop) or stacked (mobile).
   - Each month shows a compact grid of day cells (7 columns for days of week, ~5 rows).
   - Day cells: 28×28px squares, 4px gap.
     - Profitable day: emerald green, intensity scales with P&L magnitude (light green to deep green).
     - Losing day: red, intensity scales with loss magnitude.
     - Zero / no trade: muted #1A2340 background.
     - Today: subtle white ring outline.
   - Month labels above each grid in small medium-weight white text.
   - Day-of-week column headers (M T W T F S S) in muted tiny text above each month grid.
   - Hover tooltip on each day cell: show date and formatted P&L (e.g. "+$1,240.50").

3. Legend row below the calendar:
   - Small label "Loss" — gradient swatch from light red to deep red — small label "Gain" — gradient swatch from light green to deep green.
   - Centered, muted text, minimal.
```

---

### 6. Connect Exchange

```
Design the TraderKit connect exchange page. Include the TraderKit Design System.

Layout: Same sidebar as Dashboard Overview. Main content padding 32px, max-width 640px.

Main content structure:

1. Page header:
   - "Connect Exchange" bold h1, sub-label "Read-only API keys only — we never touch your funds." in muted text. Muted text has a small lock icon before it.

2. If no exchange is connected — empty state card (surface, dashed border in #1A2340, 12px radius, center-aligned, 64px vertical padding):
   - A plug icon in electric blue (48px).
   - "No exchange connected" in white medium text.
   - "Connect Kraken to start importing your trades automatically." in muted smaller text.
   - "Connect Kraken" filled blue button below.

3. Connect form card (surface background, 12px radius, 32px padding) — shown when user clicks connect:
   - Exchange selector row at the top: Kraken tile (active, blue border, Kraken logo) and greyed-out tiles for Coinbase, Binance, Bybit (each with "Coming soon" badge).
   - Two inputs stacked: "API Key" and "API Secret", both dark with #141E35 fill.
   - Info callout box (elevated surface, blue left border, 8px radius): "Create a read-only key in Kraken → Security → API. Only 'Query Funds' and 'Query Ledger Entries' permissions are needed."
   - "Connect" filled blue button, full-width.
   - Below button: muted fine print "Keys are encrypted with AES-256-GCM before storage."

4. Connected exchange card (shown when an exchange is already linked):
   - Exchange logo + name on the left, "Active" pill badge in emerald on the right.
   - Two rows of metadata in muted text: "Last synced · 14:23 today" and "API key · ••••••••••••abcd".
   - Row of two ghost buttons: "Sync now" and "Disconnect" (disconnect in red ghost style).
```

---

## Refinement Prompts

Use these after the initial screen generates to iterate:

- `"Make the sidebar narrower (200px) and use icon-only labels on smaller breakpoints"`
- `"On the dashboard, make the stats cards taller with more breathing room"`
- `"Change all chart colors to use the electric blue primary and keep the emerald only for positive PnL indicators"`
- `"Make the trades table rows more compact — reduce height to 40px"`
- `"On the landing page hero, add a soft animated gradient orb behind the headline"`
- `"Switch the calendar from a 3×4 grid to a full-width 12-month horizontal scroll on mobile"`
- `"Add a top banner to the dashboard that appears only when no exchange is connected"`
