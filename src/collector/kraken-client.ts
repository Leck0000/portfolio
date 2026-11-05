import WebSocket from 'ws'
import { BookBuilder, parseKrakenTrade, parseKrakenBook } from './book-builder.js'
import { TradeMessage, BookSnapshot, BookUpdate, CollectorRecord } from './types.js'

const KRAKEN_WS_URL = 'wss://ws.kraken.com'
const PING_INTERVAL = 30_000

export interface KrakenClientOptions {
  onBook: (snapshot: BookSnapshot) => void
  onTrade: (trade: TradeMessage) => void
  onRecord: (record: CollectorRecord) => void
}

export class KrakenClient {
  private ws: WebSocket | null = null
  private bookBuilder = new BookBuilder()
  private options: KrakenClientOptions
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 10
  private pingTimer: ReturnType<typeof setInterval> | null = null

  constructor(options: KrakenClientOptions) {
    this.options = options
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(KRAKEN_WS_URL)
      
      this.ws.onopen = () => {
        console.log('[Kraken] Connected')
        this.reconnectAttempts = 0
        this.subscribe()
        this.startPing()
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data.toString())
          this.handleMessage(msg)
        } catch (e) {
          console.error('[Kraken] Parse error:', e)
        }
      }

      this.ws.onerror = (err) => {
        console.error('[Kraken] WebSocket error:', err)
      }

      this.ws.onclose = () => {
        console.log('[Kraken] Disconnected')
        this.stopPing()
        this.scheduleReconnect()
      }
    })
  }

  private handleMessage(msg: unknown): void {
    if (Array.isArray(msg)) {
      const trade = parseKrakenTrade(msg)
      if (trade) {
        const record: CollectorRecord = {
          type: 'trade',
          t: new Date(trade.time * 1000).toISOString(),
          price: trade.price,
          vol: trade.volume,
          side: trade.side,
          id: `${trade.price}-${trade.volume}-${trade.time}`,
        }
        this.options.onTrade(trade)
        this.options.onRecord(record)
        return
      }

      const book = parseKrakenBook(msg)
      if (book) {
        if ('snapshot' in book) {
          this.bookBuilder.applySnapshot(book.snapshot)
          const snap = this.bookBuilder.getSnapshot()
          const record: CollectorRecord = {
            type: 'book',
            t: new Date().toISOString(),
            bids: snap.bids,
            asks: snap.asks,
          }
          this.options.onBook(snap)
          this.options.onRecord(record)
        } else if ('update' in book) {
          this.bookBuilder.applyUpdate(book.update)
        }
        return
      }

      if (msg && typeof msg === 'object' && 'event' in msg) {
        const e = msg as { event: string }
        if (e.event === 'subscriptionStatus') {
          console.log('[Kraken] Subscription confirmed')
        }
      }
    }
  }

  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify({
      event: 'subscribe',
      pair: ['XBT/USD'],
      subscription: { name: 'trade' },
    }))
    this.ws.send(JSON.stringify({
      event: 'subscribe',
      pair: ['XBT/USD'],
      subscription: { name: 'book', depth: 300 },
    }))
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping()
      }
    }, PING_INTERVAL)
    this.pingTimer.unref()
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Kraken] Max reconnect attempts reached')
      return
    }
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000)
    this.reconnectAttempts++
    console.log(`[Kraken] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    setTimeout(() => this.connect(), delay)
  }

  disconnect(): void {
    this.stopPing()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
