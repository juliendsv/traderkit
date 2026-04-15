import { TradeRow } from './stats'

export interface AssetStats {
  symbol: string
  quoteCurrency: string
  /** Remaining units still held (buys - sells) */
  holdings: number
  /** Weighted average cost of remaining lots */
  avgCost: number | null
  /** Sum of realized P&L across all closed trades for this asset */
  realizedPnl: number
  /** Total number of trades (buys + sells) */
  totalTrades: number
  /** Number of sell trades with pnl > 0 */
  winningTrades: number
  /** Number of sell trades with pnl <= 0 */
  losingTrades: number
  /** Win rate among closed trades (0–1) */
  winRate: number
  /** Sum of all fees paid for this asset */
  totalFees: number
}

interface Lot {
  amount: number
  price: number
}

/**
 * Computes per-asset statistics from a full trade history.
 *
 * Replays the FIFO queue per asset to determine remaining open lots,
 * then derives average cost basis from those lots.
 *
 * Input trades must be sorted ascending by opened_at for correct FIFO ordering.
 */
export function computeAssetStats(trades: TradeRow[]): AssetStats[] {
  // Group trades by base_currency
  const byAsset = new Map<string, TradeRow[]>()
  for (const t of trades) {
    if (!byAsset.has(t.base_currency)) byAsset.set(t.base_currency, [])
    byAsset.get(t.base_currency)!.push(t)
  }

  const results: AssetStats[] = []

  for (const [symbol, assetTrades] of byAsset.entries()) {
    // Determine quote currency from first trade
    const quoteCurrency = assetTrades[0].quote_currency

    // Replay FIFO to find remaining lots
    const queue: Lot[] = []
    let realizedPnl = 0
    let totalFees = 0
    let winningTrades = 0
    let losingTrades = 0

    for (const t of assetTrades) {
      totalFees += t.fee

      if (t.side === 'buy') {
        queue.push({ amount: t.amount, price: t.price })
      } else {
        // SELL — consume lots in FIFO order
        let remaining = t.amount
        while (remaining > 0 && queue.length > 0) {
          const lot = queue[0]
          const consumed = Math.min(lot.amount, remaining)
          lot.amount -= consumed
          remaining -= consumed
          if (lot.amount <= 1e-12) queue.shift()
        }

        if (t.pnl !== null) {
          realizedPnl += t.pnl
          if (t.pnl > 0) winningTrades++
          else losingTrades++
        }
      }
    }

    // Compute holdings and average cost from remaining lots
    let totalHoldings = 0
    let weightedCostSum = 0
    for (const lot of queue) {
      totalHoldings += lot.amount
      weightedCostSum += lot.amount * lot.price
    }

    const holdings = Math.round(totalHoldings * 1e8) / 1e8
    const avgCost =
      holdings > 1e-12
        ? Math.round((weightedCostSum / totalHoldings) * 1e8) / 1e8
        : null

    const closedCount = winningTrades + losingTrades
    const winRate = closedCount > 0 ? winningTrades / closedCount : 0

    results.push({
      symbol,
      quoteCurrency,
      holdings,
      avgCost,
      realizedPnl: Math.round(realizedPnl * 100) / 100,
      totalTrades: assetTrades.length,
      winningTrades,
      losingTrades,
      winRate,
      totalFees: Math.round(totalFees * 100) / 100,
    })
  }

  // Sort by absolute realized P&L descending so top performers come first
  results.sort((a, b) => Math.abs(b.realizedPnl) - Math.abs(a.realizedPnl))

  return results
}
