import { decrypt } from './crypto'
import { fetchKrakenTrades } from './ccxt/kraken'
import { computePnlFifo, TradeForPnl } from './pnl/fifo'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Json } from './supabase/types'

type SyncResult = {
  exchange_id: string
  exchange_name: string
  trades_imported: number
  error?: string
}

/**
 * Syncs trades for a single exchange row.
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

    // Fetch new trades from the exchange
    let newTrades
    if (exchange_name === 'kraken') {
      newTrades = await fetchKrakenTrades(apiKey, apiSecret, since)
    } else {
      throw new Error(`Unsupported exchange: ${exchange_name}`)
    }

    if (newTrades.length === 0) {
      await supabase.from('exchanges').update({ last_synced_at: new Date().toISOString() }).eq('id', exchange_id)
      await supabase.from('sync_logs').insert({ exchange_id, status: 'success', trades_imported: 0 })
      return { exchange_id, exchange_name, trades_imported: 0 }
    }

    // For correct FIFO P&L on new sells, we need existing buy positions.
    // Re-run FIFO on all trades for affected currencies.
    const newCurrencies = [...new Set(newTrades.map((t) => t.base_currency))]

    // Fetch existing trades for these currencies (sorted asc by opened_at)
    const { data: existingTrades } = await supabase
      .from('trades')
      .select('id, external_id, pair, base_currency, quote_currency, side, amount, price, fee, opened_at')
      .eq('user_id', user_id)
      .in('base_currency', newCurrencies)
      .order('opened_at', { ascending: true })

    // Merge existing + new trades, deduplicate by external_id, sort asc
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

    // Compute FIFO P&L for all trades
    const withPnl = computePnlFifo(allForCurrency)

    // Upsert only the new trades (with their computed P&L)
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

    // Update last_synced_at and log success
    await supabase.from('exchanges').update({ last_synced_at: new Date().toISOString() }).eq('id', exchange_id)
    await supabase.from('sync_logs').insert({ exchange_id, status: 'success', trades_imported: toUpsert.length })

    return { exchange_id, exchange_name, trades_imported: toUpsert.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    try { await supabase.from('sync_logs').insert({ exchange_id, status: 'error', error: message }) } catch { /* ignore */ }
    return { exchange_id, exchange_name, trades_imported: 0, error: message }
  }
}
