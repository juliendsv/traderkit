import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PnlCalendar } from '@/components/calendar/PnlCalendar'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: trades } = await supabase
    .from('trades')
    .select('opened_at, pnl')
    .eq('user_id', user.id)
    .eq('side', 'sell')
    .not('pnl', 'is', null)

  const dayMap: Record<string, number> = {}
  for (const t of trades ?? []) {
    const date = t.opened_at.slice(0, 10)
    dayMap[date] = (dayMap[date] ?? 0) + (t.pnl as number)
  }

  const year = new Date().getFullYear()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">Calendar</h1>
          <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>Daily P&L heatmap</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-300"
          style={{ border: '1px solid rgba(66,71,84,0.30)' }}
        >
          {year}
        </div>
      </div>

      <div
        className="rounded-xl p-8"
        style={{
          backgroundColor: '#0f131f',
          border: '1px solid rgba(66,71,84,0.10)',
          boxShadow: '0 0 0 1px rgba(66,71,84,0.05), 0px 12px 32px rgba(0,0,0,0.4)',
        }}
      >
        <PnlCalendar dayMap={dayMap} />
      </div>

      {/* Footer meta */}
      <div className="mt-8 pt-6 flex justify-between items-center" style={{ borderTop: '1px solid rgba(66,71,84,0.05)' }}>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: '#475569' }}>System Status: Optimal</span>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: '#475569' }}>Version 4.2.0-K</span>
      </div>
    </div>
  )
}
