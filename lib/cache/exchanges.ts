import { cacheLife, cacheTag } from 'next/cache'
import { fetchKrakenBalances, fetchKrakenPrices } from '../ccxt/kraken'
import { fetchBinanceBalances, type BinanceVariant } from '../ccxt/binance'
import { fetchCoinbaseBalances } from '../ccxt/coinbase'

/**
 * Cached wrappers around exchange API calls.
 *
 * Each function uses the 'use cache' directive so Next.js caches the result
 * across requests. Cache entries are keyed on the function's arguments, so
 * each user+exchange combination gets its own entry.
 *
 * Return types are plain objects (Record<string, number>) because Map is not
 * serializable by React's cache serialization — callers convert back as needed.
 *
 * Cache lifetime: 'minutes' → revalidates every 1 minute in the background,
 * serves stale for up to 5 minutes from the client router cache.
 */

export async function cachedKrakenBalances(
  userId: string,
  apiKey: string,
  apiSecret: string
): Promise<Record<string, number>> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`balances-${userId}`, `balances-${userId}-kraken`)
  const map = await fetchKrakenBalances(apiKey, apiSecret)
  return Object.fromEntries(map)
}

export async function cachedBinanceBalances(
  userId: string,
  variant: BinanceVariant,
  apiKey: string,
  apiSecret: string
): Promise<Record<string, number>> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`balances-${userId}`, `balances-${userId}-${variant}`)
  const map = await fetchBinanceBalances(variant, apiKey, apiSecret)
  return Object.fromEntries(map)
}

export async function cachedCoinbaseBalances(
  userId: string,
  apiKey: string,
  apiSecret: string
): Promise<Record<string, number>> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`balances-${userId}`, `balances-${userId}-coinbase`)
  const map = await fetchCoinbaseBalances(apiKey, apiSecret)
  return Object.fromEntries(map)
}

/**
 * Prices are public (no user credentials) so the cache is shared across all
 * users for the same symbol list. Revalidates every minute in the background.
 */
export async function cachedKrakenPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  'use cache'
  cacheLife('minutes')
  cacheTag('kraken-prices')
  const map = await fetchKrakenPrices(symbols)
  return Object.fromEntries(map)
}
