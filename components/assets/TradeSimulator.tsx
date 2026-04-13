'use client'

import { useState, useMemo } from 'react'
import { computePnlFifo, TradeForPnl } from '@/lib/pnl/fifo'
import { AssetStats } from '@/lib/pnl/assets'
import { TradeRow } from '@/lib/pnl/stats'

// ─── types ───────────────────────────────────────────────────────────────────

interface Props {
  trades: TradeRow[]        // sorted asc by opened_at
  asset: AssetStats
  currentPrice: number | null
  liveBalance: number | null
}

interface SimResult {
  side: 'buy' | 'sell'
  // sell-specific
  tradePnl: number | null
  totalPnl: number | null
  // buy-specific
  cost: number | null
  // common
  newHoldings: number
  newAvgCost: number | null
  newBreakEven: number | null  // sell price to reach total P&L = 0 after this trade
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function fmtPrice(n: number) {
  return fmt(n, n < 1 ? 6 : 2)
}
function fmtAmount(n: number) {
  if (n <= 0) return '0'
  if (n < 0.0001) return n.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })
  if (n < 1) return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

/**
 * Replays FIFO over trades (sorted asc) and returns remaining open lots.
 * Used to compute new avg cost after a simulated trade.
 */
function replayFifo(trades: TradeForPnl[]): { amount: number; price: number }[] {
  const queue: { amount: number; price: number }[] = []
  for (const t of trades) {
    if (t.side === 'buy') {
      queue.push({ amount: t.amount, price: t.price })
    } else {
      let remaining = t.amount
      while (remaining > 0 && queue.length > 0) {
        const lot = queue[0]
        const consumed = Math.min(lot.amount, remaining)
        lot.amount -= consumed
        remaining -= consumed
        if (lot.amount <= 1e-12) queue.shift()
      }
    }
  }
  return queue
}

