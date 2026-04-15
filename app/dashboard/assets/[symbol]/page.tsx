import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeAssetStats } from '@/lib/pnl/assets'
import { fetchKrakenBalances, fetchKrakenPrices, krakenBaseSymbol } from '@/lib/ccxt/kraken'
import { decrypt } from '@/lib/crypto'
import { TradesTable, TradeTableRow } from '@/components/trades/TradesTable'
import { TradeSimulator } from '@/components/assets/TradeSimulator'

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: '#1b1f2c', border: '1px solid rgba(66,71,84,0.12)' }}>
      <p className="text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#8c909f' }}>{label}</p>
      {children}
    </div>
  )
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Fetch all trades for this asset (and staking variants, e.g. SOL + SOL.S both have base_currency starting with symbol)
  // We filter: krakenBaseSymbol(base_currency) === decodedSymbol
  // Supabase can't run JS, so fetch all and filter client-side — but for correctness, use LIKE or fetch all for user
  // Simplest safe approach: fetch all trades for user for this base_currency
  const { data: trades } = await supabase
    .from('trades')
    .select('id, pair, base_currency, quote_currency, side, amount, price, fee, pnl, opened_at')
    .eq('user_id', user.id)
    .eq('base_currency', decodedSymbol)
    .order('opened_at', { ascending: true })

  // Also fetch staking variants (e.g. SOL.S, ETH2.S) that map to the same base symbol
  const { data: allTrades } = await supabase
    .from('trades')
    .select('id, pair, base_currency, quote_currency, side, amount, price, fee, pnl, opened_at')
    .eq('user_id', user.id)
    .order('opened_at', { ascending: true })

  // Filter to only trades where krakenBaseSymbol(base_currency) === decodedSymbol
  const filteredTrades = (allTrades ?? []).filter(
    (t) => krakenBaseSymbol(t.base_currency) === decodedSymbol
  )

  if (filteredTrades.length === 0 && (trades ?? []).length === 0) {
    // Check if user has any exchange at all before 404ing
    const { data: exchanges } = await supabase.from('exchanges').select('id').eq('user_id', user.id).limit(1)
    if (!exchanges?.length) redirect('/dashboard/assets')
    notFound()
  }

  const mergedTrades = filteredTrades.length > 0 ? filteredTrades : (trades ?? [])

  // Compute asset stats
  const allStats = computeAssetStats(mergedTrades)
  const asset = allStats.find((a) => a.symbol === decodedSymbol) ?? allStats[0]

  if (!asset) notFound()

  // Fetch exchange for live balance + price
  const { data: exchange } = await supabase
    .from('exchanges')
    .select('id, exchange_name, api_key_encrypted, api_secret_encrypted')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  let liveBalance: number | null = null
  let currentPrice: number | null = null

  if (exchange?.exchange_name === 'kraken') {
    try {
      const apiKey = decrypt(exchange.api_key_encrypted)
      const apiSecret = decrypt(exchange.api_secret_encrypted)

      const [balances, prices] = await Promise.all([
        fetchKrakenBalances(apiKey, apiSecret),
        fetchKrakenPrices([decodedSymbol]),
      ])

      // Sum all staking variants into live balance
      let total = 0
      for (const [currency, amount] of balances.entries()) {
        if (krakenBaseSymbol(currency) === decodedSymbol) total += amount
      }
      liveBalance = total > 1e-8 ? total : null
      currentPrice = prices.get(decodedSymbol) ?? null
    } catch {
      // Continue without live data
    }
  }

  const holdings = liveBalance ?? asset.holdings

  // Map trades for the TradesTable component (show all, latest first)
  const tableRows: TradeTableRow[] = [...mergedTrades]
    .sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime())
    .map((t) => ({
      id: t.id,
      pair: t.pair,
      side: t.side,
      amount: Number(t.amount),
      price: Number(t.price),
      fee: Number(t.fee),
      pnl: t.pnl !== null ? Number(t.pnl) : null,
      opened_at: t.opened_at,
    }))

  const realizedPnlColor = asset.realizedPnl >= 0 ? '#34d399' : '#f87171'
  const winPct = Math.round(asset.winRate * 100)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/assets"
          className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{ color: '#8c909f' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Assets
        </Link>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: '#262a37', color: '#adc6ff' }}
          >
            {decodedSymbol.slice(0, 3)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{decodedSymbol}</h1>
            <p className="text-sm mt-0.5" style={{ color: '#8c909f' }}>
              {mergedTrades.length} trade{mergedTrades.length !== 1 ? 's' : ''} · {asset.quoteCurrency}
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatCard label="Holdings">
          <p className="text-white font-semibold text-lg tabular-nums">
            {holdings > 0
              ? holdings.toLocaleString('en-US', { maximumFractionDigits: 6 })
              : '—'}
          </p>
          {liveBalance !== null && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded mt-1 inline-block"
              style={{ backgroundColor: 'rgba(0,165,114,0.15)', color: '#00a572' }}>live</span>
          )}
        </StatCard>

        <StatCard label="Avg Cost">
          {asset.avgCost !== null ? (
            <p className="text-white font-semibold text-lg tabular-nums">
              ${fmt(asset.avgCost, asset.avgCost < 1 ? 6 : 2)}
            </p>
          ) : (
            <p style={{ color: '#424754' }}>—</p>
          )}
        </StatCard>

        <StatCard label="Current Price">
          {currentPrice !== null ? (
            <p className="text-white font-semibold text-lg tabular-nums">
              ${fmt(currentPrice, currentPrice < 1 ? 6 : 2)}
            </p>
          ) : (
            <p style={{ color: '#424754' }}>—</p>
          )}
        </StatCard>

        <StatCard label="Realized P&L">
          {asset.winningTrades + asset.losingTrades > 0 ? (
            <p className="font-semibold text-lg tabular-nums" style={{ color: realizedPnlColor }}>
              {asset.realizedPnl >= 0 ? '+' : ''}${fmt(asset.realizedPnl)}
            </p>
          ) : (
            <p className="text-sm" style={{ color: '#424754' }}>No sells yet</p>
          )}
        </StatCard>

        <StatCard label="Win Rate">
          {asset.winningTrades + asset.losingTrades > 0 ? (
            <div>
              <p className="font-semibold text-lg tabular-nums" style={{
                color: winPct >= 60 ? '#34d399' : winPct >= 40 ? '#fbbf24' : '#f87171'
              }}>
                {winPct}%
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#424754' }}>
                {asset.winningTrades}W · {asset.losingTrades}L
              </p>
            </div>
          ) : (
            <p style={{ color: '#424754' }}>—</p>
          )}
        </StatCard>
      </div>

      {/* Trade Simulator */}
      {holdings > 0 && (
        <div className="mb-8">
          <TradeSimulator
            trades={mergedTrades}
            asset={asset}
            currentPrice={currentPrice}
            liveBalance={liveBalance}
          />
        </div>
      )}

      {/* Trade History */}
      <div className="rounded-xl p-6" style={{ backgroundColor: '#1b1f2c', border: '1px solid rgba(66,71,84,0.12)' }}>
        <h3 className="text-lg font-semibold text-white mb-6">Trade History</h3>
        <TradesTable trades={tableRows} />
      </div>
    </div>
  )
}
