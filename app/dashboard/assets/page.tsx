import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeAssetStats, AssetStats } from '@/lib/pnl/assets'
import { krakenBaseSymbol } from '@/lib/ccxt/kraken'
import { binanceBaseSymbol, type BinanceVariant } from '@/lib/ccxt/binance'
import {
  cachedKrakenBalances,
  cachedBinanceBalances,
  cachedCoinbaseBalances,
  cachedKrakenPrices,
} from '@/lib/cache/exchanges'
import { decrypt } from '@/lib/crypto'

const BINANCE_VARIANTS = new Set<string>(['binance', 'binanceus', 'binanceusdm'])

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtAmount(n: number) {
  if (n === 0) return '0'
  if (n < 0.0001) return n.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })
  if (n < 1) return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function emptyStats(symbol: string): AssetStats {
  return {
    symbol,
    quoteCurrency: 'USD',
    holdings: 0,
    avgCost: null,
    realizedPnl: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalFees: 0,
  }
}

/** Normalize a raw balance symbol to its tradeable base symbol, regardless of exchange. */
function normalizeSymbol(symbol: string): string {
  // Kraken staking: SOL.S → SOL, ETH2.S → ETH
  const krNorm = krakenBaseSymbol(symbol)
  if (krNorm !== symbol) return krNorm
  // Binance earn: LDBNB → BNB
  return binanceBaseSymbol(symbol)
}

const EXCHANGE_DISPLAY: Record<string, string> = {
  kraken: 'Kraken',
  binance: 'Binance',
  binanceus: 'Binance US',
  binanceusdm: 'Binance Futures',
  coinbase: 'Coinbase',
}

// ─── sub-components ─────────────────────────────────────────────────────────

function PnlBadge({ value, currency }: { value: number; currency: string }) {
  const positive = value >= 0
  return (
    <span className="text-sm font-semibold tabular-nums" style={{ color: positive ? '#34d399' : '#f87171' }}>
      {positive ? '+' : ''}
      {currency === 'USD' || currency === 'USDT' ? '$' : ''}
      {fmt(value)}
      {currency !== 'USD' && currency !== 'USDT' ? ` ${currency}` : ''}
    </span>
  )
}

function WinRate({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100)
  const color = pct >= 60 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171'
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>{pct}%</span>
      <div className="h-1 rounded-full w-16" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function PortfolioPct({ pct }: { pct: number | null }) {
  if (pct === null) return <p className="text-sm" style={{ color: '#424754' }}>—</p>
  const width = Math.min(pct, 100)
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold tabular-nums text-white">{fmt(pct, 1)}%</span>
      <div className="h-1 rounded-full w-16" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1 rounded-full" style={{ width: `${width}%`, backgroundColor: '#4d8eff' }} />
      </div>
    </div>
  )
}

const COLS = '1.4fr 1fr 1fr 1fr 1fr 1fr 0.9fr 0.8fr'

