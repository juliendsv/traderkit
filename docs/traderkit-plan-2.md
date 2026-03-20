# TraderKit — Crypto Trading Journal

**Domain:** traderkit.xyz
**Stack:** Next.js + Supabase + ccxt + Vercel

---

## The Core Insight

There are two distinct worlds in crypto trading tools, and there's a gap between them:

**World 1: Trading Journals** (TraderSync, TradeZella, Edgewonk, Tradervue)
→ Built for stock/forex traders. Added crypto as an afterthought. Import via CSV or broker API. Focus on psychology, pattern analysis, win rates. Price: $20-80/month. They understand TRADING but not CRYPTO.

**World 2: Portfolio Trackers** (CoinStats, Zerion, Nansen, DeBank, Step Finance)
→ Built for crypto holders. Connect wallets, track balances, see DeFi positions. Focus on portfolio value and holdings. Price: free-$100/month. They understand CRYPTO but not TRADING PERFORMANCE.

**The gap: nobody combines both.** No tool lets a crypto trader connect their Kraken account AND their Solana wallet AND see unified trading performance metrics — win rate, average hold time, best setups, worst days, P&L per token, emotional patterns — across both CEX and DEX trades.

**TraderKit fills that gap.**

---

## Who We're Building For

**Primary persona: The active crypto trader who uses 1-2 CEXes + some on-chain trading.**

Profile:
- Trades 5-50 times per week
- Uses a CEX like Kraken, Binance, or Coinbase as their main platform
- Also does some on-chain/DEX trades (Solana, Uniswap, etc.)
- Currently tracks trades in a spreadsheet, or doesn't track at all
- Knows they should journal but it's too tedious
- Willing to pay $10-30/month for something that actually helps them improve
- Active on Crypto Twitter, Discord, Telegram

**Why this person over a stock trader?**
Because the existing stock trading journals (TraderSync etc.) don't work for them. CSV exports from Kraken or Binance don't import cleanly into stock-oriented journals. On-chain trades can't be imported at all. They're underserved.

---

## Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | One project: landing page (SSR/SEO), dashboard (client), API routes (backend). Fastest to ship solo |
| Database | Supabase (Postgres + Auth + RLS + Realtime) | Auth, encrypted API key storage, row-level security per user, realtime dashboard updates |
| Exchange APIs | ccxt (TypeScript) | Unified interface for 100+ exchanges — Binance, Coinbase, Kraken out of the box. Adding an exchange = hours, not weeks |
| On-chain (Phase 3) | Helius API (Solana), Alchemy (EVM) | Parsed transaction data for DEX trades |
| Styling | TailwindCSS | Fast, utility-first, consistent with your stack |
| Charts | Recharts or TradingView Lightweight Charts | P&L charts, calendar heatmap, performance graphs |
| Auth | Supabase Auth | Email + magic link. Simple, secure, no password headaches |
| Payments | Stripe | Subscriptions, checkout, customer portal |
| Email | Resend | Transactional emails (welcome, weekly recap, trade alerts) |
| Hosting | Vercel | Free tier is generous, edge functions, automatic preview deploys, zero config for Next.js |
| Cron / Background jobs | Vercel Cron or Supabase pg_cron | Periodic trade sync (pull new trades every X hours) |

---

## User's Main Pain Points (Prioritized)

### Pain #1: "I don't know if I'm actually profitable"
Most crypto traders have a vague sense of whether they're up or down, but can't answer: "What's my actual win rate? What's my average R:R? Am I better at swing trades or scalps?" Without this data, they can't improve. **TraderKit solves this with auto-import + performance dashboard.**

### Pain #2: "Tracking trades manually is too tedious"
The #1 reason traders don't journal. Existing solutions require CSV uploads (clunky) or manual entry (kills the habit). **TraderKit solves this with API auto-sync. Trades appear automatically.**

### Pain #3: "I can't see my CEX and DEX trades together"
Active crypto traders split between Kraken/Binance AND on-chain. No tool unifies this. They're keeping two spreadsheets or ignoring one set of trades entirely. **TraderKit solves this in Phase 3 with wallet connect.**

### Pain #4: "Existing trading journals don't understand crypto"
TraderSync expects a "broker" that uses a specific CSV format. Importing Kraken trades requires manual cleanup. Crypto-specific things like funding rates, liquidations, and staking rewards aren't tracked. **TraderKit solves this by being crypto-native from day one.**

---

## Competitive Positioning

### TraderKit vs Stock Trading Journals (TraderSync, TradeZella, Edgewonk)

