import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')

  let query = supabase
    .from('trades')
    .select('opened_at, pnl')
    .eq('user_id', user.id)
    .eq('side', 'sell')
    .not('pnl', 'is', null)

  if (year) {
    const y = parseInt(year, 10)
    if (isNaN(y)) {
      return NextResponse.json({ error: 'year must be a valid integer' }, { status: 400 })
    }
    query = query
      .gte('opened_at', `${y}-01-01`)
      .lt('opened_at', `${y + 1}-01-01`)
  }

  const { data: trades, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 })
  }

  const dayMap: Record<string, number> = {}
  for (const t of trades ?? []) {
    const date = (t.opened_at as string).slice(0, 10)
    dayMap[date] = (dayMap[date] ?? 0) + (t.pnl as number)
  }

  const data = Object.entries(dayMap)
    .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({ data })
}
