export interface TradeRow {
  id: string
  pair: string
  base_currency: string
  quote_currency: string
  side: 'buy' | 'sell'
  amount: number
  price: number
  fee: number
  pnl: number | null
  opened_at: string
}

export interface DashboardStats {
  totalPnl: number
  winRate: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  avgWin: number
  avgLoss: number
  bestToken: { symbol: string; pnl: number } | null
  worstToken: { symbol: string; pnl: number } | null
  pnlByDayOfWeek: Record<string, number>
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number }
  totalFees: number
  cumulativePnlByDate: { date: string; pnl: number }[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function computeStats(trades: TradeRow[]): DashboardStats {
  // Only sell trades have realized P&L
  const closedTrades = trades.filter((t) => t.side === 'sell' && t.pnl !== null)
  const pnlValues = closedTrades.map((t) => t.pnl as number)

  const totalPnl = pnlValues.reduce((sum, p) => sum + p, 0)
  const wins = pnlValues.filter((p) => p > 0)
  const losses = pnlValues.filter((p) => p < 0)

  const winRate = pnlValues.length > 0 ? wins.length / pnlValues.length : 0
  const avgWin = wins.length > 0 ? wins.reduce((s, p) => s + p, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? losses.reduce((s, p) => s + p, 0) / losses.length : 0

  // Total fees across all trades
  const totalFees = trades.reduce((sum, t) => sum + t.fee, 0)

  // P&L per token (base_currency)
  const tokenPnl = new Map<string, number>()
  for (const t of closedTrades) {
    tokenPnl.set(t.base_currency, (tokenPnl.get(t.base_currency) ?? 0) + (t.pnl as number))
  }

  let bestToken: { symbol: string; pnl: number } | null = null
  let worstToken: { symbol: string; pnl: number } | null = null
  for (const [symbol, pnl] of tokenPnl.entries()) {
    if (!bestToken || pnl > bestToken.pnl) bestToken = { symbol, pnl }
    if (!worstToken || pnl < worstToken.pnl) worstToken = { symbol, pnl }
  }

  // P&L by day of week
  const pnlByDayOfWeek: Record<string, number> = {}
  for (const day of DAYS) pnlByDayOfWeek[day] = 0
  for (const t of closedTrades) {
    const day = DAYS[new Date(t.opened_at).getDay()]
    pnlByDayOfWeek[day] += t.pnl as number
  }

  // Current streak — sorted by date desc, look at consecutive same-sign P&L
  const sorted = [...closedTrades].sort(
    (a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
  )
  let currentStreak: DashboardStats['currentStreak'] = { type: 'none', count: 0 }
  if (sorted.length > 0) {
    const first = sorted[0].pnl as number
    const streakType = first > 0 ? 'win' : 'loss'
    let count = 0
    for (const t of sorted) {
      const p = t.pnl as number
      if ((streakType === 'win' && p > 0) || (streakType === 'loss' && p <= 0)) {
        count++
      } else {
        break
      }
    }
    currentStreak = { type: streakType, count }
  }

  // Cumulative P&L by date (for line chart)
  const dailyPnl = new Map<string, number>()
  for (const t of closedTrades) {
    const date = t.opened_at.slice(0, 10) // YYYY-MM-DD
    dailyPnl.set(date, (dailyPnl.get(date) ?? 0) + (t.pnl as number))
  }
  const sortedDates = Array.from(dailyPnl.keys()).sort()
  let cumulative = 0
  const cumulativePnlByDate = sortedDates.map((date) => {
    cumulative += dailyPnl.get(date)!
    return { date, pnl: Math.round(cumulative * 100) / 100 }
  })

  return {
    totalPnl: Math.round(totalPnl * 100) / 100,
    winRate,
    totalTrades: closedTrades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    bestToken,
    worstToken,
    pnlByDayOfWeek,
    currentStreak,
    totalFees: Math.round(totalFees * 100) / 100,
    cumulativePnlByDate,
  }
}
