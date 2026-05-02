import ccxt, { type Trade, type Exchange, type Conversion } from 'ccxt'
import type { NormalizedTrade } from './kraken'

export type BinanceVariant = 'binance' | 'binanceus' | 'binanceusdm'

export const BINANCE_VARIANT_LABELS: Record<BinanceVariant, string> = {
  binance: 'Binance (Global)',
  binanceus: 'Binance US',
  binanceusdm: 'Binance USD-M Futures',
}

// Epoch timestamps for each variant (when the exchange launched)
const VARIANT_EPOCH: Record<BinanceVariant, number> = {
  binance: new Date('2017-07-14').getTime(),
  binanceus: new Date('2019-09-18').getTime(),
  binanceusdm: new Date('2019-09-13').getTime(),
}

// Binance Flexible Earn tokens use an LD prefix (LDBNB = liquid deposit BNB)
// These are NOT spot trades — they represent earn/staking positions.
export function isBinanceEarnToken(symbol: string): boolean {
  return symbol.startsWith('LD') && symbol.length > 2 && /^[A-Z]/.test(symbol[2])
}

/**
 * Strips Binance earn/staking prefixes to get the tradeable base symbol.
 *   LDBNB → BNB   (Flexible Earn BNB)
 *   LDETH → ETH
 *   BTC   → BTC   (unchanged)
 */
export function binanceBaseSymbol(symbol: string): string {
  if (isBinanceEarnToken(symbol)) return symbol.slice(2)
  return symbol
}

function createExchange(variant: BinanceVariant, apiKey: string, apiSecret: string): Exchange {
  // ccxt exports each exchange as a named class on the module object
  const ExchangeClass = (ccxt as unknown as Record<string, new (opts: object) => Exchange>)[variant]
  return new ExchangeClass({ apiKey, secret: apiSecret, enableRateLimit: true })
}

/**
 * Validates Binance API keys by calling fetchBalance().
 * Throws if keys are invalid or the exchange is unreachable.
 */
export async function validateBinanceKeys(
  variant: BinanceVariant,
  apiKey: string,
  apiSecret: string
): Promise<void> {
  const exchange = createExchange(variant, apiKey, apiSecret)
  await exchange.fetchBalance()
}

/**
 * Fetches live balances from a Binance exchange.
 * Returns currency → total amount, excluding zero balances.
 * Earn tokens (LD-prefix) are included so the assets page can show them,
 * but they'll be merged under their base symbol by binanceBaseSymbol().
 */
export async function fetchBinanceBalances(
  variant: BinanceVariant,
  apiKey: string,
  apiSecret: string
): Promise<Map<string, number>> {
  const exchange = createExchange(variant, apiKey, apiSecret)
  const raw = await exchange.fetchBalance()
  const balances = new Map<string, number>()
  const totals = (raw.total ?? {}) as unknown as Record<string, number>
  for (const [currency, amount] of Object.entries(totals)) {
    if (typeof amount === 'number' && amount > 0) {
      balances.set(currency, amount)
    }
  }
  return balances
}

// Binance spot trade history: max 1000 per call, some endpoints limited to 7-day windows.
// USD-M Futures: 30-day windows.
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function windowSize(variant: BinanceVariant): number {
  return variant === 'binanceusdm' ? THIRTY_DAYS_MS : SEVEN_DAYS_MS
}

function normalizeTrade(raw: Trade): NormalizedTrade | null {
  if (!raw.id || !raw.symbol || !raw.side || !raw.amount || !raw.price) return null

  // Strip futures contract qualifier: 'BTC/USDT:USDT' → 'BTC/USDT'
  const pairStr = raw.symbol.split(':')[0]
  const [base, quote] = pairStr.split('/')
  if (!base || !quote) return null

  // Earn/staking tokens are not real trades — exclude from P&L
  if (isBinanceEarnToken(base)) return null

  return {
    external_id: raw.id,
    pair: pairStr,
    base_currency: base,
    quote_currency: quote,
    side: raw.side as 'buy' | 'sell',
    amount: raw.amount,
    price: raw.price,
    fee: raw.fee?.cost ?? 0,
    fee_currency: raw.fee?.currency ?? quote,
    opened_at: new Date(raw.timestamp ?? Date.now()),
    raw_data: raw as unknown as Record<string, unknown>,
  }
}

/**
 * Fetches all trades from a Binance exchange since a given timestamp.
 * Paginates in 7-day windows (spot) or 30-day windows (futures) because
 * Binance's API limits time-range queries to those windows when no symbol is specified.
 */
export async function fetchBinanceTrades(
  variant: BinanceVariant,
  apiKey: string,
  apiSecret: string,
  since?: number // ms timestamp; undefined = full backfill from exchange epoch
): Promise<NormalizedTrade[]> {
  const exchange = createExchange(variant, apiKey, apiSecret)
  const windowMs = windowSize(variant)
  const now = Date.now()
  const allTrades: NormalizedTrade[] = []

  let windowStart = since ?? VARIANT_EPOCH[variant]

  while (windowStart < now) {
    const windowEnd = Math.min(windowStart + windowMs - 1, now)
    let cursor = windowStart

    while (true) {
      const raw = await exchange.fetchMyTrades(undefined, cursor, 1000, {
        endTime: windowEnd,
      })

      if (!raw || raw.length === 0) break

      for (const trade of raw) {
        const normalized = normalizeTrade(trade)
        if (normalized) allTrades.push(normalized)
      }

      if (raw.length < 1000) break

      const last = raw[raw.length - 1]
      if (!last.timestamp) break
      cursor = last.timestamp + 1
      if (cursor >= windowEnd) break
    }

    windowStart = windowEnd + 1
  }

  allTrades.sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime())
  return allTrades
}

