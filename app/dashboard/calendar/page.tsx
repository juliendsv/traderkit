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

  // Aggregate P&L by date
  const dayMap: Record<string, number> = {}
  for (const t of trades ?? []) {
    const date = t.opened_at.slice(0, 10)
    dayMap[date] = (dayMap[date] ?? 0) + (t.pnl as number)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Calendar</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Daily P&L heatmap</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <PnlCalendar dayMap={dayMap} />
      </div>
    </div>
  )
}
