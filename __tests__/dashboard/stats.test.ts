/**
 * Tests that the dashboard overview page produces the same statistics as
 * GET /api/stats when operating on the same underlying data.
 *
 * The page fetches trades directly from Supabase and calls computeStats().
 * The API route does the same. Both paths are exercised here with identical
 * mock data so any divergence between them will fail.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/stats/route'
import { computeStats } from '@/lib/pnl/stats'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseMock } from '../helpers/mock-supabase'
import { FIXTURE_TRADES, FIXTURE_TRADE_ROWS, FIXTURE_EXCHANGES } from '../fixtures'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

describe('dashboard overview page data == GET /api/stats', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        tables: {
          trades: { data: FIXTURE_TRADES, error: null },
          exchanges: { data: FIXTURE_EXCHANGES, error: null },
        },
      }) as never,
    )
  })

  it('computes the same totalPnl', async () => {
    const { stats: apiStats } = await (await GET(new NextRequest('http://localhost/api/stats'))).json()
    const pageStats = computeStats(FIXTURE_TRADE_ROWS)
    expect(apiStats.totalPnl).toBe(pageStats.totalPnl)
  })

  it('computes the same winRate', async () => {
    const { stats: apiStats } = await (await GET(new NextRequest('http://localhost/api/stats'))).json()
    const pageStats = computeStats(FIXTURE_TRADE_ROWS)
    expect(apiStats.winRate).toBe(pageStats.winRate)
  })

  it('computes the same totalTrades', async () => {
    const { stats: apiStats } = await (await GET(new NextRequest('http://localhost/api/stats'))).json()
    const pageStats = computeStats(FIXTURE_TRADE_ROWS)
    expect(apiStats.totalTrades).toBe(pageStats.totalTrades)
  })

  it('computes the same bestToken and worstToken', async () => {
    const { stats: apiStats } = await (await GET(new NextRequest('http://localhost/api/stats'))).json()
    const pageStats = computeStats(FIXTURE_TRADE_ROWS)
    expect(apiStats.bestToken).toEqual(pageStats.bestToken)
    expect(apiStats.worstToken).toEqual(pageStats.worstToken)
  })

  it('computes the same cumulativePnlByDate series', async () => {
    const { stats: apiStats } = await (await GET(new NextRequest('http://localhost/api/stats'))).json()
    const pageStats = computeStats(FIXTURE_TRADE_ROWS)
    expect(apiStats.cumulativePnlByDate).toEqual(pageStats.cumulativePnlByDate)
  })

  it('full stats objects are identical', async () => {
    const { stats: apiStats } = await (await GET(new NextRequest('http://localhost/api/stats'))).json()
    const pageStats = computeStats(FIXTURE_TRADE_ROWS)
    expect(apiStats).toEqual(pageStats)
  })
})