function AssetRow({
  asset,
  liveBalance,
  venues,
  portfolioPct,
  currentPrice,
  priceFetchedAt,
}: {
  asset: AssetStats
  liveBalance: number | null
  venues: string[]
  portfolioPct: number | null
  currentPrice: number | null
  priceFetchedAt: string | null
}) {
  const holding = liveBalance ?? asset.holdings
  const hasPosition = holding > 1e-8
  const isLive = liveBalance !== null
  const hasTradeHistory = asset.totalTrades > 0

  return (
    <div
      className="grid items-center gap-4 px-5 py-4 rounded-xl transition-colors group-hover:border-[rgba(77,142,255,0.25)] group-hover:bg-[#1e2334]"
      style={{
        backgroundColor: '#1b1f2c',
        border: '1px solid rgba(66,71,84,0.12)',
        gridTemplateColumns: COLS,
      }}
    >
      {/* Symbol */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: '#262a37', color: '#adc6ff' }}
        >
          {asset.symbol.slice(0, 3)}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{asset.symbol}</p>
          <p className="text-[11px]" style={{ color: '#8c909f' }}>
            {venues.length > 0
              ? `Held on: ${venues.join(', ')}`
              : hasTradeHistory
              ? `${asset.totalTrades} trade${asset.totalTrades !== 1 ? 's' : ''}`
              : 'deposit only'}
          </p>
        </div>
      </div>

      {/* Holdings */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#8c909f' }}>
            Holdings
          </p>
          {isLive && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(0,165,114,0.15)', color: '#00a572' }}
            >
              live
            </span>
          )}
        </div>
        {hasPosition ? (
          <p className="text-white text-sm font-semibold tabular-nums">{fmtAmount(holding)}</p>
        ) : (
          <p className="text-sm" style={{ color: '#424754' }}>—</p>
        )}
      </div>

      {/* Avg Cost */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#8c909f' }}>
          Avg Cost
        </p>
        {asset.avgCost !== null ? (
          <p className="text-white text-sm font-semibold tabular-nums">
            ${fmt(asset.avgCost, asset.avgCost < 1 ? 6 : 2)}
          </p>
        ) : (
          <p className="text-sm" style={{ color: '#424754' }}>—</p>
        )}
      </div>

      {/* Current Price */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#8c909f' }}>
          Current Price
        </p>
        {currentPrice !== null ? (
          <div>
            <p className="text-white text-sm font-semibold tabular-nums">
              ${fmt(currentPrice, currentPrice < 1 ? 6 : 2)}
            </p>
            {priceFetchedAt && (
              <p className="text-[10px] mt-0.5" style={{ color: '#424754' }}>{priceFetchedAt}</p>
            )}
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#424754' }}>—</p>
        )}
      </div>

      {/* Realized P&L */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#8c909f' }}>
          Realized P&L
        </p>
        {asset.winningTrades + asset.losingTrades > 0 ? (
          <PnlBadge value={asset.realizedPnl} currency={asset.quoteCurrency} />
        ) : (
          <p className="text-xs" style={{ color: '#424754' }}>No sells yet</p>
        )}
      </div>

      {/* Win Rate */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#8c909f' }}>
          Win Rate
        </p>
        {asset.winningTrades + asset.losingTrades > 0 ? (
          <WinRate rate={asset.winRate} />
        ) : (
          <p className="text-xs" style={{ color: '#424754' }}>—</p>
        )}
      </div>

      {/* Fees */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#8c909f' }}>
          Fees Paid
        </p>
        <p className="text-sm tabular-nums" style={{ color: '#c2c6d6' }}>
          {hasTradeHistory ? `$${fmt(asset.totalFees)}` : '—'}
        </p>
      </div>

      {/* Portfolio % */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#8c909f' }}>
          Portfolio
        </p>
        <PortfolioPct pct={portfolioPct} />
      </div>
    </div>
  )
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ history?: string }>
}) {
  const { history } = await searchParams
  const showHistory = history === '1'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: trades }, { data: allExchanges }] = await Promise.all([
    supabase
      .from('trades')
      .select('id, pair, base_currency, quote_currency, side, amount, price, fee, pnl, opened_at')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: true }),
    supabase
      .from('exchanges')
      .select('id, exchange_name, api_key_encrypted, api_secret_encrypted')
      .eq('user_id', user.id),
  ])

  const hasExchange = (allExchanges?.length ?? 0) > 0

  // Fetch live balances from all connected exchanges in parallel
  // Result: Map<base_symbol, { total: number; venues: string[] }>
  const mergedBalances = new Map<string, { total: number; venues: Set<string> }>()
  let anyBalanceError = false

  if (allExchanges && allExchanges.length > 0) {
    const balanceResults = await Promise.allSettled(
      allExchanges.map(async (ex) => {
        const apiKey = decrypt(ex.api_key_encrypted)
        const apiSecret = decrypt(ex.api_secret_encrypted)
        let rawBalances: Record<string, number>

        if (ex.exchange_name === 'kraken') {
          rawBalances = await cachedKrakenBalances(user.id, apiKey, apiSecret)
        } else if (BINANCE_VARIANTS.has(ex.exchange_name)) {
          rawBalances = await cachedBinanceBalances(user.id, ex.exchange_name as BinanceVariant, apiKey, apiSecret)
        } else if (ex.exchange_name === 'coinbase') {
          rawBalances = await cachedCoinbaseBalances(user.id, apiKey, apiSecret)
        } else {
          return
        }

        const displayName = EXCHANGE_DISPLAY[ex.exchange_name] ?? ex.exchange_name
        for (const [currency, amount] of Object.entries(rawBalances)) {
          if (amount <= 1e-8) continue
          const base = normalizeSymbol(currency)
          if (!mergedBalances.has(base)) {
            mergedBalances.set(base, { total: 0, venues: new Set() })
          }
          const entry = mergedBalances.get(base)!
          entry.total += amount
          entry.venues.add(displayName)
        }
      })
    )

    anyBalanceError = balanceResults.some((r) => r.status === 'rejected')
  }

  // Build stats from trade history.
  // Supabase returns NUMERIC columns as strings at runtime — coerce to numbers
  // before passing to computeAssetStats so that accumulator arithmetic doesn't
  // fall back to string concatenation and corrupt the average cost calculation.
  const normalizedTrades = (trades ?? []).map((t) => ({
    ...t,
    amount: Number(t.amount),
    price: Number(t.price),
    fee: Number(t.fee),
    pnl: t.pnl !== null ? Number(t.pnl) : null,
  }))
  const tradeStats = computeAssetStats(normalizedTrades)
  const tradeStatsMap = new Map(tradeStats.map((a) => [a.symbol, a]))

  // Collect every raw symbol from trade history and live balance
  const SKIP = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'KFEE'])
  const baseSymbols = new Set<string>([
    ...tradeStats.map((a) => a.symbol),
    ...mergedBalances.keys(),
  ])

  // Remove skipped symbols
  for (const s of SKIP) baseSymbols.delete(s)

  const baseSymbolList = Array.from(baseSymbols)

  // Fetch current prices for symbols with any live holding
  const basesWithHolding = baseSymbolList.filter(
    (base) => (mergedBalances.get(base)?.total ?? 0) > 1e-8
  )

  let prices: Map<string, number> = new Map()
  let priceFetchedAt: string | null = null
  if (basesWithHolding.length > 0) {
    try {
      prices = new Map(Object.entries(await cachedKrakenPrices(basesWithHolding)))
      if (prices.size > 0) {
        priceFetchedAt = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      }
    } catch {
      // Price fetch failed — portfolio % and current price will show "—"
    }
  }

  // Compute portfolio values
  const portfolioValues = new Map<string, number>()
  let totalPortfolioValue = 0
  for (const base of baseSymbolList) {
    const totalBalance = mergedBalances.get(base)?.total ?? 0
    const price = prices.get(base) ?? null
    if (totalBalance > 1e-8 && price !== null) {
      const value = totalBalance * price
      portfolioValues.set(base, value)
      totalPortfolioValue += value
    }
  }

  // Build one display row per base symbol
  const rows = baseSymbolList
    .map((base) => {
      const balEntry = mergedBalances.get(base)
      const totalLiveBalance = balEntry ? balEntry.total : null
      const venues = balEntry ? Array.from(balEntry.venues) : []
      const asset = tradeStatsMap.get(base) ?? emptyStats(base)
      return {
        symbol: base,
        asset,
        liveBalance: totalLiveBalance !== null && totalLiveBalance > 1e-8 ? totalLiveBalance : null,
        venues,
        portfolioPct:
          totalPortfolioValue > 0 && portfolioValues.has(base)
            ? (portfolioValues.get(base)! / totalPortfolioValue) * 100
            : null,
        portfolioValue: portfolioValues.get(base) ?? 0,
      }
    })
    .sort(
      (a, b) =>
        b.portfolioValue - a.portfolioValue ||
        Math.abs(b.asset.realizedPnl) - Math.abs(a.asset.realizedPnl)
    )

  const exitedCount = rows.filter((r) => (r.liveBalance ?? 0) <= 1e-8).length
  const visibleRows = showHistory ? rows : rows.filter((r) => (r.liveBalance ?? 0) > 1e-8)

  const totalRealizedPnl = tradeStats.reduce((s, a) => s + a.realizedPnl, 0)
  const totalFees = tradeStats.reduce((s, a) => s + a.totalFees, 0)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Assets</h1>
          <p className="text-sm mt-1" style={{ color: '#c2c6d6' }}>
            Holdings, cost basis &amp; performance · All-time
          </p>
          {anyBalanceError && hasExchange && (
            <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#f87171' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>warning</span>
              Some live balances unavailable — showing estimated holdings from trades.
            </p>
          )}
        </div>
        {exitedCount > 0 && (
          <Link
            href={showHistory ? '/dashboard/assets' : '/dashboard/assets?history=1'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors self-start md:self-auto"
            style={{
              backgroundColor: showHistory ? 'rgba(77,142,255,0.12)' : '#1b1f2c',
              border: `1px solid ${showHistory ? 'rgba(77,142,255,0.3)' : 'rgba(66,71,84,0.2)'}`,
              color: showHistory ? '#adc6ff' : '#8c909f',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
            {showHistory ? 'Hide exited positions' : `Show exited (${exitedCount})`}
          </Link>
        )}
      </div>

      {!hasExchange && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1b1f2c', border: '1px solid rgba(66,71,84,0.10)' }}
        >
          <span className="material-symbols-outlined text-4xl mb-4 block" style={{ color: '#424754' }}>extension</span>
          <p className="text-white font-semibold mb-1">No exchange connected</p>
          <p className="text-sm" style={{ color: '#8c909f' }}>Connect Kraken or Binance to start tracking your assets.</p>
        </div>
      )}

      {hasExchange && visibleRows.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1b1f2c', border: '1px solid rgba(66,71,84,0.10)' }}
        >
          <span className="material-symbols-outlined text-4xl mb-4 block" style={{ color: '#424754' }}>inbox</span>
          <p className="text-white font-semibold mb-1">No assets found</p>
          <p className="text-sm" style={{ color: '#8c909f' }}>Sync your exchange to import trades.</p>
        </div>
      )}

      {hasExchange && visibleRows.length > 0 && (
        <>
          <div className="grid px-5 mb-2" style={{ gridTemplateColumns: COLS }}>
            {['Asset', 'Holdings', 'Avg Cost', 'Current Price', 'Realized P&L', 'Win Rate', 'Fees Paid', 'Portfolio'].map((h) => (
              <p key={h} className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#424754' }}>
                {h}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {visibleRows.map(({ symbol, asset, liveBalance, venues, portfolioPct }) => (
              <Link key={symbol} href={`/dashboard/assets/${encodeURIComponent(symbol)}`} className="block group">
                <AssetRow
                  asset={asset}
                  liveBalance={liveBalance}
                  venues={venues}
                  portfolioPct={portfolioPct}
                  currentPrice={prices.get(symbol) ?? null}
                  priceFetchedAt={priceFetchedAt}
                />
              </Link>
            ))}
          </div>

          <div
            className="mt-6 rounded-xl px-5 py-4 flex items-center justify-between"
            style={{ backgroundColor: 'rgba(27,31,44,0.5)', border: '1px solid rgba(66,71,84,0.08)' }}
          >
            <div>
              <p className="text-sm" style={{ color: '#8c909f' }}>
                {visibleRows.length} asset{visibleRows.length !== 1 ? 's' : ''}
                {totalPortfolioValue > 0 && (
                  <span className="ml-3 font-medium text-white">${fmt(totalPortfolioValue)} portfolio value</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: '#8c909f' }}>Total Realized P&L</p>
                <span className="text-sm font-semibold tabular-nums" style={{ color: totalRealizedPnl >= 0 ? '#34d399' : '#f87171' }}>
                  {totalRealizedPnl >= 0 ? '+' : ''}${fmt(totalRealizedPnl)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: '#8c909f' }}>Total Fees</p>
                <span className="text-sm font-semibold tabular-nums" style={{ color: '#c2c6d6' }}>${fmt(totalFees)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