| | Them | TraderKit |
|---|---|---|
| Crypto CEX support | CSV upload only, limited parsing | Native API integration, auto-import |
| DEX / on-chain trades | Not supported at all | Wallet-based import (Phase 3) |
| Crypto-native metrics | Generic | Token-level P&L, fee tracking in crypto terms |
| Price | $30-80/month | $12-19/month |
| Target user | Stock day traders who also trade crypto | Crypto-first traders |

### TraderKit vs Portfolio Trackers (CoinStats, Zerion, Nansen)

| | Them | TraderKit |
|---|---|---|
| Portfolio value tracking | Excellent | Not our focus |
| Trading performance analytics | Basic or none | Deep (win rate, R:R, streaks, patterns) |
| Trade journaling / notes | Not supported | Core feature |
| AI trading insights | Not supported | Phase 4 |
| DeFi position tracking | Excellent | Not our focus |

**TraderKit's positioning:** "The trading journal built for crypto. Import from Binance, Coinbase, Kraken in one click. See your real performance. Improve or quit."

---

## Pricing

| Tier | Price | What You Get |
|---|---|---|
| **Free** | $0 | 1 exchange, last 30 days of trades, basic dashboard |
| **Pro** | $12/month ($99/year) | Unlimited exchanges, full history, notes/tags, AI insights, tax export |
| **Trader** | $19/month ($149/year) | Everything in Pro + on-chain wallet import, shareable P&L cards, priority support |

**Why this pricing:**
- Undercuts TraderSync ($30-80/mo) and TradeZella ($29-49/mo) significantly
- Free tier gets people in the door and creates habit
- $12/month is an impulse purchase for any active trader
- Annual discount locks in retention

---

## Platform Priority

### Tier 1 — MVP (Phase 1)

| Platform | Why | Users | Integration Method |
|---|---|---|---|
| **Binance** | Largest exchange globally, 275M+ users | Massive | API via ccxt (read-only keys) |
| **Coinbase** | Largest US exchange, most mainstream | Huge in US/EU | API via ccxt + CSV |
| **Kraken** | Top 3 globally, strong EU presence, pro trader audience | Large, loyal | API via ccxt + CSV |

### Tier 2 — Phase 2

| Platform | Why | Integration Method |
|---|---|---|
| **Bybit** | #3 globally by volume, huge derivatives trading | API via ccxt |
| **OKX** | 20M+ users, strong in Asia | API via ccxt |

### Tier 3 — Phase 3

| Platform | Why | Integration Method |
|---|---|---|
| **Solana on-chain** | DEX trading (Raydium, Jupiter, pump.fun) | Wallet address → Helius/Shyft API |
| **Ethereum / Base / Arbitrum** | EVM DEX trades (Uniswap etc.) | Wallet address → Alchemy API |

### Tier 4 — Phase 4+

| Platform | Why | Integration Method |
|---|---|---|
| **KuCoin, Gate.io, MEXC** | Long tail of exchanges | API via ccxt |
| **MetaTrader 4/5** | Forex-crypto crossover traders | CSV |

---

# PHASE 1: MVP (Weeks 1-4)

## Goal
Ship a working product that auto-imports trades from Binance, Coinbase, and Kraken, shows a performance dashboard, and has a landing page at traderkit.xyz. Get 50 beta users.

## What We Build

### Backend (Next.js API routes)
- **Supabase schema:** users, exchanges (encrypted API keys), trades, daily_journal entries
- **Exchange connection flow:** user enters read-only API key → validate with test call → store encrypted in Supabase
- **Trade sync endpoint:** pull trades via ccxt, normalize into unified format (date, pair, side, amount, price, fee, P&L), store in Postgres
- **Cron job:** Vercel Cron runs every 4 hours, syncs new trades for all connected accounts
- **P&L calculation engine:** compute realized P&L per trade, per token, per day, per week, per month

### Frontend (Next.js App Router + TailwindCSS)
- **Landing page** (SSR, SEO-optimized): hero, features, pricing, waitlist/signup
- **Auth flow:** Supabase Auth with magic link (email-based, no passwords)
- **Connect exchange page:** enter API key, select exchange, test connection
- **Trade list view:** table of all trades, sortable/filterable by date, pair, side, P&L
- **Calendar view:** month grid, green/red cells for profit/loss days, click to see day's trades
- **Performance dashboard:**
  - Total P&L (with chart: daily, weekly, monthly)
  - Win rate percentage
  - Average win vs average loss
  - Best/worst tokens
  - P&L by day of week
  - Current streak
  - Total fees paid

