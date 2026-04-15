import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeAssetStats, AssetStats } from '@/lib/pnl/assets'
import { fetchKrakenBalances, fetchKrakenPrices, krakenBaseSymbol } from '@/lib/ccxt/kraken'
import { decrypt } from '@/lib/crypto'

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
  portfolioPct,
  currentPrice,
  priceFetchedAt,
}: {
  asset: AssetStats
  liveBalance: number | null
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
            {hasTradeHistory
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

  const [{ data: trades }, { data: exchange }] = await Promise.all([
    supabase
      .from('trades')
      .select('id, pair, base_currency, quote_currency, side, amount, price, fee, pnl, opened_at')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: true }),
    supabase
      .from('exchanges')
      .select('id, exchange_name, api_key_encrypted, api_secret_encrypted')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
  ])

  const hasExchange = exchange !== null

  // Fetch live balances from Kraken
  let liveBalances: Map<string, number> | null = null
  let balanceError: string | null = null
  if (exchange?.exchange_name === 'kraken') {
    try {
      const apiKey = decrypt(exchange.api_key_encrypted)
      const apiSecret = decrypt(exchange.api_secret_encrypted)
      liveBalances = await fetchKrakenBalances(apiKey, apiSecret)
    } catch (err) {
      balanceError = err instanceof Error ? err.message : 'Unknown error'
      console.error('[assets] fetchKrakenBalances failed:', balanceError)
    }
  }

  // Build stats from trade history
  const tradeStats = computeAssetStats(trades ?? [])
  // Index trade stats by both their exact symbol AND their base symbol
  const tradeStatsMap = new Map(tradeStats.map((a) => [a.symbol, a]))

  // Collect every raw symbol from trade history and live balance
  const SKIP = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'KFEE'])
  const rawSymbols = new Set([
    ...tradeStats.map((a) => a.symbol),
    ...(liveBalances ? liveBalances.keys() : []),
  ])

  // Group raw symbols by their base symbol (merges SOL + SOL03.S → SOL)
  const groups = new Map<string, string[]>() // base → [raw symbols]
  for (const s of rawSymbols) {
    if (SKIP.has(s)) continue
    const base = krakenBaseSymbol(s)
    if (!groups.has(base)) groups.set(base, [])
    groups.get(base)!.push(s)
  }

  const baseSymbols = Array.from(groups.keys())

  // Fetch current prices for base symbols that have any holding
  const basesWithHolding = baseSymbols.filter((base) => {
    const variants = groups.get(base)!
    return variants.some((s) => (liveBalances?.get(s) ?? 0) > 1e-8)
  })

  let prices: Map<string, number> = new Map()
  let priceFetchedAt: string | null = null
  if (basesWithHolding.length > 0) {
    try {
      prices = await fetchKrakenPrices(basesWithHolding)
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

  // Compute portfolio values using merged balances
  const portfolioValues = new Map<string, number>()
  let totalPortfolioValue = 0
  for (const base of baseSymbols) {
    const totalBalance = (groups.get(base) ?? []).reduce(
      (sum, s) => sum + (liveBalances?.get(s) ?? 0),
      0
    )
    const price = prices.get(base) ?? null
    if (totalBalance > 1e-8 && price !== null) {
      const value = totalBalance * price
      portfolioValues.set(base, value)
      totalPortfolioValue += value
    }
  }

  // Build one display row per base symbol
  const rows = baseSymbols
    .map((base) => {
      const variants = groups.get(base)!
      // Sum live balances across all variants (SOL + SOL03.S)
      const totalLiveBalance = liveBalances
        ? variants.reduce((sum, s) => sum + (liveBalances.get(s) ?? 0), 0)
        : null
      // Use trade stats from the canonical (non-staking) variant if available
      const asset =
        tradeStatsMap.get(base) ??
        variants.map((s) => tradeStatsMap.get(s)).find(Boolean) ??
        emptyStats(base)
      return {
        symbol: base,
        asset,
        liveBalance: totalLiveBalance !== null && totalLiveBalance > 1e-8 ? totalLiveBalance : null,
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
          {liveBalances === null && hasExchange && (
            <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#f87171' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>warning</span>
              Live balance unavailable — showing estimated holdings from trades.
              {balanceError && <span style={{ color: '#6b7280' }}> ({balanceError})</span>}
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
          <p className="text-sm" style={{ color: '#8c909f' }}>Connect your Kraken account to start tracking your assets.</p>
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
          {/* Column headers */}
          <div className="grid px-5 mb-2" style={{ gridTemplateColumns: COLS }}>
            {['Asset', 'Holdings', 'Avg Cost', 'Current Price', 'Realized P&L', 'Win Rate', 'Fees Paid', 'Portfolio'].map((h) => (
              <p key={h} className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#424754' }}>
                {h}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {visibleRows.map(({ symbol, asset, liveBalance, portfolioPct }) => (
              <Link key={symbol} href={`/dashboard/assets/${encodeURIComponent(symbol)}`} className="block group">
                <AssetRow
                  asset={asset}
                  liveBalance={liveBalance}
                  portfolioPct={portfolioPct}
                  currentPrice={prices.get(symbol) ?? null}
                  priceFetchedAt={priceFetchedAt}
                />
              </Link>
            ))}
          </div>

          {/* Footer */}
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
