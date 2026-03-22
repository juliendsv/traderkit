import ccxt, { type Trade } from 'ccxt'

export interface NormalizedTrade {
  external_id: string
  pair: string
  base_currency: string
  quote_currency: string
  side: 'buy' | 'sell'
  amount: number
  price: number
  fee: number
  fee_currency: string
  opened_at: Date
  raw_data: Record<string, unknown>
}

/**
 * Creates a Kraken exchange instance and validates connectivity.
 * Throws if the keys are invalid or the exchange is unreachable.
 */
export async function validateKrakenKeys(apiKey: string, apiSecret: string): Promise<void> {
  const exchange = new ccxt.kraken({ apiKey, secret: apiSecret })
  // fetchBalance() requires read permission and validates key authenticity
  await exchange.fetchBalance()
}

/**
 * Fetches all trades from Kraken since a given timestamp.
 * Paginates automatically until no more results are returned.
 */
export async function fetchKrakenTrades(
  apiKey: string,
  apiSecret: string,
  since?: number // milliseconds timestamp
): Promise<NormalizedTrade[]> {
  const exchange = new ccxt.kraken({
    apiKey,
    secret: apiSecret,
    enableRateLimit: true,
    rateLimit: 1000, // 1 req/sec for Kraken
  })

  const allTrades: NormalizedTrade[] = []
  let cursor = since ?? undefined
  const limit = 1000

  // Paginate until Kraken returns fewer results than limit
  while (true) {
    const raw = await exchange.fetchMyTrades(undefined, cursor, limit)
    if (!raw || raw.length === 0) break

    for (const trade of raw) {
      const normalized = normalizeTrade(trade)
      if (normalized) allTrades.push(normalized)
    }

    if (raw.length < limit) break

    // Advance cursor past the last trade timestamp
    const last = raw[raw.length - 1]
    if (!last.timestamp) break
    cursor = last.timestamp + 1
  }

  // Sort ascending by time — required for FIFO
  allTrades.sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime())
  return allTrades
}

function normalizeTrade(raw: Trade): NormalizedTrade | null {
  if (!raw.id || !raw.symbol || !raw.side || !raw.amount || !raw.price) return null

  const [base, quote] = raw.symbol.split('/')
  if (!base || !quote) return null

  const fee = raw.fee?.cost ?? 0
  const feeCurrency = raw.fee?.currency ?? quote

  return {
    external_id: raw.id,
    pair: raw.symbol,
    base_currency: base,
    quote_currency: quote,
    side: raw.side as 'buy' | 'sell',
    amount: raw.amount,
    price: raw.price,
    fee,
    fee_currency: feeCurrency,
    opened_at: new Date(raw.timestamp ?? Date.now()),
    raw_data: raw as unknown as Record<string, unknown>,
  }
}
