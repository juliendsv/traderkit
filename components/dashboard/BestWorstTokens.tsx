import { DashboardStats } from '@/lib/pnl/stats'

export function BestWorstTokens({ stats }: { stats: DashboardStats }) {
  const { bestToken, worstToken } = stats

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">Best Token</p>
        {bestToken ? (
          <>
            <p className="text-white font-bold text-xl">{bestToken.symbol}</p>
            <p className="text-emerald-400 text-sm font-medium mt-1">
              +${bestToken.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </>
        ) : (
          <p className="text-zinc-500 text-sm">No data yet</p>
        )}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">Worst Token</p>
        {worstToken ? (
          <>
            <p className="text-white font-bold text-xl">{worstToken.symbol}</p>
            <p className="text-red-400 text-sm font-medium mt-1">
              ${worstToken.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </>
        ) : (
          <p className="text-zinc-500 text-sm">No data yet</p>
        )}
      </div>
    </div>
  )
}
