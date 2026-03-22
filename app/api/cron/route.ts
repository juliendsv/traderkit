import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { syncExchange } from '@/lib/sync'
import { Database } from '@/lib/supabase/types'

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role for cron — bypasses RLS to access all users' exchanges
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: exchanges, error } = await supabase
    .from('exchanges')
    .select('id, user_id, exchange_name, api_key_encrypted, api_secret_encrypted, last_synced_at')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch exchanges' }, { status: 500 })
  }

  if (!exchanges?.length) {
    return NextResponse.json({ message: 'No active exchanges to sync', synced: 0 })
  }

  // Sync all exchanges (sequential to avoid rate limits)
  const results = []
  for (const exchange of exchanges) {
    const result = await syncExchange(supabase, exchange)
    results.push(result)
  }

  const totalImported = results.reduce((sum, r) => sum + r.trades_imported, 0)
  const errors = results.filter((r) => r.error)

  console.log(`[cron] Synced ${exchanges.length} exchanges, imported ${totalImported} trades, ${errors.length} errors`)

  return NextResponse.json({
    synced: exchanges.length,
    trades_imported: totalImported,
    errors: errors.length,
  })
}
