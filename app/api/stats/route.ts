import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeStats } from '@/lib/pnl/stats'

const DEFAULT_DAYS = 90

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const sinceParam = searchParams.get('since')

  let since: Date
  if (sinceParam) {
    since = new Date(sinceParam)
    if (isNaN(since.getTime())) {
      return NextResponse.json({ error: 'since must be a valid ISO date string' }, { status: 400 })
    }
  } else {
    since = new Date()
    since.setDate(since.getDate() - DEFAULT_DAYS)
  }

  const { data: trades, error } = await supabase
    .from('trades')
    .select('id, pair, base_currency, quote_currency, side, amount, price, fee, pnl, opened_at')
    .eq('user_id', user.id)
    .gte('opened_at', since.toISOString())
    .order('opened_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }

  const stats = computeStats(trades ?? [])

  return NextResponse.json({ stats, since: since.toISOString() })
}