function simulate(
  trades: TradeRow[],
  asset: AssetStats,
  holdings: number,
  side: 'buy' | 'sell',
  amount: number,
  price: number,
  fee: number
): SimResult | null {
  if (amount <= 0 || price <= 0) return null

  const asTradeForPnl: TradeForPnl[] = trades.map((t) => ({
    external_id: t.id,
    pair: t.pair,
    base_currency: t.base_currency,
    quote_currency: t.quote_currency,
    side: t.side,
    amount: Number(t.amount),
    price: Number(t.price),
    fee: Number(t.fee),
    opened_at: new Date(t.opened_at),
  }))

  const hypothetical: TradeForPnl = {
    external_id: '__sim__',
    pair: `${asset.symbol}/${asset.quoteCurrency}`,
    base_currency: asset.symbol,
    quote_currency: asset.quoteCurrency,
    side,
    amount,
    price,
    fee,
    opened_at: new Date(), // after all existing trades
  }

  const combined = [...asTradeForPnl, hypothetical]

  // Compute new avg cost by replaying FIFO lots after the simulated trade
  const remainingLots = replayFifo(combined)
  let newHoldings = 0
  let weightedCostSum = 0
  for (const lot of remainingLots) {
    newHoldings += lot.amount
    weightedCostSum += lot.amount * lot.price
  }
  newHoldings = Math.round(newHoldings * 1e8) / 1e8
  const newAvgCost = newHoldings > 1e-12 ? weightedCostSum / newHoldings : null

  if (side === 'buy') {
    // Buys don't realize P&L — only cost basis changes
    const totalRealizedPnl = asset.realizedPnl  // unchanged
    // Break-even: price to sell all new holdings to reach total P&L = 0
    const newBreakEven =
      newHoldings > 1e-12 && newAvgCost !== null
        ? newAvgCost - totalRealizedPnl / newHoldings
        : null

    return {
      side: 'buy',
      tradePnl: null,
      totalPnl: null,
      cost: amount * price + fee,
      newHoldings,
      newAvgCost,
      newBreakEven,
    }
  }

  // SELL — compute P&L via FIFO
  const withPnl = computePnlFifo(combined)
  const simTrade = withPnl[withPnl.length - 1]
  if (simTrade.pnl === null) return null

  const tradePnl = simTrade.pnl
  const totalPnl = asset.realizedPnl + tradePnl

  // Break-even after sell: price to sell remaining holdings to bring total P&L to 0
  const newBreakEven =
    newHoldings > 1e-12 && newAvgCost !== null
      ? newAvgCost - totalPnl / newHoldings
      : null

  return {
    side: 'sell',
    tradePnl,
    totalPnl,
    cost: null,
    newHoldings,
    newAvgCost,
    newBreakEven,
  }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Row({
  label,
  value,
  valueColor,
  dimmed = false,
  bold = false,
}: {
  label: string
  value: string
  valueColor?: string
  dimmed?: boolean
  bold?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: '1px solid rgba(66,71,84,0.12)' }}
    >
      <span className="text-sm" style={{ color: dimmed ? '#424754' : '#8c909f' }}>{label}</span>
      <span
        className={`text-sm tabular-nums ${bold ? 'font-bold' : 'font-semibold'}`}
        style={{ color: valueColor ?? '#c2c6d6' }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function TradeSimulator({ trades, asset, currentPrice, liveBalance }: Props) {
  const holdings = liveBalance ?? asset.holdings

  const [side, setSide] = useState<'buy' | 'sell'>('sell')
  const [amountStr, setAmountStr] = useState(holdings > 0 ? String(holdings) : '')
  const [priceStr, setPriceStr] = useState(currentPrice != null ? String(currentPrice) : '')
  const [feeStr, setFeeStr] = useState('0')

  // Reset amount when switching sides
  function handleSideChange(newSide: 'buy' | 'sell') {
    setSide(newSide)
    if (newSide === 'sell') setAmountStr(holdings > 0 ? String(holdings) : '')
    else setAmountStr('')
  }

  const amount = parseFloat(amountStr) || 0
  const price = parseFloat(priceStr) || 0
  const fee = parseFloat(feeStr) || 0

  const result = useMemo(
    () => simulate(trades, asset, holdings, side, amount, price, fee),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trades, asset, holdings, side, amount, price, fee]
  )

  // Current break-even (before simulation) — shown in header only when holding & P&L negative
  const currentBreakEven =
    asset.realizedPnl < 0 && holdings > 1e-8 && asset.avgCost !== null
      ? asset.avgCost - asset.realizedPnl / holdings
      : null

  const totalPnlColor = (pnl: number) =>
    pnl > 0 ? '#34d399' : pnl < 0 ? '#f87171' : '#c2c6d6'

  const isSell = side === 'sell'
  const accentColor = isSell ? '#f87171' : '#34d399'
  const accentBg = isSell ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)'
  const accentBorder = isSell ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: '#1b1f2c', border: '1px solid rgba(66,71,84,0.12)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Trade Simulator</h3>
          <p className="text-sm mt-0.5" style={{ color: '#8c909f' }}>
            Model a hypothetical trade and see your resulting P&amp;L &amp; avg cost
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentBreakEven !== null && (
            <div
              className="text-right px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}
            >
              <p className="text-[10px] uppercase tracking-wider font-medium mb-0.5" style={{ color: '#fbbf24' }}>
                Current break-even
              </p>
              <p className="text-sm font-bold tabular-nums" style={{ color: '#fbbf24' }}>
                ${fmtPrice(currentBreakEven)}
              </p>
            </div>
          )}
          {/* BUY / SELL toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(66,71,84,0.3)' }}>
            {(['buy', 'sell'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleSideChange(s)}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
                style={{
                  backgroundColor: side === s ? (s === 'buy' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)') : 'transparent',
                  color: side === s ? (s === 'buy' ? '#34d399' : '#f87171') : '#424754',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#8c909f' }}>
            {isSell ? 'Sell' : 'Buy'} Amount ({asset.symbol})
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg px-3 py-2 text-sm text-white tabular-nums outline-none"
              style={{ backgroundColor: '#262a37', border: `1px solid ${amountStr ? accentBorder : 'rgba(66,71,84,0.3)'}` }}
            />
            {isSell && holdings > 0 && (
              <button
                onClick={() => setAmountStr(String(holdings))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(77,142,255,0.15)', color: '#4d8eff' }}
              >
                MAX
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#8c909f' }}>
            {isSell ? 'Sell' : 'Buy'} Price ({asset.quoteCurrency})
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg px-3 py-2 text-sm text-white tabular-nums outline-none"
            style={{ backgroundColor: '#262a37', border: `1px solid ${priceStr ? accentBorder : 'rgba(66,71,84,0.3)'}` }}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#8c909f' }}>
            Fee ({asset.quoteCurrency})
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={feeStr}
            onChange={(e) => setFeeStr(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg px-3 py-2 text-sm text-white tabular-nums outline-none"
            style={{ backgroundColor: '#262a37', border: '1px solid rgba(66,71,84,0.3)' }}
          />
        </div>
      </div>

      {/* Result panel */}
      {result === null ? (
        <div
          className="rounded-lg px-4 py-8 text-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(66,71,84,0.08)' }}
        >
          <p className="text-sm" style={{ color: '#424754' }}>Enter an amount and price to simulate</p>
        </div>
      ) : (
        <div
          className="rounded-lg px-4 pt-1 pb-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${accentBorder}` }}
        >
          {/* Trade details */}
          {result.side === 'sell' && result.tradePnl !== null && (
            <>
              <Row label="Revenue" value={`$${fmt(amount * price)}`} />
              {fee > 0 && <Row label="Sell Fee" value={`-$${fmt(fee)}`} />}
              <Row
                label="This Trade P&L"
                value={`${result.tradePnl >= 0 ? '+' : ''}$${fmt(result.tradePnl)}`}
                valueColor={totalPnlColor(result.tradePnl)}
              />
            </>
          )}
          {result.side === 'buy' && result.cost !== null && (
            <>
              <Row label="Total Cost" value={`$${fmt(result.cost)}`} />
              {fee > 0 && <Row label="Buy Fee" value={`-$${fmt(fee)}`} dimmed />}
            </>
          )}

          {/* New position state */}
          <Row
            label="New Holdings"
            value={result.newHoldings > 1e-8 ? `${fmtAmount(result.newHoldings)} ${asset.symbol}` : 'Fully exited'}
            valueColor={result.newHoldings > 1e-8 ? '#dfe2f3' : '#8c909f'}
          />
          <Row
            label="New Avg Cost"
            value={result.newAvgCost !== null ? `$${fmtPrice(result.newAvgCost)}` : '—'}
            valueColor={
              result.newAvgCost !== null && asset.avgCost !== null
                ? result.newAvgCost < asset.avgCost
                  ? '#34d399'   // cost went down (good)
                  : result.newAvgCost > asset.avgCost
                  ? '#f87171'   // cost went up
                  : '#c2c6d6'
                : '#424754'
            }
          />
          {result.newAvgCost !== null && asset.avgCost !== null && (
            <Row
              label="Avg Cost Change"
              value={`${result.newAvgCost <= asset.avgCost ? '' : '+'}$${fmtPrice(result.newAvgCost - asset.avgCost)}`}
              valueColor={result.newAvgCost <= asset.avgCost ? '#34d399' : '#f87171'}
              dimmed
            />
          )}

          {/* P&L summary (sell only) */}
          {result.side === 'sell' && result.totalPnl !== null && (
            <>
              <Row
                label="Existing Realized P&L"
                value={`${asset.realizedPnl >= 0 ? '+' : ''}$${fmt(asset.realizedPnl)}`}
                dimmed
              />
              <div className="flex items-center justify-between pt-3 mt-1">
                <span className="text-sm font-semibold" style={{ color: '#dfe2f3' }}>Total P&L after trade</span>
                <span className="text-xl font-bold tabular-nums" style={{ color: totalPnlColor(result.totalPnl) }}>
                  {result.totalPnl >= 0 ? '+' : ''}${fmt(result.totalPnl)}
                </span>
              </div>
              {result.totalPnl > 0 && asset.realizedPnl <= 0 && (
                <p className="text-xs mt-1.5 text-center" style={{ color: '#34d399' }}>
                  This trade would bring you into profit ↑
                </p>
              )}
            </>
          )}

          {/* Buy: show unchanged realized P&L */}
          {result.side === 'buy' && (
            <Row
              label="Realized P&L (unchanged)"
              value={`${asset.realizedPnl >= 0 ? '+' : ''}$${fmt(asset.realizedPnl)}`}
              valueColor={totalPnlColor(asset.realizedPnl)}
              dimmed
            />
          )}

          {/* New break-even */}
          {result.newBreakEven !== null && result.newHoldings > 1e-8 && (
            <div
              className="flex items-center justify-between mt-3 pt-3 rounded-lg px-3 py-2"
              style={{ backgroundColor: accentBg, border: `1px solid ${accentBorder}` }}
            >
              <span className="text-xs font-medium" style={{ color: accentColor }}>
                Break-even after this trade (sell all)
              </span>
              <span className="text-sm font-bold tabular-nums" style={{ color: accentColor }}>
                ${fmtPrice(result.newBreakEven)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
