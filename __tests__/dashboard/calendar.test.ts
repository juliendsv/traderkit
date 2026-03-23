/**
 * Tests that the dashboard calendar page produces the same daily P&L map as
 * GET /api/calendar when operating on the same underlying data.
 *
 * The page aggregates sell trades inline; the API does the same aggregation
 * and returns sorted entries. Both are verified here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/calendar/route'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseMock } from '../helpers/mock-supabase'
import { FIXTURE_TRADES } from '../fixtures'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

/** Mirrors the exact dayMap logic in app/dashboard/calendar/page.tsx */
function pageCalendarDayMap(trades: typeof FIXTURE_TRADES): Record<string, number> {
  const dayMap: Record<string, number> = {}
  for (const t of trades) {
    if (t.side !== 'sell' || t.pnl === null) continue
    const date = t.opened_at.slice(0, 10)
    dayMap[date] = (dayMap[date] ?? 0) + (t.pnl as number)
  }
  return dayMap
}

describe('dashboard calendar page data == GET /api/calendar', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        tables: { trades: { data: FIXTURE_TRADES, error: null } },
      }) as never,
    )
  })

  it('API data entries match the page dayMap keys', async () => {
    const { data: apiData } = await (
      await GET(new NextRequest('http://localhost/api/calendar'))
    ).json()

    const pageDayMap = pageCalendarDayMap(FIXTURE_TRADES)
    const pageDates = Object.keys(pageDayMap).sort()
    const apiDates = apiData.map((d: { date: string }) => d.date)

    expect(apiDates).toEqual(pageDates)
  })

  it('API pnl values match the page dayMap values', async () => {
    const { data: apiData } = await (
      await GET(new NextRequest('http://localhost/api/calendar'))
    ).json()

    const pageDayMap = pageCalendarDayMap(FIXTURE_TRADES)

    for (const entry of apiData as { date: string; pnl: number }[]) {
      const expected = Math.round((pageDayMap[entry.date] ?? 0) * 100) / 100
      expect(entry.pnl).toBeCloseTo(expected, 5)
    }
  })

  it('API data and page dayMap cover the same number of distinct days', async () => {
    const { data: apiData } = await (
      await GET(new NextRequest('http://localhost/api/calendar'))
    ).json()

    const pageDayMap = pageCalendarDayMap(FIXTURE_TRADES)

    expect(apiData).toHaveLength(Object.keys(pageDayMap).length)
  })

  it('full API response matches page-computed data exactly', async () => {
    const { data: apiData } = await (
      await GET(new NextRequest('http://localhost/api/calendar'))
    ).json()

    const pageDayMap = pageCalendarDayMap(FIXTURE_TRADES)
    const expectedData = Object.entries(pageDayMap)
      .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date))

    expect(apiData).toEqual(expectedData)
  })
})
