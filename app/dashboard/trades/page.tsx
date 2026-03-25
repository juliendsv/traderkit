import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TradesTable } from '@/components/trades/TradesTable'

export default async function TradesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: trades } = await supabase
    .from('trades')
    .select('id, pair, side, amount, price, fee, pnl, opened_at')
    .eq('user_id', user.id)
    .order('opened_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Trades</h1>
          <p className="text-sm mt-1" style={{ color: '#8c909f' }}>All imported trades across connected exchanges</p>
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: '#0f131f',
          border: '1px solid rgba(66,71,84,0.05)',
          boxShadow: '0px 12px 32px rgba(0,0,0,0.4)',
        }}
      >
        <TradesTable trades={(trades ?? []) as Parameters<typeof TradesTable>[0]['trades']} />
      </div>
    </div>
  )
}
