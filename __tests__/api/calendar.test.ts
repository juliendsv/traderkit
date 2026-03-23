import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/calendar/route'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseMock } from '../helpers/mock-supabase'
import { FIXTURE_TRADES } from '../fixtures'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

/** Mirrors the inline aggregation the dashboard calendar page does. */
function buildDayMap(trades: typeof FIXTURE_TRADES) {
  const sellsWithPnl = trades.filter((t) => t.side === 'sell' && t.pnl !== null)
  const map: Record<string, number> = {}
  for (const t of sellsWithPnl) {
    const date = t.opened_at.slice(0, 10)
    map[date] = (map[date] ?? 0) + (t.pnl as number)
  }
  return Object.entries(map)
    .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

describe('GET /api/calendar', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        tables: { trades: { data: FIXTURE_TRADES, error: null } },
      }) as never,
    )
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never,
    )
    const res = await GET(new NextRequest('http://localhost/api/calendar'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 for an invalid year', async () => {
    const res = await GET(new NextRequest('http://localhost/api/calendar?year=abc'))
    expect(res.status).toBe(400)
  })

  it('returns an array of date/pnl entries', async () => {
    const res = await GET(new NextRequest('http://localhost/api/calendar'))
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(Array.isArray(data)).toBe(true)
    for (const entry of data) {
      expect(entry).toHaveProperty('date')
      expect(entry).toHaveProperty('pnl')
    }
  })

  it('only includes sell trades with a pnl value', async () => {
    const res = await GET(new NextRequest('http://localhost/api/calendar'))
    const { data } = await res.json()

    const buyTradeIds = FIXTURE_TRADES.filter((t) => t.side === 'buy').map((t) => t.id)
    // None of the dates should come exclusively from buy trades
    // (simple check: total entries == number of distinct sell-with-pnl dates)
    const sellDates = new Set(
      FIXTURE_TRADES.filter((t) => t.side === 'sell' && t.pnl !== null).map((t) =>
        t.opened_at.slice(0, 10),
      ),
    )
    expect(data).toHaveLength(sellDates.size)
    expect(buyTradeIds).toBeDefined() // used above, suppress unused warning
  })

  it('returns entries sorted ascending by date', async () => {
    const res = await GET(new NextRequest('http://localhost/api/calendar'))
    const { data } = await res.json()
    const dates: string[] = data.map((d: { date: string }) => d.date)
    expect(dates).toEqual([...dates].sort())
  })

  // ─── Consistency: API == dashboard ───────────────────────────────────────────

  it('returns the same day map the dashboard calendar page computes', async () => {
    const res = await GET(new NextRequest('http://localhost/api/calendar'))
    const { data: apiData } = await res.json()

    const dashboardData = buildDayMap(FIXTURE_TRADES)

    expect(apiData).toEqual(dashboardData)
  })
})
