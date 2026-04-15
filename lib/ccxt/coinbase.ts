import ccxt, { type Trade, type Exchange } from 'ccxt'
import type { NormalizedTrade } from './kraken'

// Coinbase Advanced Trade launched January 2015
const COINBASE_EPOCH = new Date('2015-01-01').getTime()

// Raw ledger types that indicate staking/earn — excluded from P&L
const STAKING_TYPES = new Set([
  'staking_reward',
  'inflation_reward',
  'interest',
  'reward',
])

// Raw ledger types that represent retail Simple Trade buy/sell
const RETAIL_TRADE_TYPES = new Set(['buy', 'sell'])

/**
 * Strips any Coinbase-specific symbol suffixes. Coinbase uses clean ISO symbols
 * (BTC, ETH, SOL) with no prefixes or suffixes, so this is effectively a pass-through.
 * Included for API consistency with krakenBaseSymbol / binanceBaseSymbol.
 */
export function coinbaseBaseSymbol(symbol: string): string {
  return symbol
}

function createExchange(apiKey: string, apiSecret: string): Exchange {
  const ExchangeClass = (ccxt as unknown as Record<string, new (opts: object) => Exchange>)['coinbase']
  return new ExchangeClass({ apiKey, secret: apiSecret, enableRateLimit: true })
}

/**
 * Validates Coinbase API credentials by calling fetchBalance().
 * Supports both CDP keys (apiKey = "organizations/…", secret = "-----BEGIN…")
 * and legacy HMAC keys. CCXT auto-detects the format.
 */
export async function validateCoinbaseKeys(apiKey: string, apiSecret: string): Promise<void> {
  const exchange = createExchange(apiKey, apiSecret)
  await exchange.fetchBalance()
}

/**
 * Returns live balances from Coinbase Advanced Trade.
 * Maps base currency symbol → total balance, excluding zero balances.
 */
export async function fetchCoinbaseBalances(
  apiKey: string,
  apiSecret: string
): Promise<Map<string, number>> {
  const exchange = createExchange(apiKey, apiSecret)
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

function normalizeAdvancedTrade(raw: Trade): NormalizedTrade | null {
  if (!raw.id || !raw.symbol || !raw.side || !raw.amount || !raw.price) return null
  const [base, quote] = raw.symbol.split('/')
  if (!base || !quote) return null

  return {
    external_id: raw.id,
    pair: raw.symbol,
    base_currency: base,
    quote_currency: quote,
    side: raw.side as 'buy' | 'sell',
    amount: raw.amount,
    price: raw.price,
    fee: raw.fee?.cost ?? 0,
    fee_currency: raw.fee?.currency ?? quote,
    opened_at: new Date(raw.timestamp ?? Date.now()),
    // Tag source so UI can distinguish Advanced vs retail trades
    raw_data: { ...(raw as unknown as Record<string, unknown>), _source: 'coinbase_advanced' },
  }
}

/**
 * Fetches all Coinbase Advanced Trade fills since a given timestamp.
 * Uses cursor-based pagination (handled automatically by CCXT's paginate option).
 * Backfills to COINBASE_EPOCH on first connect.
 */
export async function fetchCoinbaseTrades(
  apiKey: string,
  apiSecret: string,
  since?: number
): Promise<NormalizedTrade[]> {
  const exchange = createExchange(apiKey, apiSecret)
  const startMs = since ?? COINBASE_EPOCH

  const rawTrades = await exchange.fetchMyTrades(undefined, startMs, undefined, {
    paginate: true,
  })

  const trades: NormalizedTrade[] = []
  for (const raw of rawTrades ?? []) {
    const normalized = normalizeAdvancedTrade(raw as Trade)
    if (normalized) trades.push(normalized)
  }

  trades.sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime())
  return trades
}

/**
 * Fetches Coinbase retail (Simple Trade) buy/sell transactions via the ledger API.
 * Retail trades use Coinbase's instant-conversion flow with embedded spreads —
 * no order book, no separate fee line. They are normalized into the unified trade
 * schema with external_id prefixed "retail_" and raw_data._source = "coinbase_retail"
 * so callers can distinguish them from Advanced Trade fills.
 *
 * Staking rewards, earn payouts, and transfers are explicitly excluded.
 */
