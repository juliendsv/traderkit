import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_LIMIT = 500
const DEFAULT_LIMIT = 100

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)

  const limit = Math.min(parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10), MAX_LIMIT)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  const since = searchParams.get('since')
  const until = searchParams.get('until')
  const pair = searchParams.get('pair')
  const side = searchParams.get('side')

  if (isNaN(limit) || limit < 1) {
    return NextResponse.json({ error: 'limit must be a positive integer' }, { status: 400 })
  }
  if (isNaN(offset) || offset < 0) {
    return NextResponse.json({ error: 'offset must be a non-negative integer' }, { status: 400 })
  }
  if (side && side !== 'buy' && side !== 'sell') {
    return NextResponse.json({ error: 'side must be "buy" or "sell"' }, { status: 400 })
  }

  let query = supabase
    .from('trades')
    .select('id, pair, base_currency, quote_currency, side, amount, price, fee, fee_currency, pnl, pnl_currency, opened_at, exchange_id', { count: 'exact' })
    .eq('user_id', user.id)
    .order('opened_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (since) query = query.gte('opened_at', since)
  if (until) query = query.lte('opened_at', until)
  if (pair) query = query.eq('pair', pair)
  if (side) query = query.eq('side', side)

  const { data: trades, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }

  return NextResponse.json({
    trades: trades ?? [],
    total: count ?? 0,
    limit,
    offset,
  })
}