### Payments
- Stripe Checkout integration for Pro/Trader tiers
- Customer portal for subscription management
- Free tier with limits enforced server-side (1 exchange, 30-day history)

## Week-by-Week Breakdown

| Week | Focus | Deliverables |
|---|---|---|
| **Week 1** | Backend foundation | Supabase schema + auth, ccxt trade import for Kraken (your own exchange first), trade normalization, P&L calculation |
| **Week 2** | Dashboard UI | Trade list, calendar view, performance dashboard with charts, connect exchange flow |
| **Week 3** | Add Binance + Coinbase | ccxt integration for remaining Tier 1 exchanges, cron-based auto-sync, Stripe payments |
| **Week 4** | Landing page + beta launch | traderkit.xyz landing page, waitlist, deploy to Vercel, invite 50 beta users |

## Launch Channels (Week 4)

**Channel 1: Your own network**
Message 10-20 crypto traders you know. Offer free beta access.

**Channel 2: Crypto Twitter / X**
Post your own TraderKit dashboard screenshot: "I built a trading journal that auto-imports from Kraken. Here's my real March performance."

**Channel 3: Reddit**
Post on r/CryptoCurrency, r/CryptoMarkets: "I built TraderKit — a free crypto trading journal. Looking for 50 beta testers."

**Channel 4: Trading Discords / Telegram**
Share in groups you're already a member of. Offer free Pro for 3 months for feedback.

## Success Metrics
- 50 connected exchange accounts
- Active daily usage from at least 10 users
- Identify top 3 most-requested features from feedback

---

# PHASE 2: Expand & Monetize (Weeks 5-8)

## Goal
Add Bybit + OKX, enable paid tiers, add journaling/notes, hit 200 users and first 10 paying customers.

## What We Build

### New Exchange Integrations
- **Bybit** via ccxt (spot + futures)
- **OKX** via ccxt (spot + futures)
- Both should be fast since ccxt abstracts the API differences

### Trade Notes & Tags
- Per-trade annotation: free-text note + selectable tags ("FOMO", "planned entry", "news trade", "revenge trade", "scalp", "swing")
- Filter dashboard analytics by tag (e.g., "show me win rate only for 'planned entry' trades")
- This is the journaling core — the thing that separates TraderKit from a raw data tool

### Daily Journal
- Optional daily text entry: "How did today go? What went well? What would I change?"
- Appears on the calendar view alongside P&L data
- Simple rich text, no complexity

### CSV Import Fallback
- For exchanges ccxt doesn't cover well, allow CSV upload
- Parsers for Kraken CSV, Binance CSV, Coinbase CSV formats
- Catches edge cases where API import misses something

### Weekly Recap Email
- Automated email every Sunday: "Your week in review — 12 trades, 67% win rate, +$340 P&L"
- Keeps users engaged even if they don't open the app daily
- Built with Resend

### Payments Go Live
- Enable Stripe checkout for Pro ($12/mo) and Trader ($19/mo)
- Free tier limits enforced: 1 exchange, 30-day history window
- In-app upgrade prompts when users hit limits

## Week-by-Week Breakdown

| Week | Focus | Deliverables |
|---|---|---|
| **Week 5** | Iterate on feedback | Fix top bugs from beta, improve import reliability, UX polish based on user feedback |
| **Week 6** | Notes, tags, journaling | Per-trade notes/tags, daily journal, filter analytics by tag |
| **Week 7** | Bybit + OKX + CSV | New exchange integrations, CSV import fallback, weekly recap email |
| **Week 8** | Public launch + monetize | Enable paid tiers, ProductHunt launch, r/CryptoCurrency campaign, Crypto Twitter push |

## Launch Channels (Week 8)

**ProductHunt launch**
"TraderKit — The trading journal built for crypto. Auto-import from Binance, Coinbase, Kraken."

**SEO content** (publish on traderkit.xyz/blog)
- "Best crypto trading journal 2026"
- "TraderSync vs TraderKit for crypto traders"
- "How to track your crypto P&L automatically"
- "Why spreadsheets fail for crypto trading"

**Crypto Twitter campaign**
Share user testimonials, recovery stats, dashboard screenshots. Encourage users to share their own P&L cards.

## Success Metrics
- 200 total users
- 10 paying customers ($120-190 MRR)
- Net Promoter Score from beta users
- Top 3 requested features for Phase 3

---

# PHASE 3: On-Chain & Growth (Months 3-4)

## Goal
Add Solana and EVM wallet import (the big differentiator), shareable P&L cards, and grow to 500 users with 50 paying.

## What We Build

