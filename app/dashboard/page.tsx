import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeStats } from '@/lib/pnl/stats'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { PnlChart } from '@/components/dashboard/PnlChart'
import { DayOfWeekChart } from '@/components/dashboard/DayOfWeekChart'
import { BestWorstTokens } from '@/components/dashboard/BestWorstTokens'
import { SyncButton } from '@/components/dashboard/SyncButton'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const since = new Date()
  since.setDate(since.getDate() - 90)

  const { data: trades } = await supabase
    .from('trades')
    .select('id, pair, base_currency, quote_currency, side, amount, price, fee, pnl, opened_at')
    .eq('user_id', user.id)
    .gte('opened_at', since.toISOString())
    .order('opened_at', { ascending: true })

  const { data: exchanges } = await supabase
    .from('exchanges')
    .select('id, exchange_name, is_active, last_synced_at')
    .eq('user_id', user.id)

  const stats = computeStats(trades ?? [])
  const hasExchange = (exchanges ?? []).length > 0
  const lastSynced = exchanges?.find((e) => e.last_synced_at)?.last_synced_at

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-sm mt-1" style={{ color: '#c2c6d6' }}>Last 90 days performance</p>
        </div>
        <div className="flex items-center gap-3">
          {exchanges && exchanges.length > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide"
              style={{
                backgroundColor: '#1b1f2c',
                border: '1px solid rgba(66,71,84,0.10)',
                color: '#c2c6d6',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#00a572' }} />
              <span>
                {exchanges[0].exchange_name} ·{' '}
                {lastSynced
                  ? new Date(lastSynced).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : 'never synced'}
              </span>
            </div>
          )}
          <SyncButton hasExchange={hasExchange} />
        </div>
      </div>

      {!hasExchange && (
        <div
          className="rounded-xl p-10 text-center mb-8"
          style={{
            backgroundColor: '#1b1f2c',
            border: '1px solid rgba(66,71,84,0.10)',
          }}
        >
          <span className="material-symbols-outlined text-4xl mb-4 block" style={{ color: '#424754' }}>extension</span>
          <p className="text-white font-semibold mb-1">No exchange connected</p>
          <p className="text-sm mb-6" style={{ color: '#8c909f' }}>
            Connect your Kraken account to start importing trades automatically.
          </p>
          <Link
            href="/dashboard/connect"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%)', color: '#00285d' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
            Connect Kraken
          </Link>
        </div>
      )}

      {hasExchange && (
        <>
          <StatsCards stats={stats} />

          <div
            className="rounded-xl p-6 mb-8 mt-8"
            style={{ backgroundColor: '#1b1f2c' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-white">Cumulative P&L</h4>
              <span className="text-xs" style={{ color: '#c2c6d6' }}>Last 90 days</span>
            </div>
            <PnlChart data={stats.cumulativePnlByDate} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-xl p-6" style={{ backgroundColor: '#1b1f2c' }}>
              <h4 className="text-lg font-semibold text-white mb-6">P&L by Day of Week</h4>
              <DayOfWeekChart data={stats.pnlByDayOfWeek} />
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: '#1b1f2c' }}>
              <h4 className="text-lg font-semibold text-white mb-6">Token Performance</h4>
              <BestWorstTokens stats={stats} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
