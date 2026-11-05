import { describe, it, expect } from 'vitest'
import { BookBuilder } from './book-builder.js'

describe('BookBuilder', () => {
  it('applies snapshot and returns top levels', () => {
    const builder = new BookBuilder()
    builder.applySnapshot({
      bids: [[100000, 1.0], [99900, 2.0], [99800, 3.0]],
      asks: [[100100, 1.5], [100200, 2.5], [100300, 3.5]],
    })
    
    const bids = builder.getTopBids(2)
    const asks = builder.getTopAsks(2)
    
    expect(bids).toEqual([[100000, 1.0], [99900, 2.0]])
    expect(asks).toEqual([[100100, 1.5], [100200, 2.5]])
  })

  it('applies updates correctly', () => {
    const builder = new BookBuilder()
    builder.applySnapshot({
      bids: [[100000, 1.0], [99900, 2.0]],
      asks: [[100100, 1.5], [100200, 2.5]],
    })
    
    builder.applyUpdate({
      bids: [[100000, 0], [99800, 5.0]], // remove 100000, add 99800
      asks: [[100100, 3.0]], // update volume
    })
    
    const bids = builder.getTopBids(10)
    const asks = builder.getTopAsks(10)
    
    expect(bids.find(b => b[0] === 100000)).toBeUndefined()
    expect(bids.find(b => b[0] === 99800)?.[1]).toBe(5.0)
    expect(asks.find(a => a[0] === 100100)?.[1]).toBe(3.0)
  })

  it('limits to 300 levels', () => {
    const builder = new BookBuilder()
    const manyBids = Array.from({ length: 500 }, (_, i) => [100000 - i, 1.0] as [number, number])
    const manyAsks = Array.from({ length: 500 }, (_, i) => [100100 + i, 1.0] as [number, number])
    
    builder.applySnapshot({ bids: manyBids, asks: manyAsks })
    
    expect(builder.getTopBids().length).toBe(300)
    expect(builder.getTopAsks().length).toBe(300)
    expect(builder.getTopBids(300)[0][0]).toBe(100000)
    expect(builder.getTopAsks(300)[0][0]).toBe(100100)
  })

  it('computes mid price and spread', () => {
    const builder = new BookBuilder()
    builder.applySnapshot({
      bids: [[100000, 1.0]],
      asks: [[100100, 1.0]],
    })
    
    expect(builder.getMidPrice()).toBe(100050)
    expect(builder.getSpread()).toBe(100)
  })

  it('computes imbalance', () => {
    const builder = new BookBuilder()
    builder.applySnapshot({
      bids: [[100000, 2.0]],
      asks: [[100100, 1.0]],
    })
    
    // (2 - 1) / (2 + 1) = 1/3
    expect(builder.getImbalance()).toBeCloseTo(1/3)
  })
})