### Solana Wallet Import
- User pastes their Solana wallet address
- TraderKit reads on-chain transaction history via Helius API
- Parse DEX swaps (Jupiter, Raydium), token buys/sells, and calculate P&L per token
- Handle pump.fun trades specifically (this is where Solana traders are most active)
- Unify on-chain trades with CEX trades in the same dashboard

### EVM Wallet Import
- Same concept for Ethereum, Base, Arbitrum
- Parse Uniswap, 1inch, and other DEX trades via Alchemy API
- Unified P&L across CEX + all chains

### Shareable P&L Cards
- Generate a beautiful card image: "March 2026 — 67% win rate, +$2,340 P&L — powered by TraderKit"
- One-click share to Twitter/X
- TraderKit watermark = free marketing when traders flex their stats
- This is the growth flywheel

### Screenshot Annotations
- Attach TradingView screenshots to specific trades
- Annotate entry/exit points
- Review later during journaling sessions

### Tax Export (Basic)
- CSV export of all trades with cost basis (FIFO)
- Formatted for common tax tools (Koinly import format)
- Not a full tax tool, but removes the "export for my accountant" pain

## Success Metrics
- 500 total users
- 50 paying customers ($600-950 MRR)
- On-chain wallet connections (target: 100 wallets connected)
- Shared P&L cards (target: 50 shared on Twitter — measure virality)

---

# PHASE 4: AI Insights & Scale (Months 5-6)

## Goal
Add AI-powered trading insights, scale to 2,000 users and 200 paying customers. TraderKit becomes the definitive crypto trading journal.

## What We Build

### AI Trading Insights
- Analyze the user's full trading history and surface patterns:
  - "You lose money on trades held longer than 6 hours"
  - "Your Friday trades have a 30% lower win rate than Monday trades"
  - "Your best-performing setup is 'planned entry' with a 73% win rate — your worst is 'FOMO' at 28%"
  - "You overtrade after a loss — your win rate drops to 35% on trades placed within 1 hour of a losing trade"
- Built using the Anthropic API (Claude) analyzing trade data
- Delivered as a "Weekly Insights" section in the dashboard and in the weekly recap email

### Advanced Analytics
- Drawdown analysis (max drawdown, recovery time)
- Risk-adjusted returns (Sharpe ratio adapted for crypto)
- Correlation analysis (which tokens move together in your portfolio)
- Equity curve chart (cumulative P&L over time)

### Multiple Portfolios / Accounts
- Support users who have multiple strategies or sub-accounts
- Separate analytics per portfolio while showing combined overview

### Referral Program
- "Give a friend 1 month free Pro, get 1 month free"
- Built-in referral tracking
- Leverages the sharing behavior from P&L cards

## Success Metrics
- 2,000 total users
- 200 paying customers ($2,400-3,800 MRR)
- AI insights engagement (% of users who read their weekly insights)
- Referral-driven signups (target: 20% of new users from referrals)

---

## Full Timeline Summary

| Phase | Timeline | Key Milestone | Target MRR |
|---|---|---|---|
| **Phase 1: MVP** | Weeks 1-4 | 50 beta users, 3 exchanges | $0 (free beta) |
| **Phase 2: Expand & Monetize** | Weeks 5-8 | 200 users, 10 paying, notes/tags/journaling | $120-190 |
| **Phase 3: On-Chain & Growth** | Months 3-4 | 500 users, 50 paying, wallet import, shareable cards | $600-950 |
| **Phase 4: AI & Scale** | Months 5-6 | 2,000 users, 200 paying, AI insights | $2,400-3,800 |

---

## Why TraderKit Works for You

1. **You're the user.** You trade on Kraken. You know what metrics matter. You'll dogfood TraderKit daily.
2. **Next.js + Supabase + ccxt on Vercel** — one project, one deploy, your comfort zone. No infrastructure to manage.
3. **No marketplace dynamics.** Works for user #1 the same as user #1,000.
4. **Distribution is clear.** Crypto Twitter is the channel. One viral screenshot does more than months of SEO.
5. **The free tier is the growth engine.** Traders try TraderKit, see their real win rate (often humbling), and stay.
6. **Shareable P&L cards are the growth flywheel.** Every share is free marketing to the exact right audience.
7. **Natural expansion.** CEX → DEX → tax → AI insights. Each phase is a new revenue unlock.
8. **The competition isn't crypto-native.** TraderSync added crypto as a checkbox. TraderKit builds for crypto from the ground up.
9. **Price-to-value is obvious.** If TraderKit helps you avoid one revenge trade per month, it's paid for itself 10x.
