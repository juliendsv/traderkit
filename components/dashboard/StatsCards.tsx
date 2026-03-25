import { DashboardStats } from '@/lib/pnl/stats'

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, ...opts }).format(n)
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const { totalPnl, winRate, totalTrades, avgWin, avgLoss, currentStreak } = stats

  const cards = [
    {
      label: 'Total P&L',
      value: (totalPnl >= 0 ? '+' : '') + fmt(totalPnl),
      sub: `${totalTrades} closed trades`,
      accentColor: '#4edea3',
      accentGlow: 'rgba(78,222,163,0.3)',
      valueColor: '#4edea3',
    },
    {
      label: 'Win Rate',
      value: pct(winRate),
      sub: `${stats.winningTrades}W / ${stats.losingTrades}L`,
      accentColor: '#adc6ff',
      accentGlow: 'rgba(173,198,255,0.3)',
      valueColor: 'white',
    },
    {
      label: 'Avg Win / Loss',
      value: null,
      avgWin: fmt(avgWin),
      avgLoss: fmt(Math.abs(avgLoss)),
      sub: null,
      accentColor: 'rgba(66,71,84,0.20)',
      accentGlow: null,
      valueColor: 'white',
    },
    {
      label: 'Current Streak',
      value: currentStreak.type === 'none' ? '—' : String(currentStreak.count),
      valueSuffix: currentStreak.type === 'win' ? ' Wins' : currentStreak.type === 'loss' ? ' Losses' : '',
      sub: null,
      accentColor: '#ff5451',
      accentGlow: 'rgba(255,84,81,0.3)',
      valueColor: currentStreak.type === 'win' ? '#4edea3' : currentStreak.type === 'loss' ? '#ff5451' : 'white',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl p-6 relative overflow-hidden"
          style={{ backgroundColor: '#1b1f2c' }}
        >
          {/* Colored top accent bar */}
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{
              backgroundColor: card.accentColor,
              boxShadow: card.accentGlow ? `0 0 12px ${card.accentGlow}` : undefined,
            }}
          />
          <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: '#c2c6d6' }}>{card.label}</p>

          {card.avgWin !== undefined ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xl" style={{ color: '#4edea3' }}>{card.avgWin}</span>
                <span className="text-[10px]" style={{ color: '#c2c6d6' }}>Win</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xl" style={{ color: '#ffb4ab' }}>{card.avgLoss}</span>
                <span className="text-[10px]" style={{ color: '#c2c6d6' }}>Loss</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-extrabold tracking-tighter" style={{ color: card.valueColor }}>
                {card.value}
              </h3>
              {card.valueSuffix && (
                <span className="text-lg font-medium text-white">{card.valueSuffix}</span>
              )}
            </div>
          )}

          {card.sub && (
            <p className="mt-4 text-[10px] font-medium italic" style={{ color: '#c2c6d6' }}>{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
