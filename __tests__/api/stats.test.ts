import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/stats/route'
import { computeStats } from '@/lib/pnl/stats'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseMock } from '../helpers/mock-supabase'
import { FIXTURE_TRADES, FIXTURE_TRADE_ROWS } from '../fixtures'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ tables: { trades: { data: FIXTURE_TRADES, error: null } } }) as never,
    )
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never,
    )
    const res = await GET(new NextRequest('http://localhost/api/stats'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 for an invalid since date', async () => {
    const res = await GET(new NextRequest('http://localhost/api/stats?since=not-a-date'))
    expect(res.status).toBe(400)
  })

  it('returns stats and since timestamp', async () => {
    const res = await GET(new NextRequest('http://localhost/api/stats'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('stats')
    expect(body).toHaveProperty('since')
  })

  it('respects custom since parameter', async () => {
    const since = '2026-01-01T00:00:00.000Z'
    const res = await GET(new NextRequest(`http://localhost/api/stats?since=${since}`))
    expect(res.status).toBe(200)
    expect((await res.json()).since).toBe(since)
  })

  // ─── Consistency: API == dashboard ───────────────────────────────────────────

  it('returns the same stats the dashboard page computes', async () => {
    const res = await GET(new NextRequest('http://localhost/api/stats'))
    const { stats: apiStats } = await res.json()

    // Dashboard page: fetches trades then calls computeStats — identical call
    const dashboardStats = computeStats(FIXTURE_TRADE_ROWS)

    expect(apiStats).toEqual(dashboardStats)
  })
})
