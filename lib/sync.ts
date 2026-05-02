import { decrypt } from './crypto'
import { fetchKrakenTrades } from './ccxt/kraken'
import {
  fetchBinanceTrades,
  fetchBinanceConvertTrades,
  fetchBinanceTransfers,
  type BinanceVariant,
} from './ccxt/binance'
import {
  fetchCoinbaseTrades,
  fetchCoinbaseRetailTrades,
  fetchCoinbaseTransfers,
} from './ccxt/coinbase'
import { computePnlFifo, TradeForPnl } from './pnl/fifo'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Json } from './supabase/types'

const BINANCE_VARIANTS = new Set<string>(['binance', 'binanceus', 'binanceusdm'])
const COINBASE_EXCHANGES = new Set<string>(['coinbase'])

type SyncResult = {
  exchange_id: string
  exchange_name: string
  trades_imported: number
  transfers_imported?: number
  error?: string
}

/**
 * Syncs trades (and transfers for Binance/Coinbase) for a single exchange row.
 * Fetches new trades via ccxt, computes FIFO P&L, and upserts into the trades table.
 */
export async function syncExchange(
  supabase: SupabaseClient<Database>,
  exchange: {
    id: string
    user_id: string
    exchange_name: string
    api_key_encrypted: string
    api_secret_encrypted: string
    last_synced_at: string | null
  }
): Promise<SyncResult> {
  const { id: exchange_id, user_id, exchange_name } = exchange

  try {
    const apiKey = decrypt(exchange.api_key_encrypted)
    const apiSecret = decrypt(exchange.api_secret_encrypted)

    const since = exchange.last_synced_at
      ? new Date(exchange.last_synced_at).getTime()
      : undefined

    // ── Fetch new trades ─────────────────────────────────────────────────────
    let newTrades
    if (exchange_name === 'kraken') {
      newTrades = await fetchKrakenTrades(apiKey, apiSecret, since)
    } else if (BINANCE_VARIANTS.has(exchange_name)) {
      const variant = exchange_name as BinanceVariant
      const [spotTrades, convertTrades] = await Promise.all([
        fetchBinanceTrades(variant, apiKey, apiSecret, since),
        fetchBinanceConvertTrades(variant, apiKey, apiSecret, since),
      ])
      // Merge spot + convert, deduplicate by external_id, sort ascending
      const seen = new Set<string>()
      newTrades = [...spotTrades, ...convertTrades]
        .filter((t) => {
          if (seen.has(t.external_id)) return false
          seen.add(t.external_id)
          return true
        })
        .sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime())
    } else if (COINBASE_EXCHANGES.has(exchange_name)) {
      const [advancedTrades, retailTrades] = await Promise.all([
        fetchCoinbaseTrades(apiKey, apiSecret, since),
        fetchCoinbaseRetailTrades(apiKey, apiSecret, since),
      ])
      // Merge advanced + retail, deduplicate by external_id, sort ascending
      // IDs never collide: retail_ prefix on retail entries ensures uniqueness
      const seen = new Set<string>()
      newTrades = [...advancedTrades, ...retailTrades]
        .filter((t) => {
          if (seen.has(t.external_id)) return false
          seen.add(t.external_id)
          return true
        })
        .sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime())
    } else {
      throw new Error(`Unsupported exchange: ${exchange_name}`)
    }

    // ── Sync transfers for Binance/Coinbase ──────────────────────────────────
    let transfers_imported = 0
    if (BINANCE_VARIANTS.has(exchange_name)) {
      transfers_imported = await syncBinanceTransfers(
        supabase,
        exchange_id,
        user_id,
        exchange_name as BinanceVariant,
        apiKey,
        apiSecret,
        since
      )
    } else if (COINBASE_EXCHANGES.has(exchange_name)) {
      transfers_imported = await syncCoinbaseTransfers(
        supabase,
        exchange_id,
        user_id,
        apiKey,
        apiSecret,
        since
      )
    }

    if (newTrades.length === 0) {
      await supabase.from('exchanges').update({ last_synced_at: new Date().toISOString() }).eq('id', exchange_id)
      await supabase.from('sync_logs').insert({ exchange_id, status: 'success', trades_imported: 0 })
      return { exchange_id, exchange_name, trades_imported: 0, transfers_imported }
    }

    // ── FIFO P&L: re-run over affected currencies ────────────────────────────
    const newCurrencies = [...new Set(newTrades.map((t) => t.base_currency))]

    const { data: existingTrades } = await supabase
      .from('trades')
      .select('id, external_id, pair, base_currency, quote_currency, side, amount, price, fee, opened_at')
      .eq('user_id', user_id)
      .in('base_currency', newCurrencies)
      .order('opened_at', { ascending: true })

    const existingSet = new Set((existingTrades ?? []).map((t) => t.external_id))
    const dedupedNew = newTrades.filter((t) => !existingSet.has(t.external_id))

    const allForCurrency: TradeForPnl[] = [
      ...(existingTrades ?? []).map((t) => ({
        external_id: t.external_id,
        pair: t.pair,
        base_currency: t.base_currency,
        quote_currency: t.quote_currency,
        side: t.side,
        amount: Number(t.amount),
        price: Number(t.price),
        fee: Number(t.fee),
        opened_at: new Date(t.opened_at),
      })),
      ...dedupedNew.map((t) => ({
        external_id: t.external_id,
        pair: t.pair,
        base_currency: t.base_currency,
        quote_currency: t.quote_currency,
        side: t.side,
        amount: t.amount,
        price: t.price,
        fee: t.fee,
        opened_at: t.opened_at,
      })),
    ].sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime())

    const withPnl = computePnlFifo(allForCurrency)

    const newExternalIds = new Set(dedupedNew.map((t) => t.external_id))
    const toUpsert = withPnl.filter((t) => newExternalIds.has(t.external_id))

    if (toUpsert.length > 0) {
      const rows = toUpsert.map((t) => {
        const raw = newTrades.find((n) => n.external_id === t.external_id)
        return {
          user_id,
          exchange_id,
          external_id: t.external_id,
          pair: t.pair,
          base_currency: t.base_currency,
          quote_currency: t.quote_currency,
          side: t.side,
          amount: t.amount,
          price: t.price,
          fee: t.fee,
          fee_currency: raw?.fee_currency ?? t.quote_currency,
          pnl: t.pnl,
          pnl_currency: t.pnl_currency,
          opened_at: t.opened_at.toISOString(),
          raw_data: (raw?.raw_data ?? null) as Json | null,
        }
      })

      const { error: upsertError } = await supabase
        .from('trades')
        .upsert(rows, { onConflict: 'exchange_id,external_id' })

      if (upsertError) throw upsertError
    }

    await supabase.from('exchanges').update({ last_synced_at: new Date().toISOString() }).eq('id', exchange_id)
    await supabase.from('sync_logs').insert({ exchange_id, status: 'success', trades_imported: toUpsert.length })

    return { exchange_id, exchange_name, trades_imported: toUpsert.length, transfers_imported }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    try { await supabase.from('sync_logs').insert({ exchange_id, status: 'error', error: message }) } catch { /* ignore */ }
    return { exchange_id, exchange_name, trades_imported: 0, error: message }
  }
}

