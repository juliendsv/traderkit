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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Trades</h1>
        <p className="text-zinc-400 text-sm mt-0.5">All imported trades</p>
      </div>
      <TradesTable trades={(trades ?? []) as Parameters<typeof TradesTable>[0]['trades']} />
    </div>
  )
}
