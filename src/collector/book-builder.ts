import { BookLevel, BookSnapshot, BookUpdate, MAX_LEVELS, TradeMessage } from './types.js'

export class BookBuilder {
  private bids: Map<number, number> = new Map()
  private asks: Map<number, number> = new Map()
  private lastUpdateId = 0

  applySnapshot(snapshot: BookSnapshot): void {
    this.bids.clear()
    this.asks.clear()
    for (const [price, volume] of snapshot.bids) {
      if (volume > 0) this.bids.set(price, volume)
    }
    for (const [price, volume] of snapshot.asks) {
      if (volume > 0) this.asks.set(price, volume)
    }
  }

  applyUpdate(update: BookUpdate): void {
    if (update.bids) {
      for (const [price, volume] of update.bids) {
        if (volume === 0) {
          this.bids.delete(price)
        } else {
          this.bids.set(price, volume)
        }
      }
    }
    if (update.asks) {
      for (const [price, volume] of update.asks) {
        if (volume === 0) {
          this.asks.delete(price)
        } else {
          this.asks.set(price, volume)
        }
      }
    }
  }

  getTopBids(maxLevels: number = MAX_LEVELS): BookLevel[] {
    const sorted = Array.from(this.bids.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, maxLevels)
    return sorted
  }

  getTopAsks(maxLevels: number = MAX_LEVELS): BookLevel[] {
    const sorted = Array.from(this.asks.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, maxLevels)
    return sorted
  }

  getSnapshot(): BookSnapshot {
    return {
      bids: this.getTopBids(),
      asks: this.getTopAsks(),
    }
  }

  getMidPrice(): number | null {
    const bestBid = this.getTopBids(1)[0]
    const bestAsk = this.getTopAsks(1)[0]
    if (!bestBid || !bestAsk) return null
    return (bestBid[0] + bestAsk[0]) / 2
  }

  getSpread(): number | null {
    const bestBid = this.getTopBids(1)[0]
    const bestAsk = this.getTopAsks(1)[0]
    if (!bestBid || !bestAsk) return null
    return bestAsk[0] - bestBid[0]
  }

  getImbalance(): number | null {
    const bestBid = this.getTopBids(1)[0]
    const bestAsk = this.getTopAsks(1)[0]
    if (!bestBid || !bestAsk) return null
    const bidVol = bestBid[1]
    const askVol = bestAsk[1]
    const total = bidVol + askVol
    if (total === 0) return 0
    return (bidVol - askVol) / total
  }
}

export function parseKrakenTrade(arr: unknown[]): TradeMessage | null {
  if (!Array.isArray(arr) || arr.length < 4) return null
  const [, data, ,] = arr
  if (!Array.isArray(data)) return null
  const trade = data[0]
  if (!trade || typeof trade !== 'object') return null
  const t = trade as Record<string, unknown>
  return {
    price: Number(t.price),
    volume: Number(t.volume),
    time: Number(t.time),
    side: t.side === 'b' ? 'buy' : 'sell',
    orderType: String(t.ordertype),
    misc: String(t.misc),
  }
}

export function parseKrakenBook(arr: unknown[]): { snapshot: BookSnapshot } | { update: BookUpdate } | null {
  if (!Array.isArray(arr) || arr.length < 4) return null
  const [, data, , channel] = arr
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (channel !== 'book') return null
  if (d.as) {
    return { snapshot: { bids: (d.bs as unknown[]) as BookLevel[], asks: (d.as as unknown[]) as BookLevel[] } }
  }
  return { update: { bids: d.b as BookLevel[] | undefined, asks: d.a as BookLevel[] | undefined } }
}
