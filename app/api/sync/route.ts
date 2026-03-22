import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncExchange } from '@/lib/sync'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: exchanges, error } = await supabase
    .from('exchanges')
    .select('id, user_id, exchange_name, api_key_encrypted, api_secret_encrypted, last_synced_at')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error || !exchanges?.length) {
    return NextResponse.json({ error: 'No active exchanges found' }, { status: 404 })
  }

  const results = await Promise.allSettled(
    exchanges.map((exchange) => syncExchange(supabase, exchange))
  )

  const summary = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { error: 'Sync failed', trades_imported: 0 }
  )

  const totalImported = summary.reduce((sum, r) => sum + (r.trades_imported ?? 0), 0)
  const errors = summary.filter((r) => r.error)

  return NextResponse.json({
    success: errors.length === 0,
    trades_imported: totalImported,
    exchanges: summary,
  })
}
