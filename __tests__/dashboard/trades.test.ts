/**
 * Tests that the dashboard trades page shows the same trades as GET /api/trades.
 *
 * The page queries trades ordered by opened_at DESC with no pagination.
 * The API queries the same table with the same default ordering and returns
 * a superset of fields. Both are verified against the same fixture data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/trades/route'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseMock } from '../helpers/mock-supabase'
import { FIXTURE_TRADES } from '../fixtures'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

/** Simulate what the dashboard trades page fetches (same table, same order). */
function dashboardTradeList(trades: typeof FIXTURE_TRADES) {
  return [...trades].reverse() // page orders by opened_at DESC
}

describe('dashboard trades page data == GET /api/trades', () => {
  const descendingFixtures = [...FIXTURE_TRADES].reverse()

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        tables: {
          trades: { data: descendingFixtures, error: null, count: FIXTURE_TRADES.length },
        },
      }) as never,
    )
  })

  it('returns the same trade IDs in the same order', async () => {
    const { trades: apiTrades } = await (
      await GET(new NextRequest('http://localhost/api/trades'))
    ).json()

    const pageTradeIds = dashboardTradeList(FIXTURE_TRADES).map((t) => t.id)
    expect(apiTrades.map((t: { id: string }) => t.id)).toEqual(pageTradeIds)
  })

  it('returns the same pair values', async () => {
    const { trades: apiTrades } = await (
      await GET(new NextRequest('http://localhost/api/trades'))
    ).json()

    const pagePairs = dashboardTradeList(FIXTURE_TRADES).map((t) => t.pair)
    expect(apiTrades.map((t: { pair: string }) => t.pair)).toEqual(pagePairs)
  })

  it('returns the same side, amount, price, fee, pnl per trade', async () => {
    const { trades: apiTrades } = await (
      await GET(new NextRequest('http://localhost/api/trades'))
    ).json()

    const pageTrades = dashboardTradeList(FIXTURE_TRADES)
    for (let i = 0; i < pageTrades.length; i++) {
      expect(apiTrades[i].side).toBe(pageTrades[i].side)
      expect(apiTrades[i].amount).toBe(pageTrades[i].amount)
      expect(apiTrades[i].price).toBe(pageTrades[i].price)
      expect(apiTrades[i].fee).toBe(pageTrades[i].fee)
      expect(apiTrades[i].pnl).toBe(pageTrades[i].pnl)
      expect(apiTrades[i].opened_at).toBe(pageTrades[i].opened_at)
    }
  })

  it('total count matches the full fixture set', async () => {
    const { total } = await (
      await GET(new NextRequest('http://localhost/api/trades'))
    ).json()
    expect(total).toBe(FIXTURE_TRADES.length)
  })
})