/**
 * Fetches and upserts Binance deposits/withdrawals into the transfers table.
 * Returns the number of new transfers imported.
 */
async function syncBinanceTransfers(
  supabase: SupabaseClient<Database>,
  exchange_id: string,
  user_id: string,
  variant: BinanceVariant,
  apiKey: string,
  apiSecret: string,
  since?: number
): Promise<number> {
  try {
    const transfers = await fetchBinanceTransfers(variant, apiKey, apiSecret, since)
    if (transfers.length === 0) return 0

    // Fetch existing transfer IDs so we can deduplicate
    const { data: existing } = await supabase
      .from('transfers')
      .select('external_id')
      .eq('exchange_id', exchange_id)

    const existingSet = new Set((existing ?? []).map((t) => t.external_id))
    const newTransfers = transfers.filter((t) => !existingSet.has(t.external_id))

    if (newTransfers.length === 0) return 0

    const rows = newTransfers.map((t) => ({
      user_id,
      exchange_id,
      external_id: t.external_id,
      currency: t.currency,
      amount: t.amount,
      type: t.type,
      status: t.status,
      tx_hash: t.tx_hash,
      address: t.address,
      occurred_at: t.occurred_at.toISOString(),
      raw_data: t.raw_data as Json,
    }))

    await supabase.from('transfers').upsert(rows, { onConflict: 'exchange_id,external_id' })
    return newTransfers.length
  } catch {
    // Transfer sync failure should not fail the whole trade sync
    return 0
  }
}

/**
 * Fetches and upserts Coinbase deposits/withdrawals into the transfers table.
 * Returns the number of new transfers imported.
 */
async function syncCoinbaseTransfers(
  supabase: SupabaseClient<Database>,
  exchange_id: string,
  user_id: string,
  apiKey: string,
  apiSecret: string,
  since?: number
): Promise<number> {
  try {
    const transfers = await fetchCoinbaseTransfers(apiKey, apiSecret, since)
    if (transfers.length === 0) return 0

    const { data: existing } = await supabase
      .from('transfers')
      .select('external_id')
      .eq('exchange_id', exchange_id)

    const existingSet = new Set((existing ?? []).map((t) => t.external_id))
    const newTransfers = transfers.filter((t) => !existingSet.has(t.external_id))

    if (newTransfers.length === 0) return 0

    const rows = newTransfers.map((t) => ({
      user_id,
      exchange_id,
      external_id: t.external_id,
      currency: t.currency,
      amount: t.amount,
      type: t.type,
      status: t.status,
      tx_hash: t.tx_hash,
      address: t.address,
      occurred_at: t.occurred_at.toISOString(),
      raw_data: t.raw_data as Json,
    }))

    await supabase.from('transfers').upsert(rows, { onConflict: 'exchange_id,external_id' })
    return newTransfers.length
  } catch {
    // Transfer sync failure should not fail the whole trade sync
    return 0
  }
}
