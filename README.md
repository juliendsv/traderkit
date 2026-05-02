# TraderKit

**The trading journal built for crypto.** Auto-import trades from your exchange, track real performance metrics, and stop guessing whether you're actually profitable.

[traderkit.xyz](https://traderkit.xyz)

---

## What it is

TraderKit fills the gap between portfolio trackers (Zerion, CoinStats) and stock-oriented trading journals (TraderSync, TradeZella). Neither category works well for an active crypto trader who uses a CEX like Kraken or Binance alongside some on-chain trading. TraderKit is crypto-native from day one: direct API integration, automatic sync, and metrics that actually matter to traders.

---

## Features

### Exchange integration
- Connect **Kraken**, **Binance** (Global, US, or USD-M Futures), or **Coinbase** with a read-only API key
- Trades are imported automatically via [ccxt](https://github.com/ccxt/ccxt) and normalized into a unified schema
- Binance Convert (instant-swap) trades and Coinbase retail (Simple Trade) buys/sells are captured separately and merged into the same trade history
- Coinbase retail trades are tagged (`_source: coinbase_retail`) to distinguish them from Advanced Trade fills (`coinbase_advanced`)
- Deposits and withdrawals are stored in a separate `transfers` table — never counted as trades — preserving cost basis across cross-exchange moves
- Binance Flexible Earn positions (`LD`-prefixed tokens) and Coinbase staking rewards (`staking_reward`, `inflation_reward`, `interest`) are excluded from P&L calculations
- Coinbase supports both CDP keys (current format: Key Name + multi-line PEM private key) and legacy HMAC keys — CCXT auto-detects the format
- Auto-sync runs every 4 hours via a Vercel cron job; manual sync available from the dashboard
- API keys are encrypted at rest with AES-256-GCM before they reach the database

### Performance dashboard
- **Total P&L** — realized profit/loss across all closed trades (last 90 days)
- **Win rate** — percentage of trades closed in profit
- **Average win / average loss** — understand your reward-to-risk in real numbers
- **Current streak** — consecutive wins or losses from your most recent trades
- **Total fees paid** — how much you've given to the exchange
- **Cumulative P&L chart** — equity curve over time
- **P&L by day of week** — find your best and worst trading days
- **Token performance** — best and worst tokens by realized P&L

### Asset view
- Per-asset breakdown: holdings (live from exchange), average cost, current price, realized P&L, win rate, fees paid, portfolio %
- Live balances fetched in parallel from **all connected exchanges** and merged — one row per token regardless of how many venues hold it
- Exchange venue label on each row: "Held on: Kraken, Binance, Coinbase"
- Staking/earn variants normalized to their base symbol: Kraken `SOL.S` → `SOL`, Binance `LDBNB` → `BNB` (Coinbase uses clean symbols natively)
- Exited positions hidden by default; toggle to view full history
- Click any asset to open its detail page

### Asset detail page
- All historical trades for a single asset in one view, across all exchanges
- Stats strip: holdings, average cost, current price, realized P&L, win rate
- Per-exchange holdings breakdown panel when the token is held on more than one exchange
- **Trade simulator**: model a hypothetical buy or sell and instantly see the outcome
  - Buy mode: enter amount + price to see the projected new average cost and break-even price
  - Sell mode: enter amount + price to see trade P&L, total P&L, new average cost, and updated break-even
  - FIFO cost basis computed client-side — no round-trip to the server
  - Break-even price shown whenever realized P&L is negative

### Trade list
- Full table of all imported trades, sorted by date
- Pair, side (buy/sell), amount, price, fee, and realized P&L per trade

### Calendar view
- Monthly grid showing profit/loss by day (green/red cells)
- Click a day to see the individual trades that day

### Auth
- Magic link login via Supabase Auth — no passwords
- Optional email allowlist (`ALLOWED_EMAILS` env var) for private beta access

### Landing page
- SSR-rendered, SEO-optimized landing page at the root
- Waitlist form for capturing interested users before full launch

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database / Auth | Supabase (Postgres + RLS + Auth) |
| Exchange APIs | ccxt (TypeScript) |
| Styling | TailwindCSS |
| Charts | Recharts |
| Hosting | Vercel |
| Cron | Vercel Cron |

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_KEY=          # 32-byte hex string for API key encryption
CRON_SECRET=             # shared secret checked by the /api/cron route
ALLOWED_EMAILS=          # optional comma-separated email allowlist
```

### Email allowlist

Set `ALLOWED_EMAILS` to a comma-separated list of emails to restrict access during beta:

```env
ALLOWED_EMAILS=you@example.com,friend@example.com
```

When unset, all emails are allowed. Enforcement is server-side in the auth callback — if the email isn't on the list, the session is immediately revoked and the user is redirected to `/auth?error=not_allowed`.

---

## Roadmap

| Phase | Focus |
|---|---|
| **Phase 1** | Kraken integration, performance dashboard, calendar, trade list, landing page |
| **Phase 2** | Binance (Global / US / USD-M Futures), multi-exchange asset view, Convert trades, transfers |
| **Phase 3 (current)** | Coinbase (Advanced Trade + retail Simple Trade), CDP key support, staking reward filtering |
| **Phase 4** | Bybit + OKX, per-trade notes/tags, daily journal, CSV import fallback, Stripe payments |
| **Phase 5** | Solana + EVM wallet import, shareable P&L cards, tax CSV export |
| **Phase 6** | AI trading insights (Claude), advanced analytics, referral program |
