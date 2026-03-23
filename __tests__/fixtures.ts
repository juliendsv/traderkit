import type { TradeRow } from '@/lib/pnl/stats'

export const MOCK_USER = { id: 'user-1', email: 'test@example.com' }

/** Full DB row shape — superset of every field any route or page selects. */
export const FIXTURE_TRADES = [
  {
    id: 'trade-1',
    pair: 'BTC/USD',
    base_currency: 'BTC',
    quote_currency: 'USD',
    side: 'buy' as const,
    amount: 0.5,
    price: 40000,
    fee: 20,
    fee_currency: 'USD',
    pnl: null,
    pnl_currency: null,
    opened_at: '2026-01-10T10:00:00.000Z',
    exchange_id: 'exchange-1',
    user_id: 'user-1',
  },
  {
    id: 'trade-2',
    pair: 'BTC/USD',
    base_currency: 'BTC',
    quote_currency: 'USD',
    side: 'sell' as const,
    amount: 0.5,
    price: 45000,
    fee: 22.5,
    fee_currency: 'USD',
    // FIFO: (45000 - 40000) * 0.5 - 22.5 - 20 = 2457.5
    pnl: 2457.5,
    pnl_currency: 'USD',
    opened_at: '2026-01-15T10:00:00.000Z',
    exchange_id: 'exchange-1',
    user_id: 'user-1',
  },
  {
    id: 'trade-3',
    pair: 'ETH/USD',
    base_currency: 'ETH',
    quote_currency: 'USD',
    side: 'buy' as const,
    amount: 1,
    price: 3000,
    fee: 15,
    fee_currency: 'USD',
    pnl: null,
    pnl_currency: null,
    opened_at: '2026-01-20T10:00:00.000Z',
    exchange_id: 'exchange-1',
    user_id: 'user-1',
  },
  {
    id: 'trade-4',
    pair: 'ETH/USD',
    base_currency: 'ETH',
    quote_currency: 'USD',
    side: 'sell' as const,
    amount: 1,
    price: 2800,
    fee: 14,
    fee_currency: 'USD',
    // FIFO: (2800 - 3000) * 1 - 14 - 15 = -229
    pnl: -229,
    pnl_currency: 'USD',
    opened_at: '2026-01-25T10:00:00.000Z',
    exchange_id: 'exchange-1',
    user_id: 'user-1',
  },
]

/** The subset of fields that computeStats() requires (TradeRow shape). */
export const FIXTURE_TRADE_ROWS: TradeRow[] = FIXTURE_TRADES.map((t) => ({
  id: t.id,
  pair: t.pair,
  base_currency: t.base_currency,
  quote_currency: t.quote_currency,
  side: t.side,
  amount: t.amount,
  price: t.price,
  fee: t.fee,
  pnl: t.pnl,
  opened_at: t.opened_at,
}))

export const FIXTURE_EXCHANGES = [
  {
    id: 'exchange-1',
    exchange_name: 'kraken',
    is_active: true,
    last_synced_at: '2026-03-20T00:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
    user_id: 'user-1',
  },
]
