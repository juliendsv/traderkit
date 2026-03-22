import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeStats } from '@/lib/pnl/stats'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { PnlChart } from '@/components/dashboard/PnlChart'
import { DayOfWeekChart } from '@/components/dashboard/DayOfWeekChart'
import { BestWorstTokens } from '@/components/dashboard/BestWorstTokens'
import { SyncButton } from '@/components/dashboard/SyncButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Fetch last 90 days of trades
  const since = new Date()
  since.setDate(since.getDate() - 90)

  const { data: trades } = await supabase
    .from('trades')
    .select('id, pair, base_currency, quote_currency, side, amount, price, fee, pnl, opened_at')
    .eq('user_id', user.id)
    .gte('opened_at', since.toISOString())
    .order('opened_at', { ascending: true })

  // Fetch connected exchanges
  const { data: exchanges } = await supabase
    .from('exchanges')
    .select('id, exchange_name, is_active, last_synced_at')
    .eq('user_id', user.id)

  const stats = computeStats(trades ?? [])
  const hasExchange = (exchanges ?? []).length > 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Overview</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Last 90 days</p>
        </div>
        <div className="flex items-center gap-3">
          {exchanges && exchanges.length > 0 && (
            <div className="flex items-center gap-2">
              {exchanges.map((ex) => (
                <span key={ex.id} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full capitalize">
                  {ex.exchange_name}
                  {ex.last_synced_at && (
                    <span className="ml-1 text-zinc-500">
                      · {new Date(ex.last_synced_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
          <SyncButton hasExchange={hasExchange} />
        </div>
      </div>

      {!hasExchange && (
        <div className="bg-zinc-900 border border-zinc-700 border-dashed rounded-lg p-8 text-center">
          <p className="text-zinc-300 font-medium">No exchange connected</p>
          <p className="text-zinc-500 text-sm mt-1 mb-4">
            Connect your Kraken account to start importing trades automatically.
          </p>
          <a
            href="/dashboard/connect"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors"
          >
            Connect Kraken →
          </a>
        </div>
      )}

      {hasExchange && (
        <>
          <StatsCards stats={stats} />

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">Cumulative P&L</h2>
            <PnlChart data={stats.cumulativePnlByDate} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <h2 className="text-sm font-medium text-zinc-300 mb-4">P&L by Day of Week</h2>
              <DayOfWeekChart data={stats.pnlByDayOfWeek} />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-medium text-zinc-300">Token Performance</h2>
              <BestWorstTokens stats={stats} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