/**
 * Fetches Binance Convert (instant-swap) trade history.
 * These do NOT appear in fetchMyTrades and must be fetched separately.
 * Results are normalized into the same NormalizedTrade schema; external_id
 * is prefixed with "convert_" to avoid collisions with regular trade IDs.
 * Not applicable to USD-M Futures (returns empty).
 */
export async function fetchBinanceConvertTrades(
  variant: BinanceVariant,
  apiKey: string,
  apiSecret: string,
  since?: number
): Promise<NormalizedTrade[]> {
  // USD-M Futures does not have a Convert product
  if (variant === 'binanceusdm') return []

  const exchange = createExchange(variant, apiKey, apiSecret)
  if (!exchange.has['fetchConvertTradeHistory']) return []

  const allTrades: NormalizedTrade[] = []
  const now = Date.now()
  let windowStart = since ?? VARIANT_EPOCH[variant]

  while (windowStart < now) {
    const windowEnd = Math.min(windowStart + THIRTY_DAYS_MS - 1, now)

    try {
      const raw: Conversion[] = await exchange.fetchConvertTradeHistory(undefined, windowStart, 1000, {
        endTime: windowEnd,
      })

      if (raw && raw.length > 0) {
        for (const conv of raw) {
          if (!conv.id || !conv.fromCurrency || !conv.toCurrency || !conv.fromAmount || !conv.price) continue
          if (isBinanceEarnToken(conv.fromCurrency) || isBinanceEarnToken(conv.toCurrency)) continue

          // Represent as: selling fromCurrency to get toCurrency
          // pair = "FROM/TO", side = "sell" (giving away FROM at the given price)
          allTrades.push({
            external_id: `convert_${conv.id}`,
            pair: `${conv.fromCurrency}/${conv.toCurrency}`,
            base_currency: conv.fromCurrency,
            quote_currency: conv.toCurrency,
            side: 'sell',
            amount: conv.fromAmount,
            price: conv.price,
            fee: conv.fee ?? 0,
            fee_currency: conv.toCurrency,
            opened_at: new Date(conv.timestamp ?? Date.now()),
            raw_data: conv as unknown as Record<string, unknown>,
          })
        }
      }
    } catch {
      // Convert history may not be enabled on all accounts — skip silently
    }

    windowStart = windowEnd + 1
  }

  allTrades.sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime())
  return allTrades
}

export interface NormalizedTransfer {
  external_id: string
  currency: string
  amount: number
  type: 'deposit' | 'withdrawal'
  status: string
  tx_hash: string | null
  address: string | null
  occurred_at: Date
  raw_data: Record<string, unknown>
}

/**
 * Fetches deposits and withdrawals from a Binance exchange.
 * These are NOT trades — they represent capital transfers in/out of the account.
 * Not applicable to USD-M Futures (returns empty).
 */
export async function fetchBinanceTransfers(
  variant: BinanceVariant,
  apiKey: string,
  apiSecret: string,
  since?: number
): Promise<NormalizedTransfer[]> {
  if (variant === 'binanceusdm') return []

  const exchange = createExchange(variant, apiKey, apiSecret)
  const all: NormalizedTransfer[] = []

  const [deposits, withdrawals] = await Promise.allSettled([
    exchange.fetchDeposits(undefined, since, 1000),
    exchange.fetchWithdrawals(undefined, since, 1000),
  ])

  if (deposits.status === 'fulfilled') {
    for (const d of deposits.value ?? []) {
      if (!d.id || !d.currency || d.amount == null) continue
      all.push({
        external_id: `dep_${d.id}`,
        currency: d.currency,
        amount: d.amount,
        type: 'deposit',
        status: d.status ?? 'unknown',
        tx_hash: (d as unknown as Record<string, string>).txid ?? null,
        address: d.address ?? null,
        occurred_at: new Date((d.timestamp as number) ?? Date.now()),
        raw_data: d as unknown as Record<string, unknown>,
      })
    }
  }

  if (withdrawals.status === 'fulfilled') {
    for (const w of withdrawals.value ?? []) {
      if (!w.id || !w.currency || w.amount == null) continue
      all.push({
        external_id: `wdw_${w.id}`,
        currency: w.currency,
        amount: w.amount,
        type: 'withdrawal',
        status: w.status ?? 'unknown',
        tx_hash: (w as unknown as Record<string, string>).txid ?? null,
        address: w.address ?? null,
        occurred_at: new Date((w.timestamp as number) ?? Date.now()),
        raw_data: w as unknown as Record<string, unknown>,
      })
    }
  }

  all.sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime())
  return all
}