export async function fetchCoinbaseRetailTrades(
  apiKey: string,
  apiSecret: string,
  since?: number
): Promise<NormalizedTrade[]> {
  const exchange = createExchange(apiKey, apiSecret)
  const startMs = since ?? COINBASE_EPOCH

  const ledger = await exchange.fetchLedger(undefined, startMs, undefined, {
    paginate: true,
  })

  const trades: NormalizedTrade[] = []

  for (const entry of ledger ?? []) {
    const info = (entry as unknown as Record<string, unknown>).info as Record<string, unknown>
    if (!info) continue

    const rawType = info.type as string | undefined
    if (!rawType || !RETAIL_TRADE_TYPES.has(rawType)) continue
    if (STAKING_TYPES.has(rawType)) continue

    const amountObj = info.amount as Record<string, string> | undefined
    const nativeObj = info.native_amount as Record<string, string> | undefined

    if (!amountObj || !nativeObj) continue

    const baseCurrency = amountObj.currency
    const quoteCurrency = nativeObj.currency
    const baseAmount = Math.abs(parseFloat(amountObj.amount ?? '0'))
    const quoteAmount = Math.abs(parseFloat(nativeObj.amount ?? '0'))

    if (!baseCurrency || !quoteCurrency || baseAmount <= 0 || quoteAmount <= 0) continue
    // Skip fiat-to-fiat entries (shouldn't exist, but guard anyway)
    if (baseCurrency === quoteCurrency) continue

    const price = quoteAmount / baseAmount
    const side = rawType as 'buy' | 'sell'
    const id = (entry as unknown as Record<string, string>).id

    trades.push({
      external_id: `retail_${id}`,
      pair: `${baseCurrency}/${quoteCurrency}`,
      base_currency: baseCurrency,
      quote_currency: quoteCurrency,
      side,
      amount: baseAmount,
      price,
      // Retail spread is baked into the price — no discrete fee line
      fee: 0,
      fee_currency: quoteCurrency,
      opened_at: new Date((entry as unknown as Record<string, number>).timestamp ?? Date.now()),
      raw_data: { ...info, _source: 'coinbase_retail' },
    })
  }

  trades.sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime())
  return trades
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
 * Fetches deposits and withdrawals from Coinbase.
 * Crypto deposits/withdrawals are fetched via fetchDepositsWithdrawals (v2 transactions API).
 * Staking reward entries are excluded.
 * Returns transfer events (NOT trades) so cost basis survives cross-exchange moves.
 */
export async function fetchCoinbaseTransfers(
  apiKey: string,
  apiSecret: string,
  since?: number
): Promise<NormalizedTransfer[]> {
  const exchange = createExchange(apiKey, apiSecret)
  const all: NormalizedTransfer[] = []

  // fetchDepositsWithdrawals covers both fiat and crypto in/out via v2 API
  let txns: Awaited<ReturnType<typeof exchange.fetchDepositsWithdrawals>> = []
  try {
    txns = await exchange.fetchDepositsWithdrawals(undefined, since, undefined)
  } catch {
    // Some accounts may not have any transfers — skip silently
    return all
  }

  for (const tx of txns ?? []) {
    if (!tx.id || !tx.currency || tx.amount == null) continue

    const info = (tx as unknown as Record<string, unknown>).info as Record<string, unknown>
    const rawType = info?.type as string | undefined

    // Exclude staking rewards and earn payouts
    if (rawType && STAKING_TYPES.has(rawType)) continue
    // Exclude retail buys/sells (those are in the trades table)
    if (rawType && RETAIL_TRADE_TYPES.has(rawType)) continue

    const isDeposit = (tx.type as string) === 'deposit' || tx.amount > 0
    const transferType: 'deposit' | 'withdrawal' = isDeposit ? 'deposit' : 'withdrawal'
    const prefix = isDeposit ? 'dep' : 'wdw'

    all.push({
      external_id: `${prefix}_${tx.id}`,
      currency: tx.currency,
      amount: Math.abs(tx.amount),
      type: transferType,
      status: tx.status ?? 'unknown',
      tx_hash: (tx as unknown as Record<string, string>).txid ?? null,
      address: tx.address ?? null,
      occurred_at: new Date((tx.timestamp as number) ?? Date.now()),
      raw_data: tx as unknown as Record<string, unknown>,
    })
  }

  all.sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime())
  return all
}
