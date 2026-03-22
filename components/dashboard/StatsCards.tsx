import { DashboardStats } from '@/lib/pnl/stats'

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, ...opts }).format(n)
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const { totalPnl, winRate, totalTrades, avgWin, avgLoss, totalFees, currentStreak } = stats

  const cards = [
    {
      label: 'Total P&L',
      value: fmt(totalPnl),
      sub: `${totalTrades} closed trades`,
      positive: totalPnl >= 0,
      highlight: true,
    },
    {
      label: 'Win Rate',
      value: pct(winRate),
      sub: `${stats.winningTrades}W / ${stats.losingTrades}L`,
      positive: winRate >= 0.5,
    },
    {
      label: 'Avg Win',
      value: fmt(avgWin),
      sub: 'per winning trade',
      positive: true,
    },
    {
      label: 'Avg Loss',
      value: fmt(Math.abs(avgLoss)),
      sub: 'per losing trade',
      positive: false,
    },
    {
      label: 'Total Fees',
      value: fmt(totalFees),
      sub: 'paid to exchange',
      positive: null,
    },
    {
      label: 'Current Streak',
      value: currentStreak.type === 'none'
        ? '—'
        : `${currentStreak.count} ${currentStreak.type === 'win' ? 'wins' : 'losses'}`,
      sub: currentStreak.type === 'none' ? 'No trades yet' : 'in a row',
      positive: currentStreak.type === 'win' ? true : currentStreak.type === 'loss' ? false : null,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-zinc-900 border rounded-lg p-5 ${card.highlight ? 'border-zinc-700' : 'border-zinc-800'}`}
        >
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">{card.label}</p>
          <p className={`text-2xl font-bold tabular-nums ${
            card.positive === true ? 'text-emerald-400' :
            card.positive === false ? 'text-red-400' :
            'text-white'
          }`}>
            {card.value}
          </p>
          <p className="text-zinc-500 text-xs mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}
