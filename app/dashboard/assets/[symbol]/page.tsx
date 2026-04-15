import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeAssetStats } from '@/lib/pnl/assets'
import { fetchKrakenBalances, fetchKrakenPrices, krakenBaseSymbol } from '@/lib/ccxt/kraken'
import { fetchBinanceBalances, binanceBaseSymbol, type BinanceVariant } from '@/lib/ccxt/binance'
import { decrypt } from '@/lib/crypto'
import { TradesTable, TradeTableRow } from '@/components/trades/TradesTable'
import { TradeSimulator } from '@/components/assets/TradeSimulator'

const BINANCE_VARIANTS = new Set<string>(['binance', 'binanceus', 'binanceusdm'])

const EXCHANGE_DISPLAY: Record<string, string> = {
  kraken: 'Kraken',
  binance: 'Binance',
  binanceus: 'Binance US',
  binanceusdm: 'Binance Futures',
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function normalizeSymbol(symbol: string): string {
  const krNorm = krakenBaseSymbol(symbol)
  if (krNorm !== symbol) return krNorm
  return binanceBaseSymbol(symbol)
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

  // Fetch all trades for this asset (including staking variants)
  const { data: allTrades } = await supabase
    .from('trades')
    .select('id, pair, base_currency, quote_currency, side, amount, price, fee, pnl, opened_at')
    .eq('user_id', user.id)
    .order('opened_at', { ascending: true })

  // Filter trades where the base symbol (after normalization) matches
  const filteredTrades = (allTrades ?? []).filter(
    (t) => normalizeSymbol(t.base_currency) === decodedSymbol
  )

  if (filteredTrades.length === 0) {
    const { data: exchanges } = await supabase.from('exchanges').select('id').eq('user_id', user.id).limit(1)
    if (!exchanges?.length) redirect('/dashboard/assets')
    notFound()
  }

  const allStats = computeAssetStats(filteredTrades)
  const asset = allStats.find((a) => a.symbol === decodedSymbol) ?? allStats[0]
  if (!asset) notFound()

  // Fetch all exchanges for multi-exchange live balances
  const { data: allExchanges } = await supabase
    .from('exchanges')
    .select('id, exchange_name, api_key_encrypted, api_secret_encrypted')
    .eq('user_id', user.id)

  // Per-exchange balance for this symbol + merged total
  const perExchangeBalances: { exchangeName: string; displayName: string; balance: number }[] = []
  let totalLiveBalance = 0
  let currentPrice: number | null = null

  if (allExchanges && allExchanges.length > 0) {
    const balanceResults = await Promise.allSettled(
      allExchanges.map(async (ex) => {
        const apiKey = decrypt(ex.api_key_encrypted)
        const apiSecret = decrypt(ex.api_secret_encrypted)
        let rawBalances: Map<string, number>

        if (ex.exchange_name === 'kraken') {
          rawBalances = await fetchKrakenBalances(apiKey, apiSecret)
        } else if (BINANCE_VARIANTS.has(ex.exchange_name)) {
          rawBalances = await fetchBinanceBalances(ex.exchange_name as BinanceVariant, apiKey, apiSecret)
        } else {
          return { exchangeName: ex.exchange_name, balance: 0 }
        }

        let total = 0
        for (const [currency, amount] of rawBalances.entries()) {
          if (normalizeSymbol(currency) === decodedSymbol) total += amount
        }

        return { exchangeName: ex.exchange_name, balance: total }
      })
    )

    for (const result of balanceResults) {
      if (result.status === 'fulfilled' && result.value && result.value.balance > 1e-8) {
        perExchangeBalances.push({
          exchangeName: result.value.exchangeName,
          displayName: EXCHANGE_DISPLAY[result.value.exchangeName] ?? result.value.exchangeName,
          balance: result.value.balance,
        })
        totalLiveBalance += result.value.balance
      }
    }

    // Fetch price (Kraken public API — no auth required, works for any asset)
    try {
      const priceMap = await fetchKrakenPrices([decodedSymbol])
      currentPrice = priceMap.get(decodedSymbol) ?? null
    } catch {
      // Continue without price
    }
  }

  const liveBalance = totalLiveBalance > 1e-8 ? totalLiveBalance : null
  const holdings = liveBalance ?? asset.holdings

  const tableRows: TradeTableRow[] = [...filteredTrades]
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
              {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''} · {asset.quoteCurrency}
              {perExchangeBalances.length > 0 && (
                <span> · Held on: {perExchangeBalances.map((e) => e.displayName).join(', ')}</span>
              )}
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

      {/* Per-exchange breakdown — only shown when holding on 2+ exchanges */}
      {perExchangeBalances.length > 1 && (
        <div className="mb-8 rounded-xl p-5" style={{ backgroundColor: '#1b1f2c', border: '1px solid rgba(66,71,84,0.12)' }}>
          <h3 className="text-sm font-semibold text-white mb-4">Holdings by Exchange</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {perExchangeBalances.map((ex) => (
              <div
                key={ex.exchangeName}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#131720', border: '1px solid rgba(66,71,84,0.10)' }}
              >
                <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#8c909f' }}>
                  {ex.displayName}
                </p>
                <p className="text-white font-semibold tabular-nums">
                  {ex.balance.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                </p>
                {totalLiveBalance > 0 && (
                  <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>
                    {fmt((ex.balance / totalLiveBalance) * 100, 1)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade Simulator */}
      {holdings > 0 && (
        <div className="mb-8">
          <TradeSimulator
            trades={filteredTrades}
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
