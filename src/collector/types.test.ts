import { describe, it, expect } from 'vitest'
import { CollectorRecordSchema, TradeMessageSchema, BookLevelSchema } from './types.js'

describe('Collector types', () => {
  it('validates trade record', () => {
    const record = {
      type: 'trade' as const,
      t: '2026-11-05T12:00:00.000Z',
      price: 100000,
      vol: 0.1,
      side: 'buy' as const,
      id: 'trade-1',
    }
    const result = CollectorRecordSchema.safeParse(record)
    expect(result.success).toBe(true)
  })

  it('validates book record', () => {
    const record = {
      type: 'book' as const,
      t: '2026-11-05T12:00:00.000Z',
      bids: [[99900, 1.5], [99800, 2.0]],
      asks: [[100100, 1.0], [100200, 1.5]],
    }
    const result = CollectorRecordSchema.safeParse(record)
    expect(result.success).toBe(true)
  })

  it('rejects invalid trade side', () => {
    const record = {
      type: 'trade' as const,
      t: '2026-11-05T12:00:00.000Z',
      price: 100000,
      vol: 0.1,
      side: 'invalid',
      id: 'trade-1',
    }
    const result = CollectorRecordSchema.safeParse(record)
    expect(result.success).toBe(false)
  })
})
