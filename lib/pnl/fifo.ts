export interface TradeForPnl {
  external_id: string
  pair: string
  base_currency: string
  quote_currency: string
  side: 'buy' | 'sell'
  amount: number
  price: number
  fee: number
  opened_at: Date
}

export interface TradeWithPnl extends TradeForPnl {
  pnl: number | null
  pnl_currency: string
}

interface FifoLot {
  amount: number
  price: number
  fee: number // proportional fee allocated to this lot
}

/**
 * Applies FIFO cost basis to compute realized P&L for all sell trades.
 *
 * Rules:
 * - Each BUY creates a lot in the FIFO queue for that base_currency
 * - Each SELL dequeues lots, computing P&L as: (sell_price - cost_price) * amount - fees
 * - Partial fills are handled: a lot can be partially consumed
 * - Input MUST be sorted ascending by opened_at for correctness
 */
export function computePnlFifo(trades: TradeForPnl[]): TradeWithPnl[] {
  // Per base_currency, maintain a queue of open lots
  const queues = new Map<string, FifoLot[]>()

  function getQueue(currency: string): FifoLot[] {
    if (!queues.has(currency)) queues.set(currency, [])
    return queues.get(currency)!
  }

  return trades.map((trade) => {
    const queue = getQueue(trade.base_currency)

    if (trade.side === 'buy') {
      // Push a new lot for this buy
      queue.push({
        amount: trade.amount,
        price: trade.price,
        fee: trade.fee,
      })
      return { ...trade, pnl: null, pnl_currency: trade.quote_currency }
    }

    // SELL — dequeue lots and compute P&L
    let remainingToSell = trade.amount
    let totalCostBasis = 0
    let totalFeeFromBuys = 0

    while (remainingToSell > 0 && queue.length > 0) {
      const lot = queue[0]
      const consumed = Math.min(lot.amount, remainingToSell)

      // Proportional cost basis
      totalCostBasis += consumed * lot.price
      // Proportional fee from buy lot
      totalFeeFromBuys += lot.fee * (consumed / lot.amount)

      lot.amount -= consumed
      remainingToSell -= consumed

      if (lot.amount <= 1e-12) {
        queue.shift()
      }
    }

    const soldAmount = trade.amount - remainingToSell
    const revenue = soldAmount * trade.price
    const pnl = revenue - totalCostBasis - trade.fee - totalFeeFromBuys

    return {
      ...trade,
      pnl: Math.round(pnl * 1e8) / 1e8, // round to 8 decimals
      pnl_currency: trade.quote_currency,
    }
  })
}
