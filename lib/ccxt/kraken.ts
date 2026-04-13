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
 * Returns the current account balances from Kraken.
 * Maps base currency symbol → total balance (free + on orders).
 * Only includes assets with a non-zero balance.
 */
export async function fetchKrakenBalances(
  apiKey: string,
  apiSecret: string
): Promise<Map<string, number>> {
  const exchange = new ccxt.kraken({
    apiKey,
    secret: apiSecret,
    enableRateLimit: true,
    rateLimit: 1000,
  })

  const raw = await exchange.fetchBalance()
  const balances = new Map<string, number>()

  // raw.total is a flat { currency: amount } map, already normalized
  // (e.g. XETH → ETH, XXBT → BTC) by ccxt's commonCurrencies map
  const totals = (raw.total ?? {}) as unknown as Record<string, number>
  for (const [currency, amount] of Object.entries(totals)) {
    if (typeof amount === 'number' && amount > 0) {
      balances.set(currency, amount)
    }
  }

  return balances
}

const FIAT = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'])
const STABLECOINS = new Set(['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'GUSD'])

/**
 * Strips Kraken staking/variant suffixes to get a tradeable base symbol.
 *   SOL.S   → SOL   (staked Solana)
 *   SOL03.S → SOL   (Kraken internal staking notation)
 *   ETH2.S  → ETH   (old staked ETH notation)
 *   DOT.S   → DOT
 *   SOL     → SOL   (unchanged)
 */
export function krakenBaseSymbol(symbol: string): string {
  // Remove trailing digits + .S/.M/.F (e.g. ETH2.S → ETH, SOL.S → SOL)
  return symbol.replace(/\d*\.(S|M|F)$/, '').replace(/\d+$/, '')
}

/**
 * Fetches current USD prices for the given symbols using Kraken's public API.
 * Stablecoins are returned as 1.0. Fiat currencies and unresolvable symbols are omitted.
 * Kraken staking tokens (e.g. SOL.S) are looked up using their base symbol price.
 * No API keys required.
 */
export async function fetchKrakenPrices(symbols: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>()

  // USD itself and stablecoins don't need a price lookup
  for (const s of symbols) {
    if (s === 'USD' || STABLECOINS.has(s)) prices.set(s, 1)
  }

  // Build a deduplicated set of base symbols to actually fetch
  // Map: baseSymbol → [original symbols that map to it]
  const baseToOriginals = new Map<string, string[]>()
  for (const s of symbols) {
    if (prices.has(s) || FIAT.has(s)) continue
    const base = krakenBaseSymbol(s)
    if (!baseToOriginals.has(base)) baseToOriginals.set(base, [])
    baseToOriginals.get(base)!.push(s)
  }

  if (baseToOriginals.size === 0) return prices

  const exchange = new ccxt.kraken({ enableRateLimit: true })
  const pairs = Array.from(baseToOriginals.keys()).map((b) => `${b}/USD`)

  const fetchedPrices = new Map<string, number>()

  try {
    const tickers = await exchange.fetchTickers(pairs)
    for (const [pair, ticker] of Object.entries(tickers)) {
      const base = pair.split('/')[0]
      if (typeof ticker.last === 'number' && ticker.last > 0) {
        fetchedPrices.set(base, ticker.last)
      }
    }
  } catch {
    // Batch failed — try each individually so one bad pair doesn't block the rest
    await Promise.allSettled(
      Array.from(baseToOriginals.keys()).map(async (base) => {
        try {
          const ticker = await exchange.fetchTicker(`${base}/USD`)
          if (typeof ticker.last === 'number' && ticker.last > 0) {
            fetchedPrices.set(base, ticker.last)
          }
        } catch {
          // Not available vs USD — skip
        }
      })
    )
  }

  // Map fetched prices back to original symbols (including .S variants)
  for (const [base, originals] of baseToOriginals.entries()) {
    const price = fetchedPrices.get(base)
    if (price !== undefined) {
      for (const orig of originals) {
        prices.set(orig, price)
      }
    }
  }

  return prices
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
