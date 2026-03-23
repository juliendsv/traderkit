import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/trades/route'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseMock } from '../helpers/mock-supabase'
import { FIXTURE_TRADES } from '../fixtures'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

/** Fields the dashboard trades page displays (subset of the full API response). */
const DASHBOARD_FIELDS = ['id', 'pair', 'side', 'amount', 'price', 'fee', 'pnl', 'opened_at'] as const

describe('GET /api/trades', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        tables: {
          trades: { data: [...FIXTURE_TRADES].reverse(), error: null, count: FIXTURE_TRADES.length },
        },
      }) as never,
    )
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never,
    )
    const res = await GET(new NextRequest('http://localhost/api/trades'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 for invalid limit', async () => {
    const res = await GET(new NextRequest('http://localhost/api/trades?limit=0'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for negative offset', async () => {
    const res = await GET(new NextRequest('http://localhost/api/trades?offset=-1'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid side', async () => {
    const res = await GET(new NextRequest('http://localhost/api/trades?side=unknown'))
    expect(res.status).toBe(400)
  })

  it('returns trades with pagination metadata', async () => {
    const res = await GET(new NextRequest('http://localhost/api/trades'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('trades')
    expect(body).toHaveProperty('total', FIXTURE_TRADES.length)
    expect(body).toHaveProperty('limit', 100)
    expect(body).toHaveProperty('offset', 0)
    expect(Array.isArray(body.trades)).toBe(true)
  })

  it('caps limit at 500', async () => {
    const res = await GET(new NextRequest('http://localhost/api/trades?limit=9999'))
    expect(res.status).toBe(200)
    expect((await res.json()).limit).toBe(500)
  })

  // ─── Consistency: API == dashboard ───────────────────────────────────────────

  it('returns the same trades (and order) the dashboard trades page shows', async () => {
    const res = await GET(new NextRequest('http://localhost/api/trades'))
    const { trades: apiTrades } = await res.json()

    // Dashboard trades page: queries same table ordered by opened_at DESC
    // Our mock returns trades in reverse order (DESC) to match that
    const expectedOrder = [...FIXTURE_TRADES].reverse().map((t) => t.id)
    expect(apiTrades.map((t: { id: string }) => t.id)).toEqual(expectedOrder)
  })

  it('API trades contain every field the dashboard page displays', async () => {
    const res = await GET(new NextRequest('http://localhost/api/trades'))
    const { trades: apiTrades } = await res.json()

    for (const trade of apiTrades) {
      for (const field of DASHBOARD_FIELDS) {
        expect(trade).toHaveProperty(field)
      }
    }
  })
})
